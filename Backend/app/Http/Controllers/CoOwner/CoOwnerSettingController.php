<?php

namespace App\Http\Controllers\CoOwner;

use App\Http\Controllers\Controller;
use App\Models\CoOwner;
use App\Models\User;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Session;

class CoOwnerSettingController extends Controller
{
    /**
     * Afficher la page des paramètres
     */
    public function index()
    {
        $user = Auth::user();
        $coOwner = CoOwner::where('user_id', $user->id)->first();

        // Vérifier si l'utilisateur est bien un co-propriétaire
        if (!$coOwner) {
            return redirect()->route('home')->with('error', 'Accès non autorisé');
        }

        // Récupérer les notifications depuis le meta du co-owner
        $notifications = $coOwner->meta['notifications'] ?? [
            'email_notifications' => true,
            'payment_reminders' => true,
            'lease_expiry' => true,
            'maintenance' => true,
            'newsletter' => false,
        ];

        // Récupérer les préférences d'apparence depuis l'utilisateur
        $appearance = [
            'theme' => $user->dark_mode ? 'dark' : 'light',
            'language' => $user->language ?? 'fr',
            'date_format' => $user->date_format ?? 'dd/mm/yyyy',
        ];

        // Récupérer le format horaire depuis le meta
        $timeFormat = $coOwner->meta['time_format'] ?? '24h';
        $appearance['time_format'] = $timeFormat;

        // Récupérer les infos de sécurité
        $security = [
            'last_password_change_days' => $user->last_password_change ? $user->last_password_change->diffInMonths(now()) : 3,
            'two_factor_enabled' => (bool) ($user->two_factor_enabled ?? false),
            'two_factor_secret' => $user->two_factor_secret ? decrypt($user->two_factor_secret) : null,
            'two_factor_recovery_codes' => $user->two_factor_recovery_codes ? json_decode(decrypt($user->two_factor_recovery_codes), true) : [],
        ];

        // Récupérer les méthodes de paiement
        $paymentMethods = PaymentMethod::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Récupérer les paramètres avancés
        $advanced = [
            'auto_backup' => $coOwner->meta['auto_backup'] ?? true,
            'classic_mode' => $coOwner->meta['classic_mode'] ?? false,
        ];

        return view('co-owner.settings.index', [
            'user' => $user,
            'coOwner' => $coOwner,
            'notifications' => $notifications,
            'appearance' => $appearance,
            'security' => $security,
            'advanced' => $advanced,
            'paymentMethods' => $paymentMethods,
            'title' => 'Paramètres du compte',
            'page_title' => 'Paramètres'
        ]);
    }

    /**
     * Mettre à jour les préférences de notifications
     */
    public function updateNotifications(Request $request)
    {
        $user = Auth::user();
        $coOwner = CoOwner::where('user_id', $user->id)->first();

        $validated = $request->validate([
            'email_notifications' => 'boolean',
            'payment_reminders' => 'boolean',
            'lease_expiry' => 'boolean',
            'maintenance' => 'boolean',
            'newsletter' => 'boolean',
        ]);

        $meta = $coOwner->meta ?? [];
        $meta['notifications'] = array_merge($meta['notifications'] ?? [], $validated);
        $coOwner->meta = $meta;
        $coOwner->save();

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Préférences de notifications mises à jour avec succès');
    }

    /**
     * Mettre à jour les préférences d'apparence
     */
    public function updateAppearance(Request $request)
    {
        $user = Auth::user();
        $coOwner = CoOwner::where('user_id', $user->id)->first();

        $validated = $request->validate([
            'theme' => 'in:light,dark',
            'language' => 'in:fr,en',
            'time_format' => 'in:24h,12h',
            'date_format' => 'in:dd/mm/yyyy,mm/dd/yyyy,yyyy-mm-dd',
        ]);

        if (isset($validated['theme'])) {
            $user->dark_mode = $validated['theme'] === 'dark';
        }
        if (isset($validated['language'])) {
            $user->language = $validated['language'];
            // Mettre à jour la session pour la langue
            Session::put('locale', $validated['language']);
        }
        if (isset($validated['date_format'])) {
            $user->date_format = $validated['date_format'];
        }

        // Sauvegarder le format horaire dans le meta
        if (isset($validated['time_format'])) {
            $meta = $coOwner->meta ?? [];
            $meta['time_format'] = $validated['time_format'];
            $coOwner->meta = $meta;
            $coOwner->save();
        }

        $user->save();

        $themeName = $validated['theme'] === 'dark' ? 'Sombre' : 'Clair';
        $languageName = $validated['language'] === 'fr' ? 'Français' : 'English';

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Préférences d\'apparence mises à jour - Thème: ' . $themeName . ' - Langue: ' . $languageName);
    }

    /**
     * Mettre à jour le mot de passe
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Erreur de validation: ' . implode(', ', $validator->errors()->all()));
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return redirect()->back()
                ->withErrors(['current_password' => 'Mot de passe actuel incorrect'])
                ->withInput()
                ->with('error', 'Mot de passe actuel incorrect');
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'last_password_change' => now(),
        ]);

        Log::info('Mot de passe co-propriétaire mis à jour', [
            'user_id' => $user->id
        ]);

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Mot de passe modifié avec succès');
    }

    /**
     * Activer l'authentification à deux facteurs
     */
    public function enableTwoFactor(Request $request)
    {
        $user = Auth::user();

        try {
            $secret = Str::random(20);
            $recoveryCodes = [];
            for ($i = 0; $i < 8; $i++) {
                $recoveryCodes[] = Str::upper(Str::random(8));
            }

            $user->two_factor_enabled = true;
            $user->two_factor_secret = encrypt($secret);
            $user->two_factor_recovery_codes = encrypt(json_encode($recoveryCodes));
            $user->save();

            return redirect()->route('co-owner.settings.index')
                ->with('success', 'Authentification à deux facteurs activée')
                ->with('two_factor_secret', $secret)
                ->with('two_factor_recovery_codes', $recoveryCodes);

        } catch (\Exception $e) {
            Log::error('Erreur activation 2FA: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Erreur lors de l\'activation');
        }
    }

    /**
     * Désactiver l'authentification à deux facteurs
     */
    public function disableTwoFactor(Request $request)
    {
        $user = Auth::user();

        try {
            $user->two_factor_enabled = false;
            $user->two_factor_secret = null;
            $user->two_factor_recovery_codes = null;
            $user->save();

            return redirect()->route('co-owner.settings.index')
                ->with('success', 'Authentification à deux facteurs désactivée');

        } catch (\Exception $e) {
            Log::error('Erreur désactivation 2FA: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Erreur lors de la désactivation');
        }
    }

    /**
     * Ajouter une méthode de paiement
     */
    public function addPaymentMethod(Request $request)
    {
        $user = Auth::user();

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
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Erreur de validation: ' . implode(', ', $validator->errors()->all()));
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

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Méthode de paiement ajoutée avec succès');
    }

    /**
     * Supprimer une méthode de paiement
     */
    public function deletePaymentMethod(Request $request, $id)
    {
        $user = Auth::user();

        $method = PaymentMethod::where('user_id', $user->id)->findOrFail($id);
        $wasDefault = $method->is_default;
        $methodName = $method->display_name;

        $method->delete();

        // Si c'était la méthode par défaut, définir une autre comme défaut
        if ($wasDefault) {
            $newDefault = PaymentMethod::where('user_id', $user->id)->first();
            if ($newDefault) {
                $newDefault->update(['is_default' => true]);
                return redirect()->route('co-owner.settings.index')
                    ->with('success', 'Méthode de paiement supprimée - Nouvelle méthode par défaut: ' . $newDefault->display_name);
            }
        }

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Méthode de paiement supprimée avec succès');
    }

    /**
     * Définir une méthode de paiement comme par défaut
     */
    public function setDefaultPaymentMethod(Request $request, $id)
    {
        $user = Auth::user();

        $method = PaymentMethod::where('user_id', $user->id)->findOrFail($id);

        PaymentMethod::where('user_id', $user->id)->update(['is_default' => false]);
        $method->update(['is_default' => true]);

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Méthode de paiement par défaut mise à jour: ' . $method->display_name);
    }

    /**
     * Mettre à jour les paramètres avancés
     */
    public function updateAdvanced(Request $request)
    {
        $user = Auth::user();
        $coOwner = CoOwner::where('user_id', $user->id)->first();

        $validated = $request->validate([
            'auto_backup' => 'boolean',
            'classic_mode' => 'boolean',
        ]);

        $meta = $coOwner->meta ?? [];
        $meta['auto_backup'] = $validated['auto_backup'] ?? $meta['auto_backup'] ?? true;
        $meta['classic_mode'] = $validated['classic_mode'] ?? $meta['classic_mode'] ?? false;
        $coOwner->meta = $meta;
        $coOwner->save();

        return redirect()->route('co-owner.settings.index')
            ->with('success', 'Paramètres avancés mis à jour');
    }

    /**
     * Exporter les données en CSV
     */
    public function exportData(Request $request)
    {
        $user = Auth::user();
        $coOwner = CoOwner::where('user_id', $user->id)->first();

        // Créer le contenu CSV
        $csvContent = [];

        // En-têtes
        $csvContent[] = ['Type', 'Champ', 'Valeur'];

        // Informations utilisateur
        $csvContent[] = ['Informations utilisateur', 'ID', $user->id];
        $csvContent[] = ['Informations utilisateur', 'Email', $user->email];
        $csvContent[] = ['Informations utilisateur', 'Téléphone', $user->phone];
        $csvContent[] = ['Informations utilisateur', 'Date d\'inscription', $user->created_at ? $user->created_at->format('d/m/Y H:i:s') : ''];
        $csvContent[] = ['Informations utilisateur', 'Dernière connexion', $user->last_login_at ? $user->last_login_at->format('d/m/Y H:i:s') : 'Jamais'];
        $csvContent[] = ['Informations utilisateur', 'Langue', $user->language ?? 'fr'];
        $csvContent[] = ['Informations utilisateur', 'Thème', $user->dark_mode ? 'Sombre' : 'Clair'];
        $csvContent[] = ['Informations utilisateur', 'Format de date', $user->date_format ?? 'dd/mm/yyyy'];
        $csvContent[] = ['Informations utilisateur', 'Statut', $user->status];

        // Informations co-propriétaire
        $csvContent[] = ['Co-propriétaire', 'Prénom', $coOwner->first_name ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Nom', $coOwner->last_name ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Nom de l\'entreprise', $coOwner->company_name ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Adresse', $coOwner->address ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Téléphone', $coOwner->phone ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Numéro de licence', $coOwner->license_number ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Type', $coOwner->is_professional ? ($coOwner->co_owner_type == 'agency' ? 'Agence' : 'Professionnel') : 'Particulier'];
        $csvContent[] = ['Co-propriétaire', 'IFU', $coOwner->ifu ?? ''];
        $csvContent[] = ['Co-propriétaire', 'RCCM', $coOwner->rccm ?? ''];
        $csvContent[] = ['Co-propriétaire', 'Numéro TVA', $coOwner->vat_number ?? ''];

        // Préférences
        $notifications = $coOwner->meta['notifications'] ?? [];
        $csvContent[] = ['Préférences', 'Notifications par email', isset($notifications['email_notifications']) && $notifications['email_notifications'] ? 'Oui' : 'Non'];
        $csvContent[] = ['Préférences', 'Rappels de paiements', isset($notifications['payment_reminders']) && $notifications['payment_reminders'] ? 'Oui' : 'Non'];
        $csvContent[] = ['Préférences', 'Échéance de bail', isset($notifications['lease_expiry']) && $notifications['lease_expiry'] ? 'Oui' : 'Non'];
        $csvContent[] = ['Préférences', 'Travaux et réparations', isset($notifications['maintenance']) && $notifications['maintenance'] ? 'Oui' : 'Non'];
        $csvContent[] = ['Préférences', 'Newsletter mensuelle', isset($notifications['newsletter']) && $notifications['newsletter'] ? 'Oui' : 'Non'];
        $csvContent[] = ['Préférences', 'Sauvegarde automatique', ($coOwner->meta['auto_backup'] ?? true) ? 'Activée' : 'Désactivée'];
        $csvContent[] = ['Préférences', 'Mode classique', ($coOwner->meta['classic_mode'] ?? false) ? 'Activé' : 'Désactivé'];

        // Sécurité
        $csvContent[] = ['Sécurité', 'Authentification à deux facteurs', ($user->two_factor_enabled ?? false) ? 'Activée' : 'Désactivée'];
        $csvContent[] = ['Sécurité', 'Dernier changement de mot de passe', $user->last_password_change ? $user->last_password_change->format('d/m/Y H:i:s') : 'Jamais'];

        // Méthodes de paiement
        $paymentMethods = PaymentMethod::where('user_id', $user->id)->get();
        foreach ($paymentMethods as $method) {
            $csvContent[] = ['Méthode de paiement', 'Type', $method->type_label];
            $csvContent[] = ['Méthode de paiement', 'Bénéficiaire', $method->beneficiary_name];
            $csvContent[] = ['Méthode de paiement', 'Détails', $method->display_name];
            $csvContent[] = ['Méthode de paiement', 'Par défaut', $method->is_default ? 'Oui' : 'Non'];
            $csvContent[] = ['Méthode de paiement', 'Statut', $method->is_active ? 'Actif' : 'Inactif'];
        }

        // Date d'export
        $csvContent[] = ['Export', 'Date d\'export', now()->format('d/m/Y H:i:s')];

        // Convertir en CSV
        $output = fopen('php://temp', 'w');
        foreach ($csvContent as $row) {
            fputcsv($output, $row, ';');
        }
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        $filename = 'export_coowner_' . $user->id . '_' . now()->format('Y-m-d_H-i-s') . '.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Content-Length' => strlen($csv),
        ]);
    }

    /**
     * Désactiver le compte
     */
    public function deactivateAccount(Request $request)
    {
        $user = Auth::user();
        $coOwner = CoOwner::where('user_id', $user->id)->first();

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Veuillez entrer votre mot de passe');
        }

        if (!Hash::check($request->password, $user->password)) {
            return redirect()->back()
                ->withErrors(['password' => 'Mot de passe incorrect'])
                ->withInput()
                ->with('error', 'Mot de passe incorrect');
        }

        // Désactiver le co-owner
        $coOwner->status = 'inactive';
        $coOwner->deactivated_at = now();
        $coOwner->save();

        // Désactiver l'utilisateur
        $user->status = 'inactive';
        $user->deactivated_at = now();
        $user->save();

        Auth::logout();

        Log::info('Compte désactivé', ['user_id' => $user->id]);

        return redirect()->route('login')
            ->with('success', 'Votre compte a été désactivé avec succès');
    }

    /**
     * Supprimer définitivement le compte
     */
    public function deleteAccount(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
            'confirmation' => 'required|in:SUPPRIMER',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Erreur de validation - Tapez "SUPPRIMER" pour confirmer');
        }

        if (!Hash::check($request->password, $user->password)) {
            return redirect()->back()
                ->withErrors(['password' => 'Mot de passe incorrect'])
                ->withInput()
                ->with('error', 'Mot de passe incorrect');
        }

        // Sauvegarder l'email pour le message de confirmation
        $userEmail = $user->email;

        // Supprimer les données associées
        $coOwner = CoOwner::where('user_id', $user->id)->first();
        if ($coOwner) {
            $coOwner->delete();
        }

        // Supprimer les méthodes de paiement
        PaymentMethod::where('user_id', $user->id)->delete();

        // Supprimer l'utilisateur
        $user->delete();

        Log::info('Compte supprimé définitivement', ['user_id' => $user->id, 'email' => $userEmail]);

        return redirect()->route('login')
            ->with('success', 'Votre compte ' . $userEmail . ' a été supprimé définitivement');
    }
}
