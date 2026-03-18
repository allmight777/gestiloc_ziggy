<?php
// app/Http/Controllers/Api/PaymentMethodController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentMethodController extends Controller
{
    /**
     * Liste toutes les méthodes de paiement de l'utilisateur
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            $methods = PaymentMethod::where('user_id', $user->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $methods
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du chargement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche une méthode de paiement spécifique
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();

            $method = PaymentMethod::where('user_id', $user->id)
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $method
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Méthode de paiement non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du chargement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée une nouvelle méthode de paiement
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:mobile_money,card,bank_transfer,cash',
            'beneficiary_name' => 'required|string|max:255',
            'country' => 'required|string|size:2',
            'currency' => 'required|string|size:3',
            'is_default' => 'sometimes|boolean',
            'mobile_operator' => 'required_if:type,mobile_money|in:MTN,MOOV,CELTIS,ORANGE,WAVE|nullable',
            'mobile_number' => 'required_if:type,mobile_money|string|max:20|nullable',
            'card_token' => 'required_if:type,card|string|nullable',
            'card_last4' => 'required_if:type,card|string|size:4|nullable',
            'card_brand' => 'required_if:type,card|in:Visa,Mastercard,American Express|nullable',
            'bank_name' => 'required_if:type,bank_transfer|string|max:255|nullable',
            'bank_account_number' => 'required_if:type,bank_transfer|string|max:50|nullable',
            'bank_iban' => 'nullable|string|max:50',
            'bank_swift' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        DB::beginTransaction();
        try {
            // Si c'est la méthode par défaut, retirer le statut des autres
            if ($request->boolean('is_default')) {
                PaymentMethod::where('user_id', $user->id)
                    ->update(['is_default' => false]);
            }

            $method = PaymentMethod::create([
                'user_id' => $user->id,
                'type' => $request->type,
                'beneficiary_name' => $request->beneficiary_name,
                'country' => $request->country,
                'currency' => $request->currency,
                'is_default' => $request->boolean('is_default', false),
                'is_active' => true,
                'mobile_operator' => $request->mobile_operator,
                'mobile_number' => $request->mobile_number,
                'card_token' => $request->card_token,
                'card_last4' => $request->card_last4,
                'card_brand' => $request->card_brand,
                'bank_name' => $request->bank_name,
                'bank_account_number' => $request->bank_account_number,
                'bank_iban' => $request->bank_iban,
                'bank_swift' => $request->bank_swift,
                'metadata' => [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Méthode de paiement ajoutée avec succès',
                'data' => $method
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'ajout: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour une méthode de paiement
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        try {
            $method = PaymentMethod::where('user_id', $user->id)
                ->findOrFail($id);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Méthode de paiement non trouvée'
            ], 404);
        }

        $rules = [
            'beneficiary_name' => 'sometimes|string|max:255',
            'country' => 'sometimes|string|size:2',
            'currency' => 'sometimes|string|size:3',
            'is_default' => 'sometimes|boolean',
        ];

        // Règles selon le type existant
        switch ($method->type) {
            case 'mobile_money':
                $rules = array_merge($rules, [
                    'mobile_operator' => 'sometimes|in:MTN,MOOV,CELTIS,ORANGE,WAVE',
                    'mobile_number' => 'sometimes|string|max:20',
                ]);
                break;

            case 'card':
                $rules = array_merge($rules, [
                    'card_last4' => 'sometimes|string|size:4',
                    'card_brand' => 'sometimes|in:Visa,Mastercard,American Express',
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

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Si devient par défaut, retirer le statut des autres
            if ($request->boolean('is_default') && !$method->is_default) {
                PaymentMethod::where('user_id', $user->id)
                    ->where('id', '!=', $method->id)
                    ->update(['is_default' => false]);
            }

            $method->update($request->all());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Méthode de paiement mise à jour',
                'data' => $method->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime une méthode de paiement
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        try {
            $method = PaymentMethod::where('user_id', $user->id)
                ->findOrFail($id);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Méthode de paiement non trouvée'
            ], 404);
        }

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

            return response()->json([
                'success' => true,
                'message' => 'Méthode de paiement supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Définit une méthode comme par défaut
     */
    public function setDefault(Request $request, $id)
    {
        $user = $request->user();

        try {
            $method = PaymentMethod::where('user_id', $user->id)
                ->findOrFail($id);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Méthode de paiement non trouvée'
            ], 404);
        }

        DB::transaction(function () use ($method, $user) {
            PaymentMethod::where('user_id', $user->id)
                ->update(['is_default' => false]);

            $method->update(['is_default' => true]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Méthode par défaut mise à jour'
        ]);
    }
}
