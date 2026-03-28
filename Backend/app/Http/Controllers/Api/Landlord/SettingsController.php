<?php

namespace App\Http\Controllers\Api\Landlord;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Session;

class SettingsController extends Controller
{
    private function getUser()
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }
        return $user;
    }

    /**
     * GET /api/landlord/settings - Récupérer les paramètres
     */
    public function index()
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $landlord = $user->landlord;

            // Valeurs par défaut des notifications
            $defaultNotifications = [
                'email_notifications' => true,
                'payment_reminders' => true,
                'lease_expiry' => true,
                'maintenance' => true,
                'newsletter' => false,
            ];

            // Fusionner avec les paramètres existants
            $notificationSettings = array_merge(
                $defaultNotifications,
                $user->notification_settings ?? []
            );

            // Récupérer les méthodes de paiement
            $paymentMethods = PaymentMethod::where('user_id', $user->id)
                ->orderBy('is_default', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($method) {
                    return [
                        'id' => $method->id,
                        'type' => $method->type,
                        'type_label' => $method->type_label,
                        'display_name' => $method->display_name,
                        'beneficiary_name' => $method->beneficiary_name,
                        'is_default' => $method->is_default,
                        'is_active' => $method->is_active,
                        'icon' => $method->icon,
                        'color' => $method->color,
                        'mobile_operator' => $method->mobile_operator,
                        'mobile_number' => $method->mobile_number,
                        'card_last4' => $method->card_last4,
                        'card_brand' => $method->card_brand,
                        'bank_name' => $method->bank_name,
                        'bank_account_number' => $method->bank_account_number,
                    ];
                });

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'first_name' => $landlord->first_name ?? null,
                    'last_name' => $landlord->last_name ?? null,
                    'address' => $landlord->address ?? null,
                    'company_name' => $landlord->company_name ?? null,
                    'created_at' => $user->created_at,
                ],
                'security' => [
                    'two_factor_enabled' => (bool) ($user->two_factor_enabled ?? false),
                    'last_password_change_days' => $user->last_password_change ? $user->last_password_change->diffInMonths(now()) : 3,
                    'last_password_change' => $user->last_password_change,
                    'last_login_at' => $user->last_login_at,
                    'last_login_ip' => $user->last_login_ip,
                ],
                'preferences' => [
                    'language' => $user->language ?? 'fr',
                    'timezone' => $user->timezone ?? 'Europe/Paris',
                    'date_format' => $user->date_format ?? 'dd/mm/yyyy',
                    'time_format' => $user->time_format ?? '24h',
                    'currency' => $user->currency ?? 'FCFA',
                    'dark_mode' => (bool) $user->dark_mode,
                ],
                'notifications' => $notificationSettings,
                'payment_methods' => $paymentMethods,
                'advanced' => [
                    'auto_backup' => $user->auto_backup ?? true,
                    'classic_mode' => $user->classic_mode ?? false,
                ],
                'privacy' => [
                    'data_sharing' => (bool) $user->data_sharing,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur chargement paramètres landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors du chargement des paramètres'
            ], 500);
        }
    }

    /**
     * PUT /api/landlord/settings/notifications - Mettre à jour les notifications
     */
    public function updateNotifications(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $validated = $request->validate([
                'email_notifications' => 'sometimes|boolean',
                'payment_reminders' => 'sometimes|boolean',
                'lease_expiry' => 'sometimes|boolean',
                'maintenance' => 'sometimes|boolean',
                'newsletter' => 'sometimes|boolean',
            ]);

            $currentSettings = $user->notification_settings ?? [];
            $newSettings = array_merge($currentSettings, $validated);

            $user->notification_settings = $newSettings;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Préférences de notifications mises à jour',
                'notifications' => $newSettings
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour notifications landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour'
            ], 500);
        }
    }

    /**
     * PUT /api/landlord/settings/preferences - Mettre à jour les préférences
     */
    public function updatePreferences(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $validated = $request->validate([
                'language' => 'sometimes|in:fr,en',
                'date_format' => 'sometimes|in:dd/mm/yyyy,mm/dd/yyyy,yyyy-mm-dd',
                'time_format' => 'sometimes|in:24h,12h',
                'dark_mode' => 'sometimes|boolean',
            ]);

            foreach ($validated as $key => $value) {
                $user->$key = $value;
            }
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Préférences mises à jour',
                'preferences' => [
                    'language' => $user->language,
                    'date_format' => $user->date_format,
                    'time_format' => $user->time_format,
                    'dark_mode' => (bool) $user->dark_mode,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour préférences landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour'
            ], 500);
        }
    }

    /**
     * PUT /api/landlord/settings/password - Changer le mot de passe
     */
    public function updatePassword(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le mot de passe actuel est incorrect'
                ], 422);
            }

            $user->password = Hash::make($request->new_password);
            $user->last_password_change = now();
            $user->save();

            Log::info('Mot de passe changé - Landlord', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe changé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur changement mot de passe landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors du changement de mot de passe'
            ], 500);
        }
    }

    /**
     * POST /api/landlord/settings/2fa/enable - Activer 2FA
     */
    public function enableTwoFactor(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $secret = Str::random(20);
            $recoveryCodes = [];
            for ($i = 0; $i < 8; $i++) {
                $recoveryCodes[] = Str::upper(Str::random(8));
            }

            $user->two_factor_enabled = true;
            $user->two_factor_secret = encrypt($secret);
            $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Authentification à deux facteurs activée',
                'secret' => $secret,
                'recovery_codes' => $recoveryCodes,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur activation 2FA landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de l\'activation'
            ], 500);
        }
    }

    /**
     * POST /api/landlord/settings/2fa/disable - Désactiver 2FA
     */
    public function disableTwoFactor(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $user->two_factor_enabled = false;
            $user->two_factor_secret = null;
            $user->two_factor_recovery_codes = null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Authentification à deux facteurs désactivée'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur désactivation 2FA landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la désactivation'
            ], 500);
        }
    }

    /**
     * POST /api/landlord/settings/payment-method/add - Ajouter une méthode de paiement
     */
    public function addPaymentMethod(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $rules = [
                'type' => 'required|in:mobile_money,card,bank_transfer,cash',
                'beneficiary_name' => 'required|string|max:255',
                'is_default' => 'sometimes|boolean',
            ];

            switch ($request->type) {
                case 'mobile_money':
                    $rules = array_merge($rules, [
                        'mobile_operator' => 'required|string|in:MTN,MOOV,CELTIS,ORANGE,WAVE',
                        'mobile_number' => 'required|string|max:20',
                    ]);
                    break;
                case 'card':
                    $rules = array_merge($rules, [
                        'card_last4' => 'required|string|size:4',
                        'card_brand' => 'required|string|in:Visa,Mastercard,American Express',
                    ]);
                    break;
                case 'bank_transfer':
                    $rules = array_merge($rules, [
                        'bank_name' => 'required|string|max:255',
                        'bank_account_number' => 'required|string|max:50',
                    ]);
                    break;
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            // Si c'est la méthode par défaut, retirer le statut des autres
            if ($request->boolean('is_default')) {
                PaymentMethod::where('user_id', $user->id)->update(['is_default' => false]);
            }

            $method = PaymentMethod::create([
                'user_id' => $user->id,
                'type' => $validated['type'],
                'beneficiary_name' => $validated['beneficiary_name'],
                'country' => 'BJ',
                'currency' => 'XOF',
                'is_default' => $request->boolean('is_default', false),
                'is_active' => true,
                'mobile_operator' => $validated['mobile_operator'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'card_last4' => $validated['card_last4'] ?? null,
                'card_brand' => $validated['card_brand'] ?? null,
                'bank_name' => $validated['bank_name'] ?? null,
                'bank_account_number' => $validated['bank_account_number'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Méthode de paiement ajoutée avec succès',
                'data' => [
                    'id' => $method->id,
                    'type' => $method->type,
                    'type_label' => $method->type_label,
                    'display_name' => $method->display_name,
                    'beneficiary_name' => $method->beneficiary_name,
                    'is_default' => $method->is_default,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur ajout méthode paiement landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de l\'ajout'
            ], 500);
        }
    }

    /**
     * DELETE /api/landlord/settings/payment-method/{id} - Supprimer une méthode de paiement
     */
    public function deletePaymentMethod(Request $request, $id)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $method = PaymentMethod::where('user_id', $user->id)->findOrFail($id);
            $wasDefault = $method->is_default;

            $method->delete();

            // Si c'était la méthode par défaut, définir une autre comme défaut
            if ($wasDefault) {
                $newDefault = PaymentMethod::where('user_id', $user->id)->first();
                if ($newDefault) {
                    $newDefault->update(['is_default' => true]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Méthode de paiement supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression méthode paiement landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression'
            ], 500);
        }
    }

    /**
     * PUT /api/landlord/settings/payment-method/{id}/set-default - Définir une méthode comme par défaut
     */
    public function setDefaultPaymentMethod(Request $request, $id)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $method = PaymentMethod::where('user_id', $user->id)->findOrFail($id);

            PaymentMethod::where('user_id', $user->id)->update(['is_default' => false]);
            $method->update(['is_default' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Méthode de paiement par défaut mise à jour'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour méthode par défaut landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour'
            ], 500);
        }
    }

    /**
     * PUT /api/landlord/settings/advanced - Mettre à jour les paramètres avancés
     */
    public function updateAdvanced(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $validated = $request->validate([
                'auto_backup' => 'boolean',
                'classic_mode' => 'boolean',
            ]);

            $user->auto_backup = $validated['auto_backup'] ?? $user->auto_backup ?? true;
            $user->classic_mode = $validated['classic_mode'] ?? $user->classic_mode ?? false;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Paramètres avancés mis à jour'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur mise à jour paramètres avancés landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la mise à jour'
            ], 500);
        }
    }

    /**
     * GET /api/landlord/settings/export-data - Exporter les données
     */
    public function exportData(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $landlord = $user->landlord;
            $paymentMethods = PaymentMethod::where('user_id', $user->id)->get();

            $data = [
                'exported_at' => now()->toIso8601String(),
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'created_at' => $user->created_at,
                    'last_login_at' => $user->last_login_at,
                    'language' => $user->language,
                    'dark_mode' => $user->dark_mode,
                    'date_format' => $user->date_format,
                ],
                'landlord' => [
                    'first_name' => $landlord->first_name ?? '',
                    'last_name' => $landlord->last_name ?? '',
                    'company_name' => $landlord->company_name ?? '',
                    'address' => $landlord->address ?? '',
                    'phone' => $landlord->phone ?? '',
                    'license_number' => $landlord->license_number ?? '',
                ],
                'preferences' => [
                    'notifications' => $user->notification_settings ?? [],
                    'auto_backup' => $user->auto_backup ?? true,
                    'classic_mode' => $user->classic_mode ?? false,
                ],
                'security' => [
                    'two_factor_enabled' => (bool) $user->two_factor_enabled,
                    'last_password_change' => $user->last_password_change,
                ],
                'payment_methods' => $paymentMethods->map(function ($method) {
                    return [
                        'type' => $method->type,
                        'beneficiary_name' => $method->beneficiary_name,
                        'is_default' => $method->is_default,
                    ];
                }),
            ];

            $filename = 'export_landlord_' . $user->id . '_' . now()->format('Y-m-d_H-i-s') . '.json';

            return response()->json($data, 200, [
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur export données landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de l\'export des données'
            ], 500);
        }
    }

    /**
     * POST /api/landlord/settings/deactivate - Désactiver le compte
     */
    public function deactivateAccount(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe requis'
                ], 422);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 422);
            }

            $landlord = $user->landlord;
            if ($landlord) {
                $landlord->status = 'inactive';
                $landlord->deactivated_at = now();
                $landlord->save();
            }

            $user->status = 'inactive';
            $user->deactivated_at = now();
            $user->save();

            Log::info('Compte landlord désactivé', ['user_id' => $user->id]);

            return response()->json([
                'success' => true,
                'message' => 'Votre compte a été désactivé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur désactivation compte landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la désactivation'
            ], 500);
        }
    }

    /**
     * DELETE /api/landlord/settings/account - Supprimer définitivement le compte
     */
    public function deleteAccount(Request $request)
    {
        try {
            $user = $this->getUser();

            if (!$user) {
                return response()->json(['message' => 'Non authentifié'], 401);
            }

            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
                'confirmation' => 'required|in:SUPPRIMER',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation - Tapez "SUPPRIMER" pour confirmer'
                ], 422);
            }

            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mot de passe incorrect'
                ], 422);
            }

            $userEmail = $user->email;

            $landlord = $user->landlord;
            if ($landlord) {
                $landlord->delete();
            }

            PaymentMethod::where('user_id', $user->id)->delete();
            $user->delete();

            Log::info('Compte landlord supprimé définitivement', ['user_id' => $user->id, 'email' => $userEmail]);

            return response()->json([
                'success' => true,
                'message' => 'Votre compte a été supprimé définitivement'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur suppression compte landlord: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression du compte'
            ], 500);
        }
    }
}
