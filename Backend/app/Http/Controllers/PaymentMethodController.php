<?php
// app/Http/Controllers/PaymentMethodController.php

namespace App\Http\Controllers;

use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class PaymentMethodController extends Controller
{
    /**
     * Récupère l'utilisateur authentifié (API + Web)
     */
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

        return auth()->user();
    }

    /**
     * Liste toutes les méthodes de paiement de l'utilisateur
     */
    public function index(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $methods = PaymentMethod::forUser($user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $methods
        ]);
    }

    /**
     * Affiche les détails d'une méthode de paiement
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            if (!$user) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Non authentifié'
                    ], 401);
                }
                return redirect('http://localhost:8080/login');
            }

            $method = PaymentMethod::where('user_id', $user->id)
                ->findOrFail($id);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'data' => $method
                ]);
            }

            return view('payment-methods.show', compact('method'));

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Méthode de paiement non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche le formulaire de création (pour les vues Blade)
     */
    public function create(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return redirect('http://localhost:8080/login');
        }

        return view('payment-methods.create');
    }

    /**
     * Enregistre une nouvelle méthode de paiement
     */
    public function store(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $rules = [
            'type' => 'required|in:mobile_money,card,bank_transfer,cash',
            'beneficiary_name' => 'required|string|max:255',
            'country' => 'required|string|size:2',
            'currency' => 'required|string|size:3',
            'is_default' => 'sometimes|boolean',
        ];

        // Règles selon le type
        switch ($request->type) {
            case 'mobile_money':
                $rules = array_merge($rules, [
                    'mobile_operator' => 'required|string|in:MTN,MOOV,CELTIS,ORANGE,WAVE',
                    'mobile_number' => 'required|string|max:20',
                ]);
                break;

            case 'card':
                $rules = array_merge($rules, [
                    'card_token' => 'required|string',
                    'card_last4' => 'required|string|size:4',
                    'card_brand' => 'required|string|in:Visa,Mastercard,American Express',
                ]);
                break;

            case 'bank_transfer':
                $rules = array_merge($rules, [
                    'bank_name' => 'required|string|max:255',
                    'bank_account_number' => 'required|string|max:50',
                    'bank_iban' => 'nullable|string|max:50',
                    'bank_swift' => 'nullable|string|max:20',
                ]);
                break;
        }

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            // Si c'est la méthode par défaut, retirer le statut des autres
            if ($request->boolean('is_default')) {
                PaymentMethod::where('user_id', $user->id)
                    ->update(['is_default' => false]);
            }

            $method = PaymentMethod::create([
                'user_id' => $user->id,
                'type' => $validated['type'],
                'beneficiary_name' => $validated['beneficiary_name'],
                'country' => $validated['country'],
                'currency' => $validated['currency'],
                'is_default' => $request->boolean('is_default', false),
                'is_active' => true,
                'mobile_operator' => $validated['mobile_operator'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'card_token' => $validated['card_token'] ?? null,
                'card_last4' => $validated['card_last4'] ?? null,
                'card_brand' => $validated['card_brand'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'bank_account_number' => $validated['bank_account_number'] ?? null,
                'bank_iban' => $validated['bank_iban'] ?? null,
                'bank_swift' => $validated['bank_swift'] ?? null,
                'metadata' => [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
            ]);

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Méthode de paiement ajoutée avec succès',
                    'data' => $method
                ]);
            }

            return redirect()->route('payment-methods.index')
                ->with('success', 'Méthode de paiement ajoutée avec succès.');

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Erreur lors de l\'ajout: ' . $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Erreur lors de l\'ajout: ' . $e->getMessage());
        }
    }

    /**
     * Met à jour une méthode de paiement
     */
    public function update(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $method = PaymentMethod::where('user_id', $user->id)
            ->findOrFail($id);

        $rules = [
            'beneficiary_name' => 'sometimes|string|max:255',
            'country' => 'sometimes|string|size:2',
            'currency' => 'sometimes|string|size:3',
            'is_default' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ];

        // Règles selon le type existant
        switch ($method->type) {
            case 'mobile_money':
                $rules = array_merge($rules, [
                    'mobile_operator' => 'sometimes|string|in:MTN,MOOV,CELTIS,ORANGE,WAVE',
                    'mobile_number' => 'sometimes|string|max:20',
                ]);
                break;

            case 'card':
                $rules = array_merge($rules, [
                    'card_last4' => 'sometimes|string|size:4',
                    'card_brand' => 'sometimes|string|in:Visa,Mastercard,American Express',
                ]);
                break;

            case 'bank_transfer':
                $rules = array_merge($rules, [
                    'bank_name' => 'sometimes|string|max:255',
                    'bank_account_number' => 'sometimes|string|max:50',
                    'bank_iban' => 'nullable|string|max:50',
                    'bank_swift' => 'nullable|string|max:20',
                ]);
                break;
        }

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            // Si devient par défaut, retirer le statut des autres
            if ($request->boolean('is_default') && !$method->is_default) {
                PaymentMethod::where('user_id', $user->id)
                    ->where('id', '!=', $method->id)
                    ->update(['is_default' => false]);
            }

            $method->update($validated);

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Méthode de paiement mise à jour',
                    'data' => $method->fresh()
                ]);
            }

            return redirect()->route('payment-methods.index')
                ->with('success', 'Méthode de paiement mise à jour.');

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Erreur lors de la mise à jour'
                ], 500);
            }

            return back()->with('error', 'Erreur lors de la mise à jour');
        }
    }

    /**
     * Supprime une méthode de paiement
     */
    public function destroy(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $method = PaymentMethod::where('user_id', $user->id)
            ->findOrFail($id);

        $wasDefault = $method->is_default;

        DB::beginTransaction();
        try {
            $method->delete();

            // Si c'était la méthode par défaut, définir une autre comme défaut
            if ($wasDefault) {
                $newDefault = PaymentMethod::where('user_id', $user->id)
                    ->where('id', '!=', $method->id)
                    ->first();

                if ($newDefault) {
                    $newDefault->update(['is_default' => true]);
                }
            }

            DB::commit();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Méthode de paiement supprimée'
                ]);
            }

            return redirect()->route('payment-methods.index')
                ->with('success', 'Méthode de paiement supprimée.');

        } catch (\Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Erreur lors de la suppression'
                ], 500);
            }

            return back()->with('error', 'Erreur lors de la suppression');
        }
    }

    /**
     * Définit une méthode comme par défaut
     */
    public function setDefault(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $method = PaymentMethod::where('user_id', $user->id)
            ->findOrFail($id);

        DB::transaction(function () use ($method, $user) {
            PaymentMethod::where('user_id', $user->id)
                ->update(['is_default' => false]);

            $method->update(['is_default' => true]);
        });

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Méthode par défaut mise à jour'
            ]);
        }

        return back()->with('success', 'Méthode par défaut mise à jour');
    }

    /**
     * Active/Désactive une méthode
     */
    public function toggleActive(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);

        if (!$user) {
            return response()->json(['error' => 'Non authentifié'], 401);
        }

        $method = PaymentMethod::where('user_id', $user->id)
            ->findOrFail($id);

        $method->update([
            'is_active' => !$method->is_active
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Statut mis à jour',
                'is_active' => $method->is_active
            ]);
        }

        return back()->with('success', 'Statut mis à jour');
    }
}
