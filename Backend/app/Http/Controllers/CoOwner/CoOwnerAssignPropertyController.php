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
                return $delegation->property->status !== 'rented';
            })
            ->map(function ($delegation) {
                return $delegation->property;
            });

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
                        $fail('Ce bien est déjà loué.');
                    }

                    $isRented = Lease::where('property_id', $value)
                        ->where('status', 'active')
                        ->exists();

                    if ($isRented) {
                        $fail('Ce bien a déjà un bail actif.');
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

                    $hasActiveLease = Lease::where('tenant_id', $value)
                        ->where('status', 'active')
                        ->exists();

                    if ($hasActiveLease) {
                        $fail('Ce locataire a déjà un bail actif.');
                    }
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
        ]);

        try {
            DB::beginTransaction();

            $property = Property::find($validated['property_id']);
            if ($property->status === 'rented') {
                throw new \Exception('Ce bien est déjà loué. Veuillez rafraîchir la page.');
            }

            $leaseNumber = 'BAIL-' . date('Y') . '-' . str_pad(Lease::count() + 1, 4, '0', STR_PAD_LEFT);
            $endDate = $validated['end_date'] ?? null;

            // Statut forcé à pending_signature
            $lease = Lease::create([
                'uuid'               => Str::uuid(),
                'property_id'        => $validated['property_id'],
                'tenant_id'          => $validated['tenant_id'],
                'lease_number'       => $leaseNumber,
                'type'               => $validated['lease_type'],
                'start_date'         => $validated['start_date'],
                'end_date'           => $endDate,
                'tacit_renewal'      => true,
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

            // Le bien reste disponible jusqu'à la signature complète

            DB::commit();

            Log::info('=== BAIL CRÉÉ PAR COPRIO (pending_signature) ===', [
                'lease_id'    => $lease->id,
                'lease_number'=> $leaseNumber,
                'property_id' => $validated['property_id'],
                'tenant_id'   => $validated['tenant_id'],
                'co_owner_id' => $coOwner->id,
                'status'      => 'pending_signature',
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
