<?php

namespace App\Http\Controllers\CoOwner;

use App\Http\Controllers\Controller;
use App\Models\RentDueNotice;
use App\Models\Lease;
use App\Models\Property;
use App\Models\PropertyDelegation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Laravel\Sanctum\PersonalAccessToken;

class RentDueNoticeController extends Controller
{
    /**
     * Liste des avis d'échéance
     */
    public function index(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return redirect()->route('login')->with('error', 'Veuillez vous connecter');
        }

        // 🔥 DÉTERMINER LE RÔLE ET RÉCUPÉRER LES PROPRIÉTÉS
        $propertyIds = [];

        if ($user->hasRole('landlord')) {
            // Pour le propriétaire : ses biens directement
            $propertyIds = Property::where('user_id', $user->id)
                ->orWhere('landlord_id', $user->id)
                ->pluck('id')
                ->toArray();
        } elseif ($user->hasRole('co_owner')) {
            // Pour le co-propriétaire : les biens délégués
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return redirect()->route('login')->with('error', 'Profil co-propriétaire non trouvé');
            }
            $propertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();
        } else {
            return redirect()->route('login')->with('error', 'Accès non autorisé');
        }

        if (empty($propertyIds)) {
            $propertyIds = [0];
        }

        $query = RentDueNotice::whereIn('property_id', $propertyIds)
            ->with(['lease', 'property', 'tenant.user']);

        // Filtres
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('tenant', function($tenantQuery) use ($search) {
                      $tenantQuery->where('first_name', 'like', "%{$search}%")
                                  ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        $notices = $query->orderBy('due_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Récupérer les propriétés pour le filtre
        if ($user->hasRole('landlord')) {
            $properties = Property::whereIn('id', $propertyIds)->get();
        } else {
            $coOwner = $user->coOwner;
            $properties = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->with('property')
                ->get()
                ->pluck('property');
        }

        $stats = [
            'total' => $query->count(),
            'pending' => $query->where('status', 'pending')->count(),
            'sent' => $query->where('status', 'sent')->count(),
            'paid' => $query->where('status', 'paid')->count(),
        ];

        // Utiliser la vue en fonction du rôle
        $view = $user->hasRole('landlord')
            ? 'co-owner.rent-due-notices.index'
            : 'co-owner.rent-due-notices.index';

        return view($view, compact('notices', 'properties', 'stats'));
    }

    /**
     * Afficher le formulaire de création d'un avis d'échéance
     */
    public function create(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return redirect()->route('login')->with('error', 'Veuillez vous connecter');
        }

        // Récupérer les baux selon le rôle
        if ($user->hasRole('landlord')) {
            $propertyIds = Property::where('user_id', $user->id)
                ->orWhere('landlord_id', $user->id)
                ->pluck('id')
                ->toArray();
        } elseif ($user->hasRole('co_owner')) {
            $coOwner = $user->coOwner;
            if (!$coOwner) {
                return redirect()->route('login')->with('error', 'Profil co-propriétaire non trouvé');
            }
            $propertyIds = PropertyDelegation::where('co_owner_id', $coOwner->id)
                ->where('status', 'active')
                ->pluck('property_id')
                ->toArray();
        } else {
            return redirect()->route('login')->with('error', 'Accès non autorisé');
        }

        if (empty($propertyIds)) {
            $propertyIds = [0];
        }

        $leases = Lease::whereIn('property_id', $propertyIds)
            ->where('status', 'active')
            ->with(['property', 'tenant.user'])
            ->get();

        return view('co-owner.rent-due-notices.create', compact('leases', 'user'));
    }

    /**
     * Enregistrer un nouvel avis d'échéance
     */
    public function store(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return back()->with('error', 'Non autorisé');
        }

        if (!$user->hasRole('landlord') && !$user->hasRole('co_owner')) {
            return back()->with('error', 'Non autorisé');
        }

        $validated = $request->validate([
            'lease_id' => 'required|exists:leases,id',
            'type' => 'required|in:rent,charges,deposit,repair,other',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
            'due_date' => 'required|date',
            'payment_method' => 'nullable|string|max:100',
            'send_email' => 'nullable|boolean',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $lease = Lease::with(['property', 'tenant.user'])->find($validated['lease_id']);

            // 🔥 VÉRIFIER LES DROITS D'ACCÈS SELON LE RÔLE
            $coOwnerId = null;

            if ($user->hasRole('landlord')) {
                $isOwner = Property::where('id', $lease->property_id)
                    ->where(function($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('landlord_id', $user->id);
                    })->exists();

                if (!$isOwner) {
                    throw new \Exception('Cette propriété ne vous appartient pas');
                }
            } else {
                $coOwner = $user->coOwner;
                if (!$coOwner) {
                    throw new \Exception('Profil co-propriétaire non trouvé');
                }
                $delegation = PropertyDelegation::where('property_id', $lease->property_id)
                    ->where('co_owner_id', $coOwner->id)
                    ->where('status', 'active')
                    ->first();

                if (!$delegation) {
                    throw new \Exception('Cette propriété ne vous est pas déléguée');
                }
                $coOwnerId = $coOwner->id;
            }

            // Récupérer les valeurs du bail
            $rentAmount = $lease->rent_amount ?? 0;
            $chargesAmount = $lease->charges_amount ?? 0;
            $totalMensuel = $rentAmount + $chargesAmount;

            $monthYear = Carbon::parse($validated['due_date'])->format('Y-m');

            // Vérifier si un avis existe déjà
            $existingNotice = RentDueNotice::where('lease_id', $lease->id)
                ->where('month_year', $monthYear)
                ->first();

            if ($existingNotice) {
                throw new \Exception('Un avis existe déjà pour ce mois');
            }

            // Déterminer les montants selon le type
            $rentAmountFinal = 0;
            $chargesAmountFinal = 0;
            $totalAmountFinal = 0;

            if ($validated['type'] === 'rent') {
                $rentAmountFinal = $rentAmount;
                $chargesAmountFinal = $chargesAmount;
                $totalAmountFinal = $totalMensuel;
            } elseif ($validated['type'] === 'charges') {
                $chargesAmountFinal = $chargesAmount;
                $totalAmountFinal = $chargesAmount;
            } else {
                $validatedAmount = $request->input('amount');
                if (!$validatedAmount) {
                    throw new \Exception('Veuillez saisir un montant pour ce type de facture');
                }
                $rentAmountFinal = $validatedAmount;
                $totalAmountFinal = $validatedAmount;
            }

            $notice = RentDueNotice::create([
                'lease_id' => $lease->id,
                'property_id' => $lease->property_id,
                'tenant_id' => $lease->tenant_id,
                'landlord_id' => $user->id,
                'co_owner_id' => $coOwnerId,
                'due_date' => $validated['due_date'],
                'rent_amount' => $rentAmountFinal,
                'charges_amount' => $chargesAmountFinal,
                'total_amount' => $totalAmountFinal,
                'month_year' => $monthYear,
                'status' => 'pending',
                'notes' => $validated['notes'] ?? null,
                'meta' => [
                    'type' => $validated['type'],
                    'period_start' => $validated['period_start'],
                    'period_end' => $validated['period_end'],
                    'payment_method' => $validated['payment_method'] ?? 'Virement bancaire',
                ],
            ]);

            DB::commit();

            // Envoyer l'email si demandé
            if ($request->has('send_email') && $request->send_email) {
                try {
                    $paymentLink = $notice->generatePaymentLink();
                    $this->sendDueNoticeEmail($notice, $paymentLink);
                    $notice->markAsSent();
                } catch (\Exception $e) {
                    Log::error('Erreur envoi email avis échéance', [
                        'error' => $e->getMessage(),
                        'notice_id' => $notice->id,
                    ]);
                }
            }

            return redirect()
                ->route('co-owner.rent-due-notices.index')
                ->with('success', 'Avis d\'échéance créé avec succès');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création avis échéance', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Envoyer un avis d'échéance par email
     */
    public function send(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return back()->with('error', 'Non autorisé');
        }

        if (!$user->hasRole('landlord') && !$user->hasRole('co_owner')) {
            return back()->with('error', 'Non autorisé');
        }

        $notice = RentDueNotice::with(['lease', 'property', 'tenant.user'])->findOrFail($id);

        // Vérifier les droits d'accès
        if ($user->hasRole('landlord')) {
            if ($notice->landlord_id != $user->id) {
                return back()->with('error', 'Vous n\'avez pas accès à cet avis');
            }
        } else {
            $coOwner = $user->coOwner;
            if (!$coOwner || $notice->co_owner_id != $coOwner->id) {
                return back()->with('error', 'Vous n\'avez pas accès à cet avis');
            }
        }

        try {
            $paymentLink = $notice->generatePaymentLink();
            $this->sendDueNoticeEmail($notice, $paymentLink);
            $notice->markAsSent();

            Log::info('Avis d\'échéance envoyé', [
                'notice_id' => $notice->id,
                'tenant_email' => $notice->tenant->user->email,
            ]);

            return back()->with('success', 'Avis d\'échéance envoyé avec succès');

        } catch (\Exception $e) {
            Log::error('Erreur envoi avis échéance', [
                'error' => $e->getMessage(),
                'notice_id' => $notice->id,
            ]);
            return back()->with('error', 'Erreur lors de l\'envoi: ' . $e->getMessage());
        }
    }

    /**
     * Renvoyer un avis d'échéance (même mois)
     */
    public function resend(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return back()->with('error', 'Non autorisé');
        }

        if (!$user->hasRole('landlord') && !$user->hasRole('co_owner')) {
            return back()->with('error', 'Non autorisé');
        }

        $notice = RentDueNotice::with(['lease', 'property', 'tenant.user'])->findOrFail($id);

        // Vérifier les droits d'accès
        if ($user->hasRole('landlord')) {
            if ($notice->landlord_id != $user->id) {
                return back()->with('error', 'Vous n\'avez pas accès à cet avis');
            }
        } else {
            $coOwner = $user->coOwner;
            if (!$coOwner || $notice->co_owner_id != $coOwner->id) {
                return back()->with('error', 'Vous n\'avez pas accès à cet avis');
            }
        }

        try {
            $paymentLink = $notice->generatePaymentLink();
            $this->sendDueNoticeEmail($notice, $paymentLink);
            $notice->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            Log::info('Avis d\'échéance renvoyé', [
                'notice_id' => $notice->id,
                'tenant_email' => $notice->tenant->user->email,
            ]);

            return back()->with('success', 'Avis d\'échéance renvoyé avec succès');

        } catch (\Exception $e) {
            Log::error('Erreur renvoi avis échéance', [
                'error' => $e->getMessage(),
                'notice_id' => $notice->id,
            ]);
            return back()->with('error', 'Erreur lors du renvoi: ' . $e->getMessage());
        }
    }

    /**
     * Supprimer un avis d'échéance
     */
    public function destroy(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return back()->with('error', 'Non autorisé');
        }

        if (!$user->hasRole('landlord') && !$user->hasRole('co_owner')) {
            return back()->with('error', 'Non autorisé');
        }

        $notice = RentDueNotice::findOrFail($id);

        // Vérifier les droits d'accès
        if ($user->hasRole('landlord')) {
            if ($notice->landlord_id != $user->id) {
                return back()->with('error', 'Vous n\'avez pas accès à cet avis');
            }
        } else {
            $coOwner = $user->coOwner;
            if (!$coOwner || $notice->co_owner_id != $coOwner->id) {
                return back()->with('error', 'Vous n\'avez pas accès à cet avis');
            }
        }

        // Ne pas permettre la suppression si déjà payé
        if ($notice->status === 'paid') {
            return back()->with('error', 'Impossible de supprimer un avis déjà payé');
        }

        try {
            $notice->delete();

            Log::info('Avis d\'échéance supprimé', [
                'notice_id' => $id,
                'user_id' => $user->id,
            ]);

            return redirect()
                ->route('co-owner.rent-due-notices.index')
                ->with('success', 'Avis d\'échéance supprimé avec succès');

        } catch (\Exception $e) {
            Log::error('Erreur suppression avis échéance', [
                'error' => $e->getMessage(),
                'notice_id' => $id,
            ]);
            return back()->with('error', 'Erreur lors de la suppression: ' . $e->getMessage());
        }
    }

    /**
     * Envoyer l'email d'avis d'échéance
     */
    private function sendDueNoticeEmail(RentDueNotice $notice, string $paymentLink)
    {
        $tenant = $notice->tenant;
        $property = $notice->property;
        $tenantEmail = $tenant->user->email ?? null;

        if (!$tenantEmail) {
            throw new \Exception('Email du locataire non trouvé');
        }

        $data = [
            'tenant_name' => $tenant->first_name . ' ' . $tenant->last_name,
            'property_name' => $property->name,
            'property_address' => $property->address,
            'due_date' => Carbon::parse($notice->due_date)->format('d/m/Y'),
            'month_year' => Carbon::parse($notice->month_year . '-01')->format('F Y'),
            'rent_amount' => number_format($notice->rent_amount, 0, ',', ' ') . ' FCFA',
            'charges_amount' => number_format($notice->charges_amount, 0, ',', ' ') . ' FCFA',
            'total_amount' => number_format($notice->total_amount, 0, ',', ' ') . ' FCFA',
            'reference' => $notice->reference,
            'payment_link' => $paymentLink,
        ];

        $html = view('emails.rent-due-notice', $data)->render();

        Mail::html($html, function ($message) use ($tenantEmail, $data) {
            $message->to($tenantEmail)
                ->subject('Avis d\'échéance - ' . $data['property_name'] . ' - ' . $data['month_year']);
        });
    }

    /**
     * Commande artisan pour générer automatiquement les avis d'échéance
     */
    public static function generateAutomaticNotices()
    {
        $leases = Lease::where('status', 'active')
            ->with(['property', 'tenant.user'])
            ->get();

        $generated = 0;
        $errors = 0;

        foreach ($leases as $lease) {
            $nextDueDate = Carbon::now()->addDays(10);
            $monthYear = $nextDueDate->format('Y-m');

            $existing = RentDueNotice::where('lease_id', $lease->id)
                ->where('month_year', $monthYear)
                ->first();

            if ($existing) {
                continue;
            }

            try {
                $totalAmount = ($lease->rent_amount ?? 0) + ($lease->charges_amount ?? 0);

                $notice = RentDueNotice::create([
                    'lease_id' => $lease->id,
                    'property_id' => $lease->property_id,
                    'tenant_id' => $lease->tenant_id,
                    'landlord_id' => $lease->property->user_id,
                    'co_owner_id' => null,
                    'due_date' => $nextDueDate,
                    'rent_amount' => $lease->rent_amount ?? 0,
                    'charges_amount' => $lease->charges_amount ?? 0,
                    'total_amount' => $totalAmount,
                    'month_year' => $monthYear,
                    'status' => 'pending',
                ]);

                $paymentLink = $notice->generatePaymentLink();

                $controller = new self();
                $controller->sendDueNoticeEmail($notice, $paymentLink);

                $notice->markAsSent();
                $generated++;

                Log::info('Avis d\'échéance généré automatiquement', [
                    'lease_id' => $lease->id,
                    'notice_id' => $notice->id,
                ]);

            } catch (\Exception $e) {
                $errors++;
                Log::error('Erreur génération auto avis échéance', [
                    'lease_id' => $lease->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Génération automatique terminée', [
            'generated' => $generated,
            'errors' => $errors,
        ]);

        return [
            'generated' => $generated,
            'errors' => $errors,
        ];
    }

    private function getAuthenticatedUser(Request $request)
    {
        if ($request->bearerToken()) {
            $token = $request->bearerToken();
            $sanctumToken = PersonalAccessToken::findToken($token);
            if ($sanctumToken) {
                $user = $sanctumToken->tokenable;
                auth('web')->login($user);
                return $user;
            }
        }

        if ($request->has('api_token')) {
            $token = $request->get('api_token');
            $sanctumToken = PersonalAccessToken::findToken($token);
            if ($sanctumToken) {
                $user = $sanctumToken->tokenable;
                auth('web')->login($user);
                return $user;
            }
        }

        if (auth()->check()) {
            return auth()->user();
        }

        return null;
    }
}
