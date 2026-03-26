<?php

namespace App\Http\Controllers\CoOwner;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\Property;
use App\Models\PropertyDelegation;
use App\Models\PropertyUser;
use App\Models\Lease;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Str;

class CoOwnerAssignPropertyController extends Controller
{
    /**
     * Afficher le formulaire d'assignation de bien
     */
    public function create(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        Log::info('=== FORMULAIRE ASSIGNATION BIEN (COPRIO) ===', [
            'user_id' => $user ? $user->id : null,
            'user_email' => $user ? $user->email : null,
        ]);

        if (!$user) {
            return redirect()->route('login')->with('error', 'Veuillez vous connecter');
        }

        if (!$user->hasRole('co_owner')) {
            return redirect()->route('login')->with('error', 'Accès réservé aux co-propriétaires');
        }

        $coOwner = $user->coOwner;
        if (!$coOwner) {
            return redirect()->route('login')->with('error', 'Profil co-propriétaire non trouvé');
        }

        $delegatedProperties = PropertyDelegation::where('co_owner_id', $coOwner->id)
            ->where('status', 'active')
            ->with('property')
            ->get()
            ->filter(function ($delegation) {
                if (!$delegation->property) {
                    return false;
                }
                // Un bien peut être loué plusieurs fois (différents baux), mais on vérifie juste s'il n'est pas en cours de location active
                // On ne bloque pas la location si le bien a déjà un bail actif - un bien peut avoir plusieurs baux successifs
                $hasActiveLease = Lease::where('property_id', $delegation->property->id)
                    ->where('status', 'active')
                    ->exists();

                // On autorise toujours la création d'un nouveau bail, même si le bien a déjà été loué
                // On ne filtre que les biens qui n'ont pas de bail actif (car un bien ne peut pas avoir 2 baux actifs en même temps)
                return !$hasActiveLease;
            })
            ->map(function ($delegation) {
                return $delegation->property;
            });

        // Récupérer TOUS les locataires (pas seulement ceux sans bail actif)
        $tenants = Tenant::where('meta->landlord_id', $coOwner->landlord_id)
            ->with('user')
            ->get();

        Log::info('Données pour formulaire assignation', [
            'properties_count' => $delegatedProperties->count(),
            'tenants_count' => $tenants->count(),
            'co_owner_id' => $coOwner->id,
            'landlord_id' => $coOwner->landlord_id,
        ]);

        return view('co-owner.assign-property.create', compact('delegatedProperties', 'tenants', 'user'));
    }

    /**
     * Assigner un bien à un locataire — statut forcé à pending_signature
     * Un locataire peut avoir plusieurs baux actifs (louer plusieurs biens)
     */
    public function store(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user || !$user->hasRole('co_owner')) {
            return back()->with('error', 'Non autorisé')->withInput();
        }

        $coOwner = $user->coOwner;
        if (!$coOwner) {
            return back()->with('error', 'Profil co-propriétaire non trouvé')->withInput();
        }

        $validated = $request->validate([
            'property_id' => [
                'required',
                'exists:properties,id',
                function ($attribute, $value, $fail) use ($coOwner) {
                    $delegation = PropertyDelegation::where('property_id', $value)
                        ->where('co_owner_id', $coOwner->id)
                        ->where('status', 'active')
                        ->first();

                    if (!$delegation) {
                        $fail('Ce bien ne vous est pas délégué.');
                    }

                    $property = Property::find($value);
                    if ($property && $property->status === 'rented') {
                        // Le bien peut être en statut "loué" mais cela n'empêche pas de créer un nouveau bail
                        // On continue quand même, le statut sera mis à jour lors de la signature
                    }

                    // Vérifier si le bien a déjà un bail ACTIF (pas en attente, pas résilié)
                    $hasActiveLease = Lease::where('property_id', $value)
                        ->where('status', 'active')
                        ->exists();

                    if ($hasActiveLease) {
                        $fail('Ce bien a déjà un bail actif. Vous ne pouvez pas créer un nouveau bail tant que le bail actif n\'est pas résilié.');
                    }
                }
            ],
            'tenant_id' => [
                'required',
                'exists:tenants,id',
                function ($attribute, $value, $fail) use ($coOwner) {
                    $tenant = Tenant::find($value);
                    if (!$tenant || ($tenant->meta['landlord_id'] ?? null) != $coOwner->landlord_id) {
                        $fail('Ce locataire ne vous est pas associé.');
                    }

                    // SUPPRESSION DE LA VÉRIFICATION DU BAIL ACTIF
                    // Un locataire peut avoir plusieurs baux actifs (louer plusieurs biens)
                    // On ne bloque donc plus la création si le locataire a déjà un bail actif
                }
            ],
            'lease_type'         => 'required|in:nu,meuble',
            'start_date'         => 'required|date',
            'duration_months'    => 'required|integer|min:1|max:120',
            'end_date'           => 'nullable|date',
            'rent_amount'        => 'required|numeric|min:1',
            'charges_amount'     => 'nullable|numeric|min:0',
            'guarantee_amount'   => 'nullable|numeric|min:0',
            'billing_day'        => 'required|integer|min:1|max:28',
            'payment_frequency'  => 'required|in:monthly,quarterly,annually',
            'payment_mode'       => 'nullable|string|max:100',
            'special_conditions' => 'nullable|string|max:5000',
            'tacit_renewal'      => 'nullable|boolean',
        ]);

        try {
            DB::beginTransaction();

            $property = Property::find($validated['property_id']);

            // Le bien peut être déjà en statut "rented", on continue
            // Le statut sera mis à jour lors de la signature du bail

            $leaseNumber = 'BAIL-' . date('Y') . '-' . str_pad(Lease::count() + 1, 4, '0', STR_PAD_LEFT);
            $endDate = $validated['end_date'] ?? null;
            $tacitRenewal = isset($validated['tacit_renewal']) ? (bool)$validated['tacit_renewal'] : true;

            $lease = Lease::create([
                'uuid'               => Str::uuid(),
                'property_id'        => $validated['property_id'],
                'tenant_id'          => $validated['tenant_id'],
                'lease_number'       => $leaseNumber,
                'type'               => $validated['lease_type'],
                'start_date'         => $validated['start_date'],
                'end_date'           => $endDate,
                'tacit_renewal'      => $tacitRenewal,
                'rent_amount'        => $validated['rent_amount'],
                'charges_amount'     => $validated['charges_amount'] ?? 0,
                'guarantee_amount'   => $validated['guarantee_amount'] ?? 0,
                'prepaid_rent_months'=> 0,
                'billing_day'        => $validated['billing_day'],
                'payment_frequency'  => $validated['payment_frequency'],
                'penalty_rate'       => 0,
                'status'             => 'pending_signature',
                'landlord_signature' => null,
                'tenant_signature'   => null,
                'signed_at'          => null,
                'terms'              => [
                    'payment_mode'       => $validated['payment_mode'] ?? 'Espèce',
                    'special_conditions' => $validated['special_conditions'] ?? null,
                    'created_by_co_owner'=> $coOwner->id,
                ],
            ]);

            $tenant = Tenant::find($validated['tenant_id']);

            // Vérifier si le lien PropertyUser existe déjà
            $existingPropertyUser = PropertyUser::where('property_id', $validated['property_id'])
                ->where('tenant_id', $validated['tenant_id'])
                ->first();

            if ($existingPropertyUser) {
                // Mettre à jour le lien existant
                $existingPropertyUser->update([
                    'lease_id'         => $lease->id,
                    'start_date'       => $validated['start_date'],
                    'end_date'         => $endDate,
                    'status'           => 'pending',
                ]);
            } else {
                // Créer un nouveau lien
                PropertyUser::create([
                    'property_id'      => $validated['property_id'],
                    'user_id'          => $tenant->user_id,
                    'tenant_id'        => $validated['tenant_id'],
                    'lease_id'         => $lease->id,
                    'role'             => 'tenant',
                    'share_percentage' => 100,
                    'start_date'       => $validated['start_date'],
                    'end_date'         => $endDate,
                    'status'           => 'pending',
                ]);
            }

            DB::commit();

            Log::info('=== BAIL CRÉÉ PAR COPRIO (pending_signature) ===', [
                'lease_id'    => $lease->id,
                'lease_number'=> $leaseNumber,
                'property_id' => $validated['property_id'],
                'tenant_id'   => $validated['tenant_id'],
                'co_owner_id' => $coOwner->id,
                'status'      => 'pending_signature',
                'tacit_renewal' => $tacitRenewal,
            ]);

            return redirect()
                ->route('co-owner.assign-property.create')
                ->with('success', 'Contrat de location créé avec succès ! Numéro de bail: ' . $leaseNumber);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Erreur création bail par co-propriétaire', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()
                ->with('error', 'Erreur lors de la création du contrat: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Méthode utilitaire pour récupérer l'utilisateur authentifié
     */
    private function getAuthenticatedUser(Request $request)
    {
        if ($request->bearerToken()) {
            $sanctumToken = PersonalAccessToken::findToken($request->bearerToken());
            if ($sanctumToken) {
                $user = $sanctumToken->tokenable;
                auth('web')->login($user);
                return $user;
            }
        }

        if ($request->has('api_token')) {
            $sanctumToken = PersonalAccessToken::findToken($request->get('api_token'));
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
