<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use App\Models\Lease;
use App\Models\Property;
use App\Models\PropertyDelegation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Illuminate\Support\Str;

class NoticeController extends Controller
{
    /**
     * Liste des préavis avec filtres
     */
public function index(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Non authentifié'], 401);
    }

    // Vérifier le rôle
    $isLandlord = $user->hasRole('landlord');
    $isCoOwner = $user->hasRole('co_owner');
    $isTenant = $user->hasRole('tenant');

    if (!$isLandlord && !$isCoOwner && !$isTenant) {
        return response()->json(['message' => 'Accès non autorisé'], 403);
    }

    // Query de base
    $query = Notice::query();

    // Récupérer les IDs des biens autorisés
    $authorizedPropertyIds = [];

    if ($isLandlord) {
        // Pour un propriétaire : ses propres biens
        $authorizedPropertyIds = Property::where('landlord_id', $user->id)
            ->orWhere('user_id', $user->id)
            ->pluck('id')
            ->toArray();

        \Log::info('Landlord property IDs:', ['ids' => $authorizedPropertyIds]);

    } elseif ($isCoOwner) {
        // Pour un co-propriétaire : les biens délégués
        $coOwner = $user->coOwner;
        if ($coOwner) {
            $authorizedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            \Log::info('Co-owner delegated property IDs:', ['ids' => $authorizedPropertyIds]);
        }
    } elseif ($isTenant) {
        // Pour un locataire : on filtre par tenant_id, pas par propriété
        $tenant = $user->tenant;
        if ($tenant) {
            $query->where('tenant_id', $tenant->id);
        }
    }

    // IMPORTANT: Filtrer par propriétés autorisées (sauf pour les locataires)
    if (!empty($authorizedPropertyIds) && !$isTenant) {
        $query->whereIn('property_id', $authorizedPropertyIds);
    } elseif (!$isTenant && empty($authorizedPropertyIds)) {
        // Pas de biens autorisés, retourner vide
        \Log::warning('Aucun bien autorisé trouvé pour l\'utilisateur', [
            'user_id' => $user->id,
            'role' => $isLandlord ? 'landlord' : ($isCoOwner ? 'co_owner' : 'other')
        ]);

        return response()->json([
            'notices' => [],
            'totalNotices' => 0,
            'pendingNotices' => 0,
            'confirmedNotices' => 0,
            'cancelledNotices' => 0,
            'activeLeases' => 0,
            'properties' => []
        ]);
    }

    // Log pour déboguer
    \Log::info('Filtrage des préavis', [
        'user_id' => $user->id,
        'role' => $isLandlord ? 'landlord' : ($isCoOwner ? 'co_owner' : 'tenant'),
        'authorized_property_ids' => $authorizedPropertyIds,
        'query_count_before' => $query->count()
    ]);

    // Charger les relations
    $query->with(['property', 'tenant.user', 'landlord']);

    // Statistiques globales (uniquement sur les biens autorisés)
    $totalNotices = $query->count();
    $pendingNotices = (clone $query)->where('status', 'pending')->count();
    $confirmedNotices = (clone $query)->where('status', 'confirmed')->count();
    $cancelledNotices = (clone $query)->where('status', 'cancelled')->count();

    // Compter les baux actifs (uniquement sur les biens autorisés)
    $activeLeases = 0;
    if (!empty($authorizedPropertyIds)) {
        $activeLeases = Lease::whereIn('property_id', $authorizedPropertyIds)
            ->where('status', 'active')
            ->count();
    }

    // Appliquer les filtres
    $statusFilter = $request->get('status', 'all');
    $searchTerm = $request->get('search', '');
    $propertyFilter = $request->get('property_id', '');
    $typeFilter = $request->get('type', '');
    $limit = $request->get('limit', 9);
    $page = $request->get('page', 1);

    // Filtre par statut
    if ($statusFilter !== 'all') {
        $query->where('status', $statusFilter);
    }

    // Filtre par bien (doit être dans les biens autorisés)
    if ($propertyFilter) {
        // Vérifier que le bien demandé est dans les biens autorisés
        if (in_array($propertyFilter, $authorizedPropertyIds)) {
            $query->where('property_id', $propertyFilter);
        } else {
            // Si le bien n'est pas autorisé, ne retourner aucun résultat
            $query->whereRaw('1 = 0');
        }
    }

    // Filtre par type
    if ($typeFilter) {
        $query->where('type', $typeFilter);
    }

    // Filtre par recherche
    if ($searchTerm) {
        $query->where(function($q) use ($searchTerm) {
            $q->where('reason', 'like', "%{$searchTerm}%")
              ->orWhereHas('tenant', function($tenantQuery) use ($searchTerm) {
                  $tenantQuery->where('first_name', 'like', "%{$searchTerm}%")
                              ->orWhere('last_name', 'like', "%{$searchTerm}%");
              })
              ->orWhereHas('property', function($propertyQuery) use ($searchTerm) {
                  $propertyQuery->where('address', 'like', "%{$searchTerm}%")
                                ->orWhere('city', 'like', "%{$searchTerm}%");
              });
        });
    }

    // Log après filtres
    \Log::info('Résultats après filtres', [
        'query_count' => $query->count()
    ]);

    // Récupérer les préavis avec pagination
    $notices = $query->orderBy('notice_date', 'desc')
        ->orderBy('created_at', 'desc')
        ->paginate($limit, ['*'], 'page', $page);

    // Formater les données pour l'API
    $formattedNotices = $notices->map(function ($notice) {
        return [
            'id' => $notice->id,
            'reference' => $this->noticeRef($notice),
            'status' => $notice->status,
            'status_label' => $this->formatStatus($notice->status),
            'status_color' => $this->getStatusColor($notice->status),
            'status_bg_color' => $this->getStatusBgColor($notice->status),
            'type' => $notice->type,
            'type_label' => $notice->type === 'landlord' ? 'Bailleur' : 'Locataire',
            'type_color' => $notice->type === 'landlord' ? '#1D4ED8' : '#7C3AED',
            'type_bg_color' => $notice->type === 'landlord' ? '#DBEAFE' : '#F3E8FF',
            'tenant_name' => $notice->tenant ? ($notice->tenant->first_name . ' ' . $notice->tenant->last_name) : null,
            'property_address' => $notice->property->address ?? null,
            'property_city' => $notice->property->city ?? null,
            'notice_date' => $notice->notice_date,
            'notice_date_formatted' => $this->formatDate($notice->notice_date),
            'end_date' => $notice->end_date,
            'end_date_formatted' => $this->formatDate($notice->end_date),
            'reason' => $notice->reason,
            'notes' => $notice->notes,
            'created_at' => $notice->created_at,
            'created_at_formatted' => $this->formatDate($notice->created_at),
            'remaining_days' => $this->calculateRemainingDays($notice->end_date),
            'landlord_name' => $notice->landlord ? $notice->landlord->name : null,
        ];
    });

    // Récupérer les propriétés pour les filtres (uniquement les biens autorisés)
    $properties = [];
    if (!empty($authorizedPropertyIds)) {
        $properties = Property::whereIn('id', $authorizedPropertyIds)
            ->orderBy('address')
            ->get(['id', 'address', 'city', 'name']);
    }

    return response()->json([
        'notices' => $formattedNotices,
        'totalNotices' => $totalNotices,
        'pendingNotices' => $pendingNotices,
        'confirmedNotices' => $confirmedNotices,
        'cancelledNotices' => $cancelledNotices,
        'activeLeases' => $activeLeases,
        'properties' => $properties,
        'pagination' => [
            'current_page' => $notices->currentPage(),
            'last_page' => $notices->lastPage(),
            'per_page' => $notices->perPage(),
            'total' => $notices->total()
        ]
    ]);
}

    /**
     * Récupérer les baux pour le formulaire de création
     */
    public function getLeasesForForm(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $isLandlord = $user->hasRole('landlord');
        $isCoOwner = $user->hasRole('co_owner');

        if (!$isLandlord && !$isCoOwner) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $leases = [];

        if ($isLandlord) {
            // Récupérer les IDs des biens appartenant à ce propriétaire
            $propertyIds = Property::where('landlord_id', $user->id)
                ->orWhere('user_id', $user->id)
                ->pluck('id')
                ->toArray();

            if (empty($propertyIds)) {
                return response()->json(['leases' => []]);
            }

            // Récupérer les baux pour ces biens
            $leases = Lease::whereIn('property_id', $propertyIds)
                ->where('status', 'active')
                ->with(['property', 'tenant.user'])
                ->get()
                ->map(function ($lease) {
                    return [
                        'id' => $lease->id,
                        'property' => [
                            'address' => $lease->property->address ?? null,
                            'city' => $lease->property->city ?? null,
                        ],
                        'tenant' => [
                            'first_name' => $lease->tenant->first_name ?? null,
                            'last_name' => $lease->tenant->last_name ?? null,
                            'user' => [
                                'name' => $lease->tenant->user->name ?? null,
                            ],
                        ],
                        'start_date' => $lease->start_date,
                        'rent_amount' => $lease->rent_amount,
                        'tenant_name' => $lease->tenant ? ($lease->tenant->first_name . ' ' . $lease->tenant->last_name) : null,
                        'property_address' => $lease->property->address ?? null,
                    ];
                });
        } elseif ($isCoOwner) {
            // Le copropriétaire voit les baux des biens délégués
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return response()->json(['leases' => []]);
            }

            $delegatedPropertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();

            if (empty($delegatedPropertyIds)) {
                return response()->json(['leases' => []]);
            }

            $leases = Lease::whereIn('property_id', $delegatedPropertyIds)
                ->where('status', 'active')
                ->with(['property', 'tenant.user'])
                ->get()
                ->map(function ($lease) {
                    return [
                        'id' => $lease->id,
                        'property' => [
                            'address' => $lease->property->address ?? null,
                            'city' => $lease->property->city ?? null,
                        ],
                        'tenant' => [
                            'first_name' => $lease->tenant->first_name ?? null,
                            'last_name' => $lease->tenant->last_name ?? null,
                            'user' => [
                                'name' => $lease->tenant->user->name ?? null,
                            ],
                        ],
                        'start_date' => $lease->start_date,
                        'rent_amount' => $lease->rent_amount,
                        'tenant_name' => $lease->tenant ? ($lease->tenant->first_name . ' ' . $lease->tenant->last_name) : null,
                        'property_address' => $lease->property->address ?? null,
                    ];
                });
        }

        return response()->json(['leases' => $leases]);
    }

    /**
     * Afficher les détails d'un préavis
     */
/**
 * Afficher les détails d'un préavis
 */
public function show(Request $request, $id)
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Non authentifié'], 401);
    }

    $notice = Notice::with(['property', 'tenant.user', 'landlord'])->find($id);

    if (!$notice) {
        return response()->json(['message' => 'Préavis non trouvé'], 404);
    }

    // Vérifier les permissions
    if (!$this->canAccessNotice($user, $notice)) {
        return response()->json(['message' => 'Accès non autorisé à ce préavis'], 403);
    }

    // Récupérer les informations du propriétaire DIRECTEMENT depuis la table users
    $landlordInfo = null;
    if ($notice->landlord) {
        // $notice->landlord est déjà une instance de User
        $landlordInfo = [
            'id' => $notice->landlord->id,
            'name' => $notice->landlord->name,  // Nom depuis users
            'email' => $notice->landlord->email, // Email depuis users
            // Si vous voulez aussi le prénom/nom séparés, vous pouvez les ajouter
            'first_name' => $notice->landlord->first_name,
            'last_name' => $notice->landlord->last_name,
        ];
    }

    return response()->json([
        'id' => $notice->id,
        'reference' => $this->noticeRef($notice),
        'status' => $notice->status,
        'status_label' => $this->formatStatus($notice->status),
        'status_color' => $this->getStatusColor($notice->status),
        'status_bg_color' => $this->getStatusBgColor($notice->status),
        'type' => $notice->type,
        'type_label' => $notice->type === 'landlord' ? 'Bailleur' : 'Locataire',
        'type_color' => $notice->type === 'landlord' ? '#1D4ED8' : '#7C3AED',
        'type_bg_color' => $notice->type === 'landlord' ? '#DBEAFE' : '#F3E8FF',
        'tenant' => $notice->tenant ? [
            'id' => $notice->tenant->id,
            'first_name' => $notice->tenant->first_name,
            'last_name' => $notice->tenant->last_name,
            'email' => $notice->tenant->user->email ?? null,
            'phone' => $notice->tenant->phone ?? null,
        ] : null,
        'property' => $notice->property ? [
            'id' => $notice->property->id,
            'address' => $notice->property->address,
            'city' => $notice->property->city,
            'postal_code' => $notice->property->postal_code,
        ] : null,
        'landlord' => $landlordInfo, // Maintenant avec l'email de users
        'notice_date' => $notice->notice_date,
        'notice_date_formatted' => $this->formatDate($notice->notice_date),
        'end_date' => $notice->end_date,
        'end_date_formatted' => $this->formatDate($notice->end_date),
        'reason' => $notice->reason,
        'notes' => $notice->notes,
        'created_at' => $notice->created_at,
        'created_at_formatted' => $this->formatDate($notice->created_at),
        'updated_at' => $notice->updated_at,
        'remaining_days' => $this->calculateRemainingDays($notice->end_date),
        'lease' => $this->getLeaseFromNotice($notice),
    ]);
}

    /**
     * Créer un nouveau préavis
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $isLandlord = $user->hasRole('landlord');
        $isCoOwner = $user->hasRole('co_owner');

        if (!$isLandlord && !$isCoOwner) {
            return response()->json(['message' => 'Seuls les bailleurs et co-propriétaires peuvent créer des préavis'], 403);
        }

        // Validation
        $validator = Validator::make($request->all(), [
            'lease_id'    => ['required', 'exists:leases,id'],
            'reason'      => ['required', 'string', 'max:1000'],
            'notice_date' => ['required', 'date'],
            'end_date'    => ['required', 'date', 'after:notice_date'],
            'notes'       => ['nullable', 'string', 'max:1000'],
            'type'        => ['required', 'in:landlord,tenant'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Récupérer le bail
        $lease = Lease::with('property')->find($request->lease_id);

        if (!$lease) {
            return response()->json(['message' => 'Bail non trouvé'], 404);
        }

        // Vérifier les permissions
        if (!$this->canManageLease($user, $lease)) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce bail'], 403);
        }

        try {
            // Déterminer le landlord_id via la propriété
            $landlordId = null;
            if ($lease->property) {
                $landlordId = $lease->property->landlord_id ?? $lease->property->user_id;
            }

            if (!$landlordId) {
                return response()->json(['message' => 'Impossible de déterminer le propriétaire principal'], 422);
            }

            // Préparer les données
            $data = [
                'property_id'  => $lease->property_id,
                'landlord_id'  => $landlordId,
                'tenant_id'    => $lease->tenant_id,
                'type'         => $request->type,
                'reason'       => $request->reason,
                'notice_date'  => $request->notice_date,
                'end_date'     => $request->end_date,
                'status'       => 'pending',
                'notes'        => $request->notes,
            ];

            // Créer le préavis
            $notice = Notice::create($data);

            // Charger les relations pour la réponse
            $notice->load(['property', 'tenant.user', 'landlord']);

            // Envoyer les emails (à faire en arrière-plan de préférence)
            // $this->sendNoticeCreatedMails($notice);

            Log::info('Préavis créé', [
                'notice_id' => $notice->id,
                'user_id' => $user->id,
                'role' => $isLandlord ? 'landlord' : 'co_owner',
            ]);

            return response()->json([
                'message' => 'Préavis créé avec succès',
                'notice' => [
                    'id' => $notice->id,
                    'reference' => $this->noticeRef($notice),
                    'status' => $notice->status,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur création préavis', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'request' => $request->all(),
            ]);

            return response()->json(['message' => 'Erreur lors de la création du préavis: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mettre à jour un préavis
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $notice = Notice::find($id);

        if (!$notice) {
            return response()->json(['message' => 'Préavis non trouvé'], 404);
        }

        // Vérifier les permissions
        if (!$this->canManageNotice($user, $notice)) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce préavis'], 403);
        }

        // Seuls les préavis en attente peuvent être modifiés
        if ($notice->status !== 'pending') {
            return response()->json(['message' => 'Seuls les préavis en attente peuvent être modifiés'], 422);
        }

        // Validation
        $validator = Validator::make($request->all(), [
            'reason'      => ['sometimes', 'required', 'string', 'max:1000'],
            'notice_date' => ['sometimes', 'required', 'date'],
            'end_date'    => ['sometimes', 'required', 'date', 'after:notice_date'],
            'notes'       => ['nullable', 'string', 'max:1000'],
            'type'        => ['sometimes', 'required', 'in:landlord,tenant'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $notice->update($request->only(['reason', 'notice_date', 'end_date', 'notes', 'type']));

            Log::info('Préavis modifié', [
                'notice_id' => $notice->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Préavis modifié avec succès',
                'notice' => [
                    'id' => $notice->id,
                    'reference' => $this->noticeRef($notice),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur modification préavis', [
                'error' => $e->getMessage(),
                'notice_id' => $notice->id,
            ]);

            return response()->json(['message' => 'Erreur lors de la modification du préavis'], 500);
        }
    }

    /**
     * Mettre à jour le statut d'un préavis
     */
    public function updateStatus(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $notice = Notice::find($id);

        if (!$notice) {
            return response()->json(['message' => 'Préavis non trouvé'], 404);
        }

        // Vérifier les permissions
        if (!$this->canManageNotice($user, $notice)) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce préavis'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:confirmed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $oldStatus = $notice->status;
            $notice->update(['status' => $request->status]);

            Log::info('Statut préavis modifié', [
                'notice_id' => $notice->id,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Statut du préavis mis à jour',
                'status' => $request->status
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur changement statut préavis', [
                'error' => $e->getMessage(),
                'notice_id' => $notice->id,
            ]);

            return response()->json(['message' => 'Erreur lors du changement de statut'], 500);
        }
    }

    /**
     * Supprimer un préavis
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }

        $notice = Notice::find($id);

        if (!$notice) {
            return response()->json(['message' => 'Préavis non trouvé'], 404);
        }

        // Vérifier les permissions
        if (!$this->canManageNotice($user, $notice)) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce préavis'], 403);
        }

        // Seuls les préavis en attente peuvent être supprimés
        if ($notice->status !== 'pending') {
            return response()->json(['message' => 'Seuls les préavis en attente peuvent être supprimés'], 422);
        }

        try {
            $notice->delete();

            Log::info('Préavis supprimé', [
                'notice_id' => $id,
                'user_id' => $user->id,
            ]);

            return response()->json(['message' => 'Préavis supprimé avec succès']);

        } catch (\Exception $e) {
            Log::error('Erreur suppression préavis', [
                'error' => $e->getMessage(),
                'notice_id' => $id,
            ]);

            return response()->json(['message' => 'Erreur lors de la suppression du préavis'], 500);
        }
    }

    /**
     * Vérifier si l'utilisateur peut accéder au préavis
     */
    private function canAccessNotice($user, $notice): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('landlord')) {
            // Vérifier si le propriétaire possède le bien du préavis
            return Property::where('id', $notice->property_id)
                ->where(function($query) use ($user) {
                    $query->where('landlord_id', $user->id)
                          ->orWhere('user_id', $user->id);
                })
                ->exists();
        }

        if ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) return false;

            return PropertyDelegation::where('property_id', $notice->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();
        }

        if ($user->hasRole('tenant')) {
            $tenant = $user->tenant;
            if (!$tenant) return false;

            return $notice->tenant_id === $tenant->id;
        }

        return false;
    }

    /**
     * Vérifier si l'utilisateur peut gérer le préavis (modifier/supprimer)
     */
    private function canManageNotice($user, $notice): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('landlord')) {
            // Vérifier si le propriétaire possède le bien du préavis
            return Property::where('id', $notice->property_id)
                ->where(function($query) use ($user) {
                    $query->where('landlord_id', $user->id)
                          ->orWhere('user_id', $user->id);
                })
                ->exists();
        }

        if ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) return false;

            // Le co-owner peut gérer si le bien est délégué
            return PropertyDelegation::where('property_id', $notice->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();
        }

        return false;
    }

    /**
     * Vérifier si l'utilisateur peut gérer le bail
     */
    private function canManageLease($user, $lease): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->hasRole('landlord')) {
            // Vérifier si le propriétaire possède le bien du bail
            return Property::where('id', $lease->property_id)
                ->where(function($query) use ($user) {
                    $query->where('landlord_id', $user->id)
                          ->orWhere('user_id', $user->id);
                })
                ->exists();
        }

        if ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) return false;

            return PropertyDelegation::where('property_id', $lease->property_id)
                ->where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->exists();
        }

        return false;
    }

    /**
     * Récupérer le bail associé au préavis
     */
    private function getLeaseFromNotice($notice)
    {
        $lease = Lease::where('property_id', $notice->property_id)
            ->where('tenant_id', $notice->tenant_id)
            ->where('status', 'active')
            ->first();

        if (!$lease) return null;

        return [
            'id' => $lease->id,
            'start_date' => $lease->start_date,
            'end_date' => $lease->end_date,
            'rent_amount' => $lease->rent_amount,
            'deposit_amount' => $lease->guarantee_amount,
        ];
    }

    /**
     * Formater la référence du préavis
     */
    private function noticeRef($notice): string
    {
        return 'PREAVIS-' . str_pad((string) $notice->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Formater une date
     */
    private function formatDate(?string $date): ?string
    {
        if (!$date) return null;
        try {
            return Carbon::parse($date)->format('d/m/Y');
        } catch (\Throwable $e) {
            return $date;
        }
    }

    /**
     * Formater le statut
     */
    private function formatStatus(?string $status): string
    {
        return match ($status) {
            'pending' => 'En attente',
            'confirmed' => 'Confirmé',
            'cancelled' => 'Annulé',
            default => $status ? ucfirst($status) : '—',
        };
    }

    /**
     * Obtenir la couleur du statut
     */
    private function getStatusColor(?string $status): string
    {
        return match ($status) {
            'pending' => '#D97706',
            'confirmed' => '#047857',
            'cancelled' => '#DC2626',
            default => '#6B7280',
        };
    }

    /**
     * Obtenir la couleur de fond du statut
     */
    private function getStatusBgColor(?string $status): string
    {
        return match ($status) {
            'pending' => '#FEF3C7',
            'confirmed' => '#D1FAE5',
            'cancelled' => '#FEE2E2',
            default => '#F3F4F6',
        };
    }

    /**
     * Calculer les jours restants
     */
    private function calculateRemainingDays(?string $endDate): int
    {
        if (!$endDate) return 0;
        try {
            $end = Carbon::parse($endDate);
            $now = Carbon::now();
            $diff = $end->diffInDays($now, false);
            return max(0, (int) $diff);
        } catch (\Throwable $e) {
            return 0;
        }
    }
}
