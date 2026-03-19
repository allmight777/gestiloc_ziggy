<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePropertyRequest;
use App\Models\Property;
use App\Models\CoOwner;
use App\Models\Landlord;
use App\Models\PropertyDelegation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    /* =========================
     * Helpers
     * ========================= */

    private function getPhotoUrls(Property $property): array
    {
        $photos = $property->photos ?? [];
        $urls = [];

        foreach ($photos as $photo) {
            if (empty($photo)) continue;

            if (str_starts_with($photo, 'http://') || str_starts_with($photo, 'https://')) {
                $urls[] = $photo;
            } else {
                $cleanPath = str_replace('\\', '/', $photo);
                $cleanPath = ltrim($cleanPath, '/');

                if (Storage::disk('public')->exists($cleanPath)) {
                    $urls[] = Storage::disk('public')->url($cleanPath);
                } else {
                    Log::warning('Photo not found', ['path' => $cleanPath, 'property_id' => $property->id]);
                }
            }
        }

        return $urls;
    }

    /**
     * ✅ Vérifier si CE BIEN est délégué à une AGENCE
     */
    private function isPropertyDelegatedToAgency(Property $property): bool
    {
        return PropertyDelegation::where('property_id', $property->id)
            ->where('status', 'active')
            ->where('co_owner_type', 'agency')
            ->exists();
    }

    /**
     * ✅ Vérifier si CE BIEN est délégué à un CO-PROPRIÉTAIRE SIMPLE
     */
    private function isPropertyDelegatedToSimpleCoOwner(Property $property): bool
    {
        return PropertyDelegation::where('property_id', $property->id)
            ->where('status', 'active')
            ->where('co_owner_type', 'co_owner')
            ->exists();
    }

    /**
     * ✅ Vérifier si un CO-PROPRIÉTAIRE spécifique a une délégation sur ce bien
     */
    private function isPropertyDelegatedToSpecificCoOwner(Property $property, int $coOwnerId): bool
    {
        return PropertyDelegation::where('property_id', $property->id)
            ->where('co_owner_id', $coOwnerId)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * ✅ Récupérer tous les IDs des biens délégués à un copropriétaire
     */
    private function getDelegatedPropertyIdsForCoOwner(int $coOwnerId): array
    {
        return PropertyDelegation::where('co_owner_id', $coOwnerId)
            ->where('status', 'active')
            ->pluck('property_id')
            ->toArray();
    }

    /**
     * ✅ Récupérer tous les IDs des biens APPARTENANT à un propriétaire (via user_id)
     */
    private function getOwnedPropertyIdsForUser(int $userId): array
    {
        return Property::where('user_id', $userId)
            ->pluck('id')
            ->toArray();
    }

    /**
     * ✅ Vérifier si un utilisateur est le propriétaire d'un bien
     */
    private function isUserOwnerOfProperty(Property $property, int $userId): bool
    {
        return $property->user_id === $userId;
    }

    /**
     * ✅ Vérifier si un utilisateur a un rôle de copropriétaire
     */
    private function getUserCoOwner($user)
    {
        return CoOwner::where('user_id', $user->id)->first();
    }

    /**
     * ✅ Vérifier si un utilisateur a un rôle de propriétaire
     */
    private function getUserLandlord($user)
    {
        return Landlord::where('user_id', $user->id)->first();
    }

    /**
     * ✅ Déterminer si l'utilisateur peut MODIFIER une propriété
     * Prend en compte les doubles rôles
     */
    private function canEditProperty(Property $property, $user): bool
    {
        // 1. ADMIN : Peut tout modifier
        if ($user->isAdmin()) {
            return true;
        }

        // 2. Vérifier si l'utilisateur est le PROPRIÉTAIRE du bien
        $isOwner = $this->isUserOwnerOfProperty($property, $user->id);

        if ($isOwner) {
            // ✅ RÈGLE : Si le bien est délégué à une AGENCE, le propriétaire perd ses droits
            if ($this->isPropertyDelegatedToAgency($property)) {
                return false;
            }

            // ✅ Si le bien est délégué à un co-propriétaire SIMPLE, le propriétaire garde ses droits
            if ($this->isPropertyDelegatedToSimpleCoOwner($property)) {
                return true;
            }

            return true; // Bien non délégué
        }

        // 3. Vérifier si l'utilisateur est COPROPRIÉTAIRE (pour les biens délégués)
        $coOwner = $this->getUserCoOwner($user);

        if ($coOwner) {
            // ✅ Vérifier si ce copropriétaire a une délégation active sur ce bien
            $hasDelegation = $this->isPropertyDelegatedToSpecificCoOwner($property, $coOwner->id);

            if (!$hasDelegation) {
                return false;
            }

            // ✅ AGENCES : Peuvent modifier SEULEMENT si la délégation le permet
            if ($coOwner->co_owner_type === 'agency') {
                $delegation = PropertyDelegation::where('property_id', $property->id)
                    ->where('co_owner_id', $coOwner->id)
                    ->where('status', 'active')
                    ->first();

                // Vérifier les permissions si elles existent
                if ($delegation && isset($delegation->permissions)) {
                    $permissions = is_string($delegation->permissions)
                        ? json_decode($delegation->permissions, true)
                        : $delegation->permissions;

                    return in_array('edit', $permissions) || in_array('all', $permissions);
                }

                return true; // Par défaut, l'agence peut modifier
            }

            // ✅ COPROPRIÉTAIRES SIMPLES : Peuvent modifier les biens délégués
            return true;
        }

        return false;
    }

    /**
     * ✅ Obtenir le TYPE de délégation pour ce bien
     */
    private function getDelegationType(Property $property): ?string
    {
        $delegation = PropertyDelegation::where('property_id', $property->id)
            ->where('status', 'active')
            ->first();

        return $delegation?->co_owner_type;
    }

    /**
     * ✅ Obtenir les informations de la délégation
     */
    private function getDelegationInfo(Property $property): ?array
    {
        $delegation = PropertyDelegation::where('property_id', $property->id)
            ->where('status', 'active')
            ->with('coOwner')
            ->first();

        if (!$delegation || !$delegation->coOwner) {
            return null;
        }

        return [
            'type' => $delegation->co_owner_type,
            'co_owner_id' => $delegation->coOwner->id,
            'co_owner_name' => $delegation->coOwner->first_name . ' ' . $delegation->coOwner->last_name,
            'co_owner_company' => $delegation->coOwner->company_name,
            'delegated_at' => $delegation->delegated_at,
            'delegation_type' => $delegation->delegation_type,
            'permissions' => $delegation->permissions ?? [],
        ];
    }

    /**
     * ✅ Formater les données du bien pour l'API
     * Ajoute des informations sur les rôles
     */
    private function formatPropertyForApi(Property $property, $user): array
    {
        $propertyArray = $property->toArray();

        // Ajouter les URLs des photos
        $propertyArray['photo_urls'] = $this->getPhotoUrls($property);
        $propertyArray['photos'] = $this->getPhotoUrls($property); // Pour compatibilité

        // Déterminer la relation avec l'utilisateur
        $isOwner = $this->isUserOwnerOfProperty($property, $user->id);

        $coOwner = $this->getUserCoOwner($user);
        $isDelegatedToMe = $coOwner ? $this->isPropertyDelegatedToSpecificCoOwner($property, $coOwner->id) : false;

        // Ajouter les permissions
        $propertyArray['can_edit'] = $this->canEditProperty($property, $user);
        $propertyArray['delegation_type'] = $this->getDelegationType($property);
        $propertyArray['delegation_info'] = $this->getDelegationInfo($property);

        // Ajouter des indicateurs de rôle
        $propertyArray['is_owner'] = $isOwner;
        $propertyArray['is_delegated_to_me'] = $isDelegatedToMe;

        // Déterminer le rôle actif pour ce bien
        if ($isOwner) {
            $propertyArray['active_role'] = 'owner';
        } elseif ($isDelegatedToMe) {
            $propertyArray['active_role'] = 'co_owner_delegated';
        } else {
            $propertyArray['active_role'] = 'viewer';
        }

        // Ajouter la liste des rôles de l'utilisateur
        $propertyArray['user_roles'] = [];
        if ($isOwner) {
            $propertyArray['user_roles'][] = 'owner';
        }
        if ($isDelegatedToMe) {
            $propertyArray['user_roles'][] = 'co_owner_delegated';
        }

        // S'assurer que meta est un array
        if (is_string($property->meta)) {
            $propertyArray['meta'] = json_decode($property->meta, true) ?? [];
        } elseif (is_array($property->meta)) {
            $propertyArray['meta'] = $property->meta;
        } else {
            $propertyArray['meta'] = [];
        }

        return $propertyArray;
    }

    /* =========================
     * Actions CRUD
     * ========================= */

    /**
     * GET /api/properties - VERSION QUI GÈRE LES DOUBLES RÔLES
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->query('status'); // Filtre par statut
        $role = $request->query('role'); // Filtre optionnel par rôle: 'owner', 'co_owner', 'all'

        // ADMIN : Voir tout
        if ($user->isAdmin()) {
            $query = Property::with(['landlord']);

            if ($status && in_array($status, ['available', 'rented', 'maintenance', 'off_market'])) {
                $query->where('status', $status);
            }

            $properties = $query->latest()->paginate(20);
            $formattedProperties = $properties->getCollection()->map(function ($property) use ($user) {
                return $this->formatPropertyForApi($property, $user);
            });

            return response()->json([
                'data' => $formattedProperties,
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ]);
        }

        // Récupérer les IDs des biens que l'utilisateur possède (en tant que propriétaire)
        $ownedPropertyIds = $this->getOwnedPropertyIdsForUser($user->id);

        // Récupérer les IDs des biens délégués (en tant que copropriétaire)
        $coOwner = $this->getUserCoOwner($user);
        $delegatedPropertyIds = $coOwner ? $this->getDelegatedPropertyIdsForCoOwner($coOwner->id) : [];

        Log::info('[PropertyController] Biens accessibles', [
            'user_id' => $user->id,
            'owned_count' => count($ownedPropertyIds),
            'delegated_count' => count($delegatedPropertyIds),
            'owned_ids' => $ownedPropertyIds,
            'delegated_ids' => $delegatedPropertyIds
        ]);

        // Construire la requête pour tous les biens accessibles
        $query = Property::with(['landlord'])
            ->where(function($q) use ($ownedPropertyIds, $delegatedPropertyIds, $user, $coOwner, $role) {

                // Si un filtre par rôle est spécifié
                if ($role === 'owner') {
                    // Uniquement les biens possédés
                    if (!empty($ownedPropertyIds)) {
                        $q->whereIn('id', $ownedPropertyIds);
                    } else {
                        $q->whereRaw('1 = 0'); // Aucun résultat
                    }
                }
                elseif ($role === 'co_owner') {
                    // Uniquement les biens délégués
                    if (!empty($delegatedPropertyIds)) {
                        $q->whereIn('id', $delegatedPropertyIds);
                    } else {
                        $q->whereRaw('1 = 0'); // Aucun résultat
                    }
                }
                else {
                    // TOUS les biens accessibles (par défaut)
                    $conditions = [];

                    if (!empty($ownedPropertyIds)) {
                        $conditions[] = ['type' => 'owner', 'ids' => $ownedPropertyIds];
                    }

                    if (!empty($delegatedPropertyIds)) {
                        $conditions[] = ['type' => 'delegated', 'ids' => $delegatedPropertyIds];
                    }

                    // Construire la clause WHERE avec OR
                    foreach ($conditions as $index => $condition) {
                        if ($index === 0) {
                            $q->whereIn('id', $condition['ids']);
                        } else {
                            $q->orWhereIn('id', $condition['ids']);
                        }
                    }

                    // Si aucune condition, ne rien retourner
                    if (empty($conditions)) {
                        $q->whereRaw('1 = 0');
                    }
                }
            })
            ->groupBy('properties.id');

        // Appliquer le filtre de statut si présent
        if ($status && in_array($status, ['available', 'rented', 'maintenance', 'off_market'])) {
            $query->where('status', $status);
        }

        $properties = $query->latest()->paginate(20);

        $formattedProperties = $properties->getCollection()->map(function ($property) use ($user, $ownedPropertyIds, $delegatedPropertyIds) {
            $formatted = $this->formatPropertyForApi($property, $user);

            // Ajouter des informations détaillées
            $formatted['is_owned'] = in_array($property->id, $ownedPropertyIds);
            $formatted['is_delegated'] = in_array($property->id, $delegatedPropertyIds);

            return $formatted;
        });

        // Compter par catégorie
        $ownedCount = Property::whereIn('id', $ownedPropertyIds)->count();
        $delegatedCount = Property::whereIn('id', $delegatedPropertyIds)->count();

        return response()->json([
            'data' => $formattedProperties,
            'current_page' => $properties->currentPage(),
            'last_page' => $properties->lastPage(),
            'per_page' => $properties->perPage(),
            'total' => $properties->total(),
            'counts' => [
                'owned' => $ownedCount,
                'delegated' => $delegatedCount,
                'total' => $ownedCount + $delegatedCount
            ],
            'debug' => [
                'user_id' => $user->id,
                'owned_ids' => $ownedPropertyIds,
                'delegated_ids' => $delegatedPropertyIds,
                'has_co_owner' => $coOwner ? true : false,
                'co_owner_id' => $coOwner?->id,
                'co_owner_type' => $coOwner?->co_owner_type
            ]
        ]);
    }

    /**
     * GET /api/properties/owned - Biens possédés (rôle propriétaire)
     */
    public function getOwnedProperties(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->query('status');

        // Récupérer les biens que l'utilisateur possède
        $query = Property::where('user_id', $user->id)
            ->with(['landlord']);

        if ($status && in_array($status, ['available', 'rented', 'maintenance', 'off_market'])) {
            $query->where('status', $status);
        }

        $properties = $query->latest()->paginate(20);

        $formattedProperties = $properties->getCollection()->map(function ($property) use ($user) {
            $formatted = $this->formatPropertyForApi($property, $user);
            $formatted['role'] = 'owner';
            return $formatted;
        });

        return response()->json([
            'data' => $formattedProperties,
            'current_page' => $properties->currentPage(),
            'last_page' => $properties->lastPage(),
            'per_page' => $properties->perPage(),
            'total' => $properties->total(),
        ]);
    }

    /**
     * GET /api/properties/delegated - Biens délégués (rôle copropriétaire)
     */
    public function getDelegatedProperties(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = $request->query('status');

        $coOwner = $this->getUserCoOwner($user);

        if (!$coOwner) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 20,
                'total' => 0,
            ]);
        }

        // Récupérer les IDs des biens délégués
        $delegatedPropertyIds = $this->getDelegatedPropertyIdsForCoOwner($coOwner->id);

        if (empty($delegatedPropertyIds)) {
            return response()->json([
                'data' => [],
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 20,
                'total' => 0,
            ]);
        }

        $query = Property::whereIn('id', $delegatedPropertyIds)
            ->with(['landlord']);

        if ($status && in_array($status, ['available', 'rented', 'maintenance', 'off_market'])) {
            $query->where('status', $status);
        }

        $properties = $query->latest()->paginate(20);

        $formattedProperties = $properties->getCollection()->map(function ($property) use ($user) {
            $formatted = $this->formatPropertyForApi($property, $user);
            $formatted['role'] = 'co_owner';
            $formatted['is_delegated'] = true;
            return $formatted;
        });

        return response()->json([
            'data' => $formattedProperties,
            'current_page' => $properties->currentPage(),
            'last_page' => $properties->lastPage(),
            'per_page' => $properties->perPage(),
            'total' => $properties->total(),
        ]);
    }

    /**
     * GET /api/properties/counts-by-role - Compter les biens par rôle
     */
    public function getCountsByRole(Request $request): JsonResponse
    {
        $user = $request->user();

        // Biens possédés
        $ownedCount = Property::where('user_id', $user->id)->count();

        // Biens délégués
        $coOwner = $this->getUserCoOwner($user);
        $delegatedCount = 0;

        if ($coOwner) {
            $delegatedCount = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->count();
        }

        return response()->json([
            'owned' => $ownedCount,
            'delegated' => $delegatedCount,
            'total' => $ownedCount + $delegatedCount
        ]);
    }

    /**
     * POST /api/properties
     */
    public function store(StorePropertyRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isLandlord()) {
            return response()->json(['message' => 'Forbidden - Seuls les propriétaires peuvent créer des biens'], 403);
        }

        $landlord = $user->landlord;
        if (!$landlord) {
            return response()->json(['message' => 'Landlord profile missing'], 422);
        }

        $data = $request->validated();

        if (isset($data['photos']) && is_array($data['photos'])) {
            $data['photos'] = array_filter($data['photos'], function($photo) {
                return !empty($photo);
            });
        }

        $data['landlord_id'] = $landlord->id;
        $data['user_id'] = $user->id;

        $property = Property::create($data);
        $formattedProperty = $this->formatPropertyForApi($property, $user);

        Log::info('[Property] Created successfully', [
            'property_id' => $property->id,
            'user_id' => $user->id,
            'as_owner' => true
        ]);

        return response()->json($formattedProperty, 201);
    }

    /**
     * GET /api/properties/{id}
     */
    public function show(Request $request, $id): JsonResponse
    {
        $property = Property::with(['landlord'])->findOrFail($id);
        $user = $request->user();

        $canView = false;

        if ($user->isAdmin()) {
            $canView = true;
        } else {
            // Vérifier si l'utilisateur est propriétaire
            $isOwner = $this->isUserOwnerOfProperty($property, $user->id);

            // Vérifier si l'utilisateur est copropriétaire avec délégation
            $coOwner = $this->getUserCoOwner($user);
            $isDelegated = $coOwner ? $this->isPropertyDelegatedToSpecificCoOwner($property, $coOwner->id) : false;

            if ($isOwner || $isDelegated) {
                $canView = true;
            }
        }

        if (!$canView) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $formattedProperty = $this->formatPropertyForApi($property, $user);

        return response()->json($formattedProperty);
    }

    /**
     * PUT /api/properties/{id}
     */
    public function update(StorePropertyRequest $request, $id): JsonResponse
    {
        $property = Property::with(['landlord'])->findOrFail($id);
        $user = $request->user();

        // ✅ VÉRIFICATION : Utiliser canEditProperty
        if (!$this->canEditProperty($property, $user)) {
            $message = 'Forbidden - Vous n\'avez pas la permission de modifier ce bien';

            $delegationType = $this->getDelegationType($property);
            if ($delegationType === 'agency') {
                $message = 'Forbidden - Ce bien est géré par une agence. Vous avez uniquement un accès en lecture.';
            }

            return response()->json(['message' => $message], 403);
        }

        $data = $request->validated();

        if (isset($data['photos']) && is_array($data['photos'])) {
            $data['photos'] = array_filter($data['photos'], function($photo) {
                return !empty($photo);
            });
        }

        // Protection anti-mass assignment
        unset($data['landlord_id'], $data['user_id']);

        $property->update($data);
        $propertyFresh = $property->fresh();
        $formattedProperty = $this->formatPropertyForApi($propertyFresh, $user);

        $isOwner = $this->isUserOwnerOfProperty($property, $user->id);
        $coOwner = $this->getUserCoOwner($user);
        $isDelegated = $coOwner ? $this->isPropertyDelegatedToSpecificCoOwner($property, $coOwner->id) : false;

        Log::info('[Property] Updated successfully', [
            'property_id' => $propertyFresh->id,
            'user_id' => $user->id,
            'as_owner' => $isOwner,
            'as_delegated' => $isDelegated
        ]);

        return response()->json($formattedProperty);
    }

    /**
     * DELETE /api/properties/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $property = Property::findOrFail($id);
        $user = $request->user();

        // Seul le propriétaire ou l'admin peut supprimer
        if (!$user->isAdmin()) {
            $isOwner = $this->isUserOwnerOfProperty($property, $user->id);

            if (!$isOwner) {
                return response()->json(['message' => 'Forbidden - Seul le propriétaire peut supprimer ce bien'], 403);
            }
        }

        $property->delete();

        Log::info('[Property] Deleted successfully', [
            'property_id' => $id,
            'user_id' => $user->id
        ]);

        return response()->json(['message' => 'Property deleted']);
    }
}
