@extends('layouts.co-owner')

@section('title', $title ?? 'Paramètres')

@section('content')
<style>
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Manrope:wght@400;500;600;700;800&display=swap');

    .sp-page {
        padding: 1.5rem 1rem 3rem;
        font-family: 'Manrope', sans-serif;
        color: #1a1a1a;
        width: 100%;
        box-sizing: border-box;
        max-width: 100%;
    }

    .sp-section {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 20px;
        padding: 1.8rem;
        margin-bottom: 1.5rem;
    }

    .sp-section-title {
        font-family: 'Merriweather', serif;
        font-size: 1.4rem;
        font-weight: 800;
        margin: 0 0 6px 0;
    }

    .sp-section-sub {
        font-size: 0.95rem;
        color: #9ca3af;
        margin: 0 0 22px 0;
    }

    .sp-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .sp-row:last-child {
        border-bottom: none;
    }

    .sp-row-left {
        flex: 1;
    }

    .sp-row-label {
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 4px 0;
    }

    .sp-row-desc {
        font-size: 0.85rem;
        color: #9ca3af;
        margin: 0;
    }

    .sp-row-action {
        font-size: 0.9rem;
        font-weight: 700;
        color: #83C757;
        cursor: pointer;
        background: none;
        border: none;
        font-family: 'Manrope', sans-serif;
        text-decoration: none;
        padding: 8px 16px;
        border-radius: 8px;
        transition: background 0.2s;
    }

    .sp-row-action:hover {
        background: #f0fdf4;
    }

    .sp-row-action.red {
        color: #ef4444;
    }

    .sp-row-action.red:hover {
        background: #fef2f2;
    }

    .sp-select {
        padding: 0.65rem 1rem;
        border: 1.5px solid #d1d5db;
        border-radius: 12px;
        font-size: 0.95rem;
        font-family: 'Manrope', sans-serif;
        font-weight: 500;
        color: #1f2937;
        background: #fff;
        outline: none;
        min-width: 180px;
        cursor: pointer;
    }

    .sp-select:focus {
        border-color: #83C757;
        box-shadow: 0 0 0 2px rgba(131, 199, 87, 0.2);
    }

    .sp-info-banner {
        background: #f0fdf4;
        border: 1.5px solid #83C757;
        border-radius: 14px;
        padding: 14px 20px;
        font-size: 0.9rem;
        color: #166534;
        margin-top: 14px;
    }

    .sp-danger {
        background: #fff;
        border: 1.5px solid #fecaca;
        border-radius: 20px;
        padding: 1.8rem;
        margin-bottom: 1.5rem;
    }

    .sp-danger-title {
        font-family: 'Merriweather', serif;
        font-size: 1.3rem;
        font-weight: 800;
        color: #ef4444;
        margin: 0 0 6px 0;
    }

    .sp-danger-sub {
        font-size: 0.9rem;
        color: #9ca3af;
        margin: 0 0 22px 0;
    }

    .sp-btn-outline-danger {
        background: #fff;
        border: 1.5px solid #ef4444;
        color: #ef4444;
        border-radius: 12px;
        padding: 10px 22px;
        font-family: 'Manrope', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
    }

    .sp-btn-outline-danger:hover {
        background: #ef4444;
        color: #fff;
    }

    .sp-btn-danger {
        background: #ef4444;
        border: none;
        color: #fff;
        border-radius: 12px;
        padding: 10px 22px;
        font-family: 'Manrope', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
    }

    .sp-btn-danger:hover {
        background: #dc2626;
    }

    .toggle-switch {
        width: 52px;
        height: 28px;
        border-radius: 14px;
        cursor: pointer;
        position: relative;
        transition: background 0.2s;
        flex-shrink: 0;
        background: #d1d5db;
    }

    .toggle-switch.active {
        background: #83C757;
    }

    .toggle-switch .toggle-knob {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #fff;
        position: absolute;
        top: 2px;
        left: 2px;
        transition: left 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,.15);
    }

    .toggle-switch.active .toggle-knob {
        left: 26px;
    }

    .payment-method-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 12px;
        margin-bottom: 8px;
    }

    .payment-method-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    }

    .payment-method-info {
        flex: 1;
    }

    .payment-method-name {
        font-weight: 700;
        font-size: 0.9rem;
        margin: 0;
    }

    .payment-method-details {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 2px 0 0;
    }

    .payment-method-badge {
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 20px;
        background: #e5e7eb;
        color: #374151;
    }

    .payment-method-badge.default {
        background: #83C757;
        color: white;
    }

    .sp-row-info {
        background: #f9fafb;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        margin-top: 0.75rem;
        font-size: 0.85rem;
        color: #4b5563;
    }

    .alert {
        padding: 1rem 1.25rem;
        border-radius: 12px;
        margin-bottom: 1rem;
        position: relative;
        animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .alert-success {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-left: 4px solid #83C757;
        color: #166534;
    }

    .alert-error {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-left: 4px solid #ef4444;
        color: #991b1b;
    }

    .alert-info {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        border-left: 4px solid #3b82f6;
        color: #1e40af;
    }

    .dark-mode .sp-section {
        background: #1f2937;
        border-color: #374151;
    }

    .dark-mode .sp-section-title {
        color: #f3f4f6;
    }

    .dark-mode .sp-row-label {
        color: #e5e7eb;
    }

    .dark-mode .sp-row-desc {
        color: #9ca3af;
    }

    .dark-mode .payment-method-card {
        background: #111827;
    }

    .dark-mode .payment-method-name {
        color: #f3f4f6;
    }

    .dark-mode .sp-select {
        background: #1f2937;
        border-color: #374151;
        color: #f3f4f6;
    }
</style>

<div class="sp-page {{ $appearance['theme'] == 'dark' ? 'dark-mode' : '' }}">
    <div class="max-w-4xl mx-auto">
        @if(session('success'))
            <div class="alert alert-success">
                {!! session('success') !!}
            </div>
        @endif

        @if(session('error'))
            <div class="alert alert-error">
                {!! session('error') !!}
            </div>
        @endif

        @if($errors->any())
            <div class="alert alert-error">
                <ul class="list-disc list-inside">
                    @foreach($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <!-- Notifications -->
        <div class="sp-section">
            <p class="sp-section-title">Préférences de notifications</p>
            <p class="sp-section-sub">Choisissez comment vous souhaitez être notifié</p>

            <form method="POST" action="{{ route('co-owner.settings.notifications.update') }}" id="notifications-form">
                @csrf
                @method('PUT')

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Notifications par email</p>
                        <p class="sp-row-desc">Recevez les notifications importantes par email</p>
                    </div>
                    <div class="toggle-switch {{ ($notifications['email_notifications'] ?? true) ? 'active' : '' }}" onclick="toggleSwitch(this, 'email_notifications')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="email_notifications" id="email_notifications" value="{{ ($notifications['email_notifications'] ?? true) ? '1' : '0' }}">
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Rappels de paiements</p>
                        <p class="sp-row-desc">Alertes pour les loyers à recevoir</p>
                    </div>
                    <div class="toggle-switch {{ ($notifications['payment_reminders'] ?? true) ? 'active' : '' }}" onclick="toggleSwitch(this, 'payment_reminders')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="payment_reminders" id="payment_reminders" value="{{ ($notifications['payment_reminders'] ?? true) ? '1' : '0' }}">
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Échéance de bail</p>
                        <p class="sp-row-desc">Notifications avant les renouvellements de baux</p>
                    </div>
                    <div class="toggle-switch {{ ($notifications['lease_expiry'] ?? true) ? 'active' : '' }}" onclick="toggleSwitch(this, 'lease_expiry')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="lease_expiry" id="lease_expiry" value="{{ ($notifications['lease_expiry'] ?? true) ? '1' : '0' }}">
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Travaux et réparations</p>
                        <p class="sp-row-desc">Alertes pour les interventions</p>
                    </div>
                    <div class="toggle-switch {{ ($notifications['maintenance'] ?? true) ? 'active' : '' }}" onclick="toggleSwitch(this, 'maintenance')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="maintenance" id="maintenance" value="{{ ($notifications['maintenance'] ?? true) ? '1' : '0' }}">
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Newsletter mensuelle</p>
                        <p class="sp-row-desc">Conseils et actualités de la gestion locative</p>
                    </div>
                    <div class="toggle-switch {{ ($notifications['newsletter'] ?? false) ? 'active' : '' }}" onclick="toggleSwitch(this, 'newsletter')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="newsletter" id="newsletter" value="{{ ($notifications['newsletter'] ?? false) ? '1' : '0' }}">
                </div>
            </form>
        </div>

        <!-- Méthodes de paiement -->
        <div class="sp-section">
            <p class="sp-section-title">Moyens de paiement</p>
            <p class="sp-section-sub">Gérez vos méthodes de paiement</p>

            @if($paymentMethods->count() > 0)
                @foreach($paymentMethods as $method)
                <div class="payment-method-card">
                    <div class="payment-method-icon" style="background: {{ $method->color }}20;">
                        <i class="{{ $method->icon }}" style="color: {{ $method->color }};"></i>
                    </div>
                    <div class="payment-method-info">
                        <p class="payment-method-name">{{ $method->display_name }}</p>
                        <p class="payment-method-details">{{ $method->beneficiary_name }}</p>
                    </div>
                    <div>
                        @if($method->is_default)
                            <span class="payment-method-badge default">Par défaut</span>
                        @else
                            <form method="POST" action="{{ route('co-owner.settings.payment-method.set-default', $method->id) }}" style="display: inline;">
                                @csrf
                                @method('PUT')
                                <button type="submit" class="sp-row-action" style="font-size: 0.8rem;">Définir par défaut</button>
                            </form>
                        @endif
                        <form method="POST" action="{{ route('co-owner.settings.payment-method.delete', $method->id) }}" style="display: inline;">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="sp-row-action red" style="font-size: 0.8rem;" onclick="return confirm('Supprimer cette méthode de paiement ?')">Supprimer</button>
                        </form>
                    </div>
                </div>
                @endforeach
            @else
                <div class="sp-row-info">Aucune méthode de paiement enregistrée.</div>
            @endif

            <div class="sp-row" style="border-top: 1px solid #e5e7eb; margin-top: 12px; padding-top: 16px;">
                <button class="sp-row-action" onclick="document.getElementById('payment-method-modal').style.display='flex'">+ Ajouter une méthode de paiement</button>
            </div>
        </div>

        <!-- Apparence -->
        <div class="sp-section">
            <p class="sp-section-title">Apparence</p>
            <p class="sp-section-sub">Personnalisez l'interface de l'application</p>

            <form method="POST" action="{{ route('co-owner.settings.appearance.update') }}" id="appearance-form">
                @csrf
                @method('PUT')

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Thème</p>
                        <p class="sp-row-desc">Choisir le thème de l'application</p>
                    </div>
                    <select name="theme" class="sp-select" onchange="this.form.submit()">
                        <option value="light" {{ ($appearance['theme'] ?? 'light') == 'light' ? 'selected' : '' }}>Clair</option>
                        <option value="dark" {{ ($appearance['theme'] ?? 'light') == 'dark' ? 'selected' : '' }}>Sombre</option>
                    </select>
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Langue</p>
                        <p class="sp-row-desc">Langue de l'interface</p>
                    </div>
                    <select name="language" class="sp-select" onchange="this.form.submit()">
                        <option value="fr" {{ ($appearance['language'] ?? 'fr') == 'fr' ? 'selected' : '' }}>Français</option>
                        <option value="en" {{ ($appearance['language'] ?? 'fr') == 'en' ? 'selected' : '' }}>English</option>
                    </select>
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Format horaire</p>
                        <p class="sp-row-desc">Format d'affichage des dates et heures</p>
                    </div>
                    <select name="time_format" class="sp-select" onchange="this.form.submit()">
                        <option value="24h" {{ ($appearance['time_format'] ?? '24h') == '24h' ? 'selected' : '' }}>24h (19:00)</option>
                        <option value="12h" {{ ($appearance['time_format'] ?? '24h') == '12h' ? 'selected' : '' }}>12h (07:00 PM)</option>
                    </select>
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Format de date</p>
                        <p class="sp-row-desc">Comment afficher les dates</p>
                    </div>
                    <select name="date_format" class="sp-select" onchange="this.form.submit()">
                        <option value="dd/mm/yyyy" {{ ($appearance['date_format'] ?? 'dd/mm/yyyy') == 'dd/mm/yyyy' ? 'selected' : '' }}>DD/MM/YYYY</option>
                        <option value="mm/dd/yyyy" {{ ($appearance['date_format'] ?? 'dd/mm/yyyy') == 'mm/dd/yyyy' ? 'selected' : '' }}>MM/DD/YYYY</option>
                        <option value="yyyy-mm-dd" {{ ($appearance['date_format'] ?? 'dd/mm/yyyy') == 'yyyy-mm-dd' ? 'selected' : '' }}>YYYY-MM-DD</option>
                    </select>
                </div>
            </form>
        </div>

        <!-- Sécurité -->
        <div class="sp-section">
            <p class="sp-section-title">Sécurité</p>
            <p class="sp-section-sub">Protégez votre compte et vos données</p>

            <div class="sp-row">
                <div class="sp-row-left">
                    <p class="sp-row-label">Mot de passe</p>
                    <p class="sp-row-desc">Dernière modification il y a {{ $security['last_password_change_days'] ?? '3' }} mois</p>
                </div>
                <button class="sp-row-action" onclick="document.getElementById('password-modal').style.display='flex'">Changer le mot de passe</button>
            </div>

            <div class="sp-row">
                <div class="sp-row-left">
                    <p class="sp-row-label">Authentification à deux facteurs</p>
                    <p class="sp-row-desc">Sécurisez davantage votre compte</p>
                </div>
                @if($security['two_factor_enabled'] ?? false)
                    <form method="POST" action="{{ route('co-owner.settings.2fa.disable') }}">
                        @csrf
                        @method('POST')
                        <button type="submit" class="sp-row-action red">Désactiver</button>
                    </form>
                @else
                    <form method="POST" action="{{ route('co-owner.settings.2fa.enable') }}">
                        @csrf
                        @method('POST')
                        <button type="submit" class="sp-row-action">Activer</button>
                    </form>
                @endif
            </div>

            <div class="sp-row">
                <div class="sp-row-left">
                    <p class="sp-row-label">Sessions actives</p>
                    <p class="sp-row-desc">Gérer les appareils connectés</p>
                </div>
                <button class="sp-row-action" onclick="showSessions()">Voir les sessions</button>
            </div>

            <div class="sp-info-banner">
                Nous recommandons d'activer l'authentification à deux facteurs pour une sécurité optimale de vos informations.
            </div>
        </div>

        <!-- Paramètres avancés -->
        <div class="sp-section">
            <p class="sp-section-title">Paramètres avancés</p>
            <p class="sp-section-sub">Options de configuration avancées</p>

            <form method="POST" action="{{ route('co-owner.settings.advanced.update') }}">
                @csrf
                @method('PUT')

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Exporter les données</p>
                        <p class="sp-row-desc">Téléchargez vos données au format CSV</p>
                    </div>
                    <a href="{{ route('co-owner.settings.export-data') }}" class="sp-row-action">Exporter</a>
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Sauvegarde automatique</p>
                        <p class="sp-row-desc">Sauvegarder automatiquement mes données</p>
                    </div>
                    <div class="toggle-switch {{ ($advanced['auto_backup'] ?? true) ? 'active' : '' }}" onclick="toggleAdvancedSwitch(this, 'auto_backup')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="auto_backup" id="auto_backup" value="{{ ($advanced['auto_backup'] ?? true) ? '1' : '0' }}">
                </div>

                <div class="sp-row">
                    <div class="sp-row-left">
                        <p class="sp-row-label">Mode classique</p>
                        <p class="sp-row-desc">Activer les fonctionnalités en développement</p>
                    </div>
                    <div class="toggle-switch {{ ($advanced['classic_mode'] ?? false) ? 'active' : '' }}" onclick="toggleAdvancedSwitch(this, 'classic_mode')">
                        <div class="toggle-knob"></div>
                    </div>
                    <input type="hidden" name="classic_mode" id="classic_mode" value="{{ ($advanced['classic_mode'] ?? false) ? '1' : '0' }}">
                </div>
            </form>
        </div>

        <!-- Zone de danger -->
        <div class="sp-danger">
            <p class="sp-danger-title">Zone de danger</p>
            <p class="sp-danger-sub">Ces actions sont irréversibles. Assurez-vous de bien comprendre les conséquences avant de les exécuter.</p>

            <div class="sp-row">
                <div class="sp-row-left">
                    <p class="sp-row-label">Désactiver le compte</p>
                    <p class="sp-row-desc">Désactiver temporairement votre compte</p>
                </div>
                <button class="sp-btn-outline-danger" onclick="confirmDeactivate()">Désactiver</button>
            </div>

            <div class="sp-row">
                <div class="sp-row-left">
                    <p class="sp-row-label">Supprimer le compte</p>
                    <p class="sp-row-desc">Supprimer définitivement votre compte et toutes vos données</p>
                </div>
                <button class="sp-btn-danger" onclick="confirmDelete()">Supprimer le compte</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal changement de mot de passe -->
<div id="password-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000;">
    <div style="background: white; border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%;">
        <h3 style="font-family: 'Merriweather', serif; font-size: 1.4rem; margin: 0 0 1rem 0;">Changer le mot de passe</h3>
        <form method="POST" action="{{ route('co-owner.settings.password.update') }}">
            @csrf
            @method('PUT')
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Mot de passe actuel</label>
                <input type="password" name="current_password" required style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Nouveau mot de passe</label>
                <input type="password" name="new_password" required style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
            </div>
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Confirmer le nouveau mot de passe</label>
                <input type="password" name="new_password_confirmation" required style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button type="button" onclick="document.getElementById('password-modal').style.display='none'" style="padding: 0.6rem 1.2rem; border: 1.5px solid #e5e7eb; background: white; border-radius: 12px; cursor: pointer;">Annuler</button>
                <button type="submit" style="padding: 0.6rem 1.2rem; background: #83C757; color: white; border: none; border-radius: 12px; cursor: pointer;">Changer</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal ajout méthode de paiement -->
<div id="payment-method-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000;">
    <div style="background: white; border-radius: 20px; padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h3 style="font-family: 'Merriweather', serif; font-size: 1.4rem; margin: 0 0 1rem 0;">Ajouter une méthode de paiement</h3>
        <form method="POST" action="{{ route('co-owner.settings.payment-method.add') }}">
            @csrf
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Type</label>
                <select name="type" class="sp-select" style="width: 100%;" onchange="togglePaymentFields(this.value)">
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Carte bancaire</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="cash">Espèces</option>
                </select>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Nom du bénéficiaire</label>
                <input type="text" name="beneficiary_name" required style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
            </div>
            <div id="mobile-money-fields" style="display: block;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Opérateur</label>
                    <select name="mobile_operator" class="sp-select" style="width: 100%;">
                        <option value="MTN">MTN</option>
                        <option value="MOOV">MOOV</option>
                        <option value="CELTIS">CELTIS</option>
                        <option value="ORANGE">ORANGE</option>
                        <option value="WAVE">WAVE</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Numéro de téléphone</label>
                    <input type="tel" name="mobile_number" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
                </div>
            </div>
            <div id="card-fields" style="display: none;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Marque de la carte</label>
                    <select name="card_brand" class="sp-select" style="width: 100%;">
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="American Express">American Express</option>
                    </select>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">4 derniers chiffres</label>
                    <input type="text" name="card_last4" maxlength="4" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
                </div>
            </div>
            <div id="bank-fields" style="display: none;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Nom de la banque</label>
                    <input type="text" name="bank_name" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">Numéro de compte</label>
                    <input type="text" name="bank_account_number" style="width: 100%; padding: 0.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px;">
                </div>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">
                    <input type="checkbox" name="is_default" value="1"> Définir comme méthode par défaut
                </label>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button type="button" onclick="document.getElementById('payment-method-modal').style.display='none'" style="padding: 0.6rem 1.2rem; border: 1.5px solid #e5e7eb; background: white; border-radius: 12px; cursor: pointer;">Annuler</button>
                <button type="submit" style="padding: 0.6rem 1.2rem; background: #83C757; color: white; border: none; border-radius: 12px; cursor: pointer;">Ajouter</button>
            </div>
        </form>
    </div>
</div>

<script>
    function toggleSwitch(element, fieldName) {
        element.classList.toggle('active');
        const hiddenInput = document.getElementById(fieldName);
        hiddenInput.value = element.classList.contains('active') ? '1' : '0';
        document.getElementById('notifications-form').submit();
    }

    function toggleAdvancedSwitch(element, fieldName) {
        element.classList.toggle('active');
        const hiddenInput = document.getElementById(fieldName);
        hiddenInput.value = element.classList.contains('active') ? '1' : '0';
        element.closest('form').submit();
    }

    function togglePaymentFields(type) {
        document.getElementById('mobile-money-fields').style.display = type === 'mobile_money' ? 'block' : 'none';
        document.getElementById('card-fields').style.display = type === 'card' ? 'block' : 'none';
        document.getElementById('bank-fields').style.display = type === 'bank_transfer' ? 'block' : 'none';
    }

    function showSessions() {
        alert('Liste des sessions actives à venir');
    }

    function confirmDeactivate() {
        const password = prompt('Pour désactiver votre compte, veuillez entrer votre mot de passe:');
        if (password) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = "{{ route('co-owner.settings.deactivate') }}";
            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = '_token';
            csrf.value = '{{ csrf_token() }}';
            const passwordInput = document.createElement('input');
            passwordInput.type = 'hidden';
            passwordInput.name = 'password';
            passwordInput.value = password;
            form.appendChild(csrf);
            form.appendChild(passwordInput);
            document.body.appendChild(form);
            form.submit();
        }
    }

    function confirmDelete() {
        const confirmText = prompt('ATTENTION : Cette action est irréversible. Pour confirmer, tapez "SUPPRIMER"');
        if (confirmText === 'SUPPRIMER') {
            const password = prompt('Veuillez entrer votre mot de passe pour confirmer:');
            if (password) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = "{{ route('co-owner.settings.delete') }}";
                const csrf = document.createElement('input');
                csrf.type = 'hidden';
                csrf.name = '_token';
                csrf.value = '{{ csrf_token() }}';
                const method = document.createElement('input');
                method.type = 'hidden';
                method.name = '_method';
                method.value = 'DELETE';
                const passwordInput = document.createElement('input');
                passwordInput.type = 'hidden';
                passwordInput.name = 'password';
                passwordInput.value = password;
                const confirmationInput = document.createElement('input');
                confirmationInput.type = 'hidden';
                confirmationInput.name = 'confirmation';
                confirmationInput.value = 'SUPPRIMER';
                form.appendChild(csrf);
                form.appendChild(method);
                form.appendChild(passwordInput);
                form.appendChild(confirmationInput);
                document.body.appendChild(form);
                form.submit();
            }
        }
    }

    // Appliquer le thème sombre/clair dynamiquement
    document.addEventListener('DOMContentLoaded', function() {
        const themeSelect = document.querySelector('select[name="theme"]');
        if (themeSelect) {
            const isDark = themeSelect.value === 'dark';
            if (isDark) {
                document.querySelector('.sp-page').classList.add('dark-mode');
            }
        }
    });
</script>
@endsection
