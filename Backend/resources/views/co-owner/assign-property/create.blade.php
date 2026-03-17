@extends('layouts.co-owner')

@section('title', 'Nouveau contrat de location')

@section('content')
<style>
    /* Import des polices */
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;800;900&family=Manrope:wght@400;500;600&display=swap');

    /* Styles généraux */
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .create-container {
        max-width: 1300px;
        margin: 0 auto;
        padding: 2rem;
        background: #ffffff;
        min-height: 100vh;
        font-family: 'Manrope', sans-serif;
    }

    /* ===== HEADER ===== */
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5rem;
        padding: 0 0.5rem;
    }

    .header-left {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .btn-back {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 22px;
        background: white;
        border: 2px solid #d1d5db;
        border-radius: 10px;
        color: #374151;
        font-size: 0.95rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.15s ease;
        font-family: 'Manrope', sans-serif;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        width: fit-content;
    }

    .btn-back:hover {
        background: #ffffff;
        border-color: #9ca3af;
        color: #111827;
        transform: translateX(-2px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    }

    .btn-back svg {
        transition: transform 0.2s ease;
    }

    .btn-back:hover svg {
        transform: translateX(-2px);
    }

    .page-title {
        font-family: 'Merriweather', serif;
        font-size: 2.2rem;
        font-weight: 800;
        color: #111827;
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
    }

    .page-subtitle {
        color: #6b7280;
        font-size: 1.1rem;
        font-weight: 400;
        font-family: 'Manrope', sans-serif;
    }

    .header-actions {
        display: flex;
        gap: 15px;
    }

    .btn-cancel {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: 2px solid #fca5a5;
        background: white;
        color: #dc2626;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Manrope', sans-serif;
        position: relative;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(220,38,38,0.1);
        text-decoration: none;
    }

    .btn-cancel::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(220, 38, 38, 0.1);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
    }

    .btn-cancel:hover::before {
        width: 300px;
        height: 300px;
    }

    .btn-cancel:hover {
        background: #fef2f2;
        border-color: #ef4444;
        color: #b91c1c;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(220,38,38,0.15);
    }

    .btn-cancel:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(220,38,38,0.1);
    }

    .btn-cancel svg, .btn-cancel span {
        position: relative;
        z-index: 1;
    }

    .btn-submit {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 26px;
        border: none;
        background: #16a34a;
        color: white;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Manrope', sans-serif;
        box-shadow: 0 4px 6px rgba(22,163,74,0.25), 0 1px 3px rgba(0,0,0,0.08);
        position: relative;
        overflow: hidden;
        text-decoration: none;
    }

    .btn-submit::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        transition: left 0.5s;
    }

    .btn-submit:hover::before {
        left: 100%;
    }

    .btn-submit:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(22,163,74,0.35), 0 3px 6px rgba(0,0,0,0.1);
    }

    .btn-submit:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(22,163,74,0.25);
    }

    .btn-submit svg {
        transition: transform 0.3s ease;
        position: relative;
        z-index: 1;
    }

    .btn-submit:hover svg {
        transform: scale(1.1);
    }

    .btn-submit span {
        position: relative;
        z-index: 1;
    }

    .btn-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* ===== CARD PRINCIPALE ===== */
    .form-card {
        background: white;
        border-radius: 20px;
        border: 2px solid #e5e7eb;
        padding: 40px;
        margin: 0 0 32px 0;
        box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    }

    .card-title {
        font-family: 'Merriweather', serif;
        font-size: 1.3rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 32px;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    /* ===== GRID ===== */
    .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px 40px;
        margin-bottom: 32px;
    }

    .grid-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 32px 40px;
        margin-bottom: 32px;
    }

    .full-width {
        grid-column: 1 / -1;
    }

    /* ===== CHAMPS ===== */
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: #374151;
        font-family: 'Manrope', sans-serif;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .required-star {
        color: #dc2626;
        margin-left: 2px;
    }

    .form-control {
        width: 100%;
        padding: 0.85rem 1rem;
        border: 2px solid #d1d5db;
        border-radius: 10px;
        font-size: 0.95rem;
        font-family: 'Manrope', sans-serif;
        font-weight: 500;
        color: #111827;
        background: white;
        transition: all 0.15s ease;
        outline: none;
        box-sizing: border-box;
    }

    .form-control:hover {
        border-color: #9ca3af;
    }

    .form-control:focus {
        border-color: #16a34a;
        box-shadow: 0 0 0 4px rgba(22,163,74,0.12);
    }

    select.form-control {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 2.8rem;
        cursor: pointer;
    }

    textarea.form-control {
        min-height: 120px;
        resize: vertical;
    }

    input[type=number].form-control {
        -moz-appearance: textfield;
    }
    input[type=number].form-control::-webkit-outer-spin-button,
    input[type=number].form-control::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .form-control[readonly] {
        background: #f9fafb;
        cursor: not-allowed;
    }

    .form-help {
        font-size: 0.82rem;
        color: #9ca3af;
        font-weight: 500;
        font-style: italic;
        margin-top: 6px;
        font-family: 'Manrope', sans-serif;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .form-error {
        font-size: 0.85rem;
        font-weight: 600;
        color: #dc2626;
        margin-top: 6px;
        font-family: 'Manrope', sans-serif;
    }

    .form-error i {
        width: 14px;
        height: 14px;
        display: inline-block;
        margin-right: 4px;
    }

    /* ===== RADIO ET CHECKBOX ===== */
    .radio-group {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-top: 6px;
        flex-wrap: wrap;
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        color: #374151;
        cursor: pointer;
        font-weight: 500;
        font-family: 'Manrope', sans-serif;
    }

    .radio-label input[type="radio"] {
        width: 18px;
        height: 18px;
        accent-color: #16a34a;
        cursor: pointer;
    }

    .radio-label input[type="radio"]:checked {
        background-color: #16a34a;
    }

    .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
    }

    .checkbox-label {
        font-size: 0.85rem;
        color: #6b7280;
        cursor: pointer;
        font-family: 'Manrope', sans-serif;
    }

    .checkbox-label input[type="checkbox"] {
        width: 16px;
        height: 16px;
        accent-color: #16a34a;
        margin-right: 6px;
    }

    /* ===== BOUTONS BAS ===== */
    .bottom-actions {
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 2px solid #f3f4f6;
    }

    /* ===== ALERTES ===== */
    .alert {
        display: flex;
        gap: 15px;
        align-items: flex-start;
        padding: 1.2rem 1.5rem;
        border-radius: 14px;
        margin-bottom: 2rem;
    }

    .alert-success {
        background: #d1fae5;
        border: 1px solid #10b981;
        color: #065f46;
    }

    .alert-success strong {
        color: #065f46;
        font-weight: 600;
        display: block;
        margin-bottom: 4px;
        font-size: 1rem;
    }

    .alert-success p {
        color: #047857;
        margin: 0;
        font-size: 0.95rem;
    }

    .alert-error {
        background: #fee2e2;
        border: 1px solid #ef4444;
        color: #991b1b;
    }

    .alert-error strong {
        color: #991b1b;
        font-weight: 600;
        display: block;
        margin-bottom: 4px;
        font-size: 1rem;
    }

    .alert-error p {
        color: #b91c1c;
        margin: 0;
        font-size: 0.95rem;
    }

    .alert ul {
        margin: 0;
        padding-left: 20px;
        color: #b91c1c;
        font-size: 0.95rem;
    }

    /* ===== EMPTY STATES ===== */
    .empty-state {
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 10px;
        padding: 1.2rem;
        text-align: center;
    }

    .empty-state p {
        color: #92400e;
        margin: 0 0 8px 0;
        font-size: 1rem;
    }

    .empty-state-link {
        display: inline-block;
        padding: 8px 14px;
        background: #10b981;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.9rem;
    }

    .empty-state-link:hover {
        background: #059669;
    }

    /* ===== ANIMATIONS ===== */
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .btn-submit.loading {
        pointer-events: none;
        opacity: 0.7;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 768px) {
        .create-container {
            padding: 1.5rem;
        }

        .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
        }

        .header-actions {
            width: 100%;
        }

        .btn-cancel,
        .btn-submit {
            flex: 1;
            justify-content: center;
        }

        .grid-2,
        .grid-3 {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .form-card {
            padding: 2rem;
        }

        .bottom-actions {
            flex-direction: column;
        }

        .bottom-actions .btn-cancel,
        .bottom-actions .btn-submit {
            width: 100%;
            justify-content: center;
        }
    }
</style>

<div class="create-container">
    <!-- Header avec bouton retour et actions -->
    <div class="page-header">
        <div class="header-left">
            <a href="{{ route('co-owner.tenants.index') }}" class="btn-back">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>← Retour au tableau de bord</span>
            </a>
            
            <h1 class="page-title">Nouveau contrat de location</h1>
            <p class="page-subtitle">Créez un nouveau contrat entre un bien et un locataire</p>
        </div>
        <div class="header-actions">
            <button type="button" class="btn-cancel" onclick="if(confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) { window.location.href='{{ route('co-owner.assign-property.create') }}'; }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                <span>Annuler</span>
            </button>
            <button type="submit" form="lease-form" class="btn-submit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Créer le contrat</span>
            </button>
        </div>
    </div>

    <!-- Messages d'alerte -->
    @if (session('success'))
        <div class="alert alert-success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <div>
                <strong>Succès !</strong>
                <p>{{ session('success') }}</p>
            </div>
        </div>
    @endif

    @if (session('error'))
        <div class="alert alert-error">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
            </svg>
            <div>
                <strong>Erreur</strong>
                <p>{{ session('error') }}</p>
            </div>
        </div>
    @endif

    @if ($errors->any())
        <div class="alert alert-error">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
            </svg>
            <div>
                <strong>Erreurs de validation</strong>
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        </div>
    @endif

    <!-- Formulaire -->
    <form method="POST" action="{{ route('co-owner.assign-property.store') }}" id="lease-form">
        @csrf

        <!-- Carte principale -->
        <div class="form-card">
            <div class="card-title">
                <span>🏠</span> Informations de location
            </div>

            <div class="grid-2">
                <!-- Bien à louer -->
                <div class="form-group">
                    <label class="form-label">
                        Bien à louer <span class="required-star">*</span>
                    </label>
                    @if ($delegatedProperties->isEmpty())
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.5">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                            <p>Aucun bien disponible</p>
                        </div>
                    @else
                        <select name="property_id" id="property_id" required class="form-control @error('property_id') error @enderror">
                            <option value="">Sélectionner un bien</option>
                            @foreach ($delegatedProperties as $property)
                                <option value="{{ $property->id }}"
                                        data-rent="{{ $property->rent_amount ?? 0 }}"
                                        data-charges="{{ $property->charges_amount ?? 0 }}"
                                        data-guarantee="{{ $property->caution ?? 0 }}"
                                        {{ old('property_id') == $property->id ? 'selected' : '' }}>
                                    {{ $property->name ?? 'Sans nom' }} - {{ $property->address ?? 'Sans adresse' }}
                                    @if ($property->city) - {{ $property->city }} @endif
                                </option>
                            @endforeach
                        </select>
                    @endif
                    @error('property_id')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>

                <!-- Locataire -->
                <div class="form-group">
                    <label class="form-label">
                        Locataire <span class="required-star">*</span>
                    </label>
                    @if ($tenants->isEmpty())
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <p>Aucun locataire disponible</p>
                            <a href="{{ route('co-owner.tenants.create') }}" class="empty-state-link">
                                Créer un locataire
                            </a>
                        </div>
                    @else
                        <select name="tenant_id" required class="form-control @error('tenant_id') error @enderror">
                            <option value="">Sélectionner un locataire</option>
                            @foreach ($tenants as $tenant)
                                <option value="{{ $tenant->id }}" {{ old('tenant_id') == $tenant->id ? 'selected' : '' }}>
                                    {{ $tenant->first_name }} {{ $tenant->last_name }}
                                    @if ($tenant->user && $tenant->user->email) ({{ $tenant->user->email }}) @endif
                                </option>
                            @endforeach
                        </select>
                    @endif
                    @error('tenant_id')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>
            </div>

            <div class="grid-2">
                <!-- Type de bail -->
                <div class="form-group">
                    <label class="form-label">
                        Type de bail <span class="required-star">*</span>
                    </label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="lease_type" value="nu"
                                   {{ old('lease_type', 'nu') == 'nu' ? 'checked' : '' }}>
                            Bail nu
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="lease_type" value="meuble"
                                   {{ old('lease_type') == 'meuble' ? 'checked' : '' }}>
                            Bail meublé
                        </label>
                    </div>
                </div>

                <!-- Statut du bail -->
                <div class="form-group">
                    <label class="form-label">
                        Statut du bail <span class="required-star">*</span>
                    </label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="lease_status" value="active"
                                   {{ old('lease_status', 'active') == 'active' ? 'checked' : '' }}
                                   style="accent-color: #22c55e;">
                            Actif
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="lease_status" value="pending_signature"
                                   {{ old('lease_status') == 'pending_signature' ? 'checked' : '' }}
                                   style="accent-color: #94a3b8;">
                            En attente
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="lease_status" value="terminated"
                                   {{ old('lease_status') == 'terminated' ? 'checked' : '' }}
                                   style="accent-color: #f97316;">
                            Résilié
                        </label>
                    </div>
                </div>
            </div>

            <div class="grid-2">
                <!-- Loyer mensuel -->
                <div class="form-group">
                    <label class="form-label">
                        Loyer mensuel (FCFA) <span class="required-star">*</span>
                    </label>
                    <input type="number" name="rent_amount" id="rent_amount" required min="1" step="0.01"
                           value="{{ old('rent_amount') }}" placeholder="40.000"
                           class="form-control @error('rent_amount') error @enderror">
                    @error('rent_amount')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>

                <!-- Charges (optionnel) -->
                <div class="form-group">
                    <label class="form-label">
                        Charges mensuelles (FCFA)
                    </label>
                    <input type="number" name="charges_amount" id="charges_amount" min="0" step="0.01"
                           value="{{ old('charges_amount', 0) }}" placeholder="5.000"
                           class="form-control @error('charges_amount') error @enderror">
                    @error('charges_amount')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>
            </div>

            <div class="grid-2">
                <!-- Dépôt de garantie -->
                <div class="form-group">
                    <label class="form-label">
                        Dépôt de garantie (FCFA)
                    </label>
                    <input type="number" name="guarantee_amount" id="guarantee_amount" min="0" step="0.01"
                           value="{{ old('guarantee_amount') }}" placeholder="20.000"
                           class="form-control @error('guarantee_amount') error @enderror">
                    @error('guarantee_amount')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>

                <!-- Date de début du bail -->
                <div class="form-group">
                    <label class="form-label">
                        Date de début du bail <span class="required-star">*</span>
                    </label>
                    <input type="date" name="start_date" id="start_date" required
                           value="{{ old('start_date', date('Y-m-d')) }}"
                           min="{{ date('Y-m-d') }}"
                           class="form-control @error('start_date') error @enderror">
                    @error('start_date')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>
            </div>

            <div class="grid-2">
                <!-- Durée du bail en mois -->
                <div class="form-group">
                    <label class="form-label">
                        Durée du bail (en mois) <span class="required-star">*</span>
                    </label>
                    <input type="number" name="duration_months" id="duration_months" required min="1" max="120" step="1"
                           value="{{ old('duration_months', 12) }}" placeholder="12"
                           class="form-control @error('duration_months') error @enderror">
                    <div class="form-help">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Renouvellement par tacite reconduction
                    </div>
                    @error('duration_months')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>

                <!-- Date de fin calculée -->
                <div class="form-group">
                    <label class="form-label">
                        Date de fin estimée
                    </label>
                    <input type="text" id="end_date_display" readonly
                           value="{{ old('end_date') ? \Carbon\Carbon::parse(old('end_date'))->format('d/m/Y') : '' }}"
                           placeholder="Sélectionnez une durée"
                           class="form-control">
                    <input type="hidden" name="end_date" id="end_date" value="{{ old('end_date') }}">
                </div>
            </div>

            <div class="grid-2">
                <!-- Jour de paiement -->
                <div class="form-group">
                    <label class="form-label">
                        Jour de paiement <span class="required-star">*</span>
                    </label>
                    <select name="billing_day" required class="form-control @error('billing_day') error @enderror">
                        <option value="">Sélectionner</option>
                        @for ($i = 1; $i <= 28; $i++)
                            <option value="{{ $i }}" {{ old('billing_day', 5) == $i ? 'selected' : '' }}>{{ $i }}</option>
                        @endfor
                    </select>
                    @error('billing_day')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>

                <!-- Périodicité -->
                <div class="form-group">
                    <label class="form-label">
                        Périodicité <span class="required-star">*</span>
                    </label>
                    <select name="payment_frequency" required class="form-control @error('payment_frequency') error @enderror">
                        <option value="monthly" {{ old('payment_frequency', 'monthly') == 'monthly' ? 'selected' : '' }}>Mensuel</option>
                        <option value="quarterly" {{ old('payment_frequency') == 'quarterly' ? 'selected' : '' }}>Trimestriel</option>
                        <option value="annually" {{ old('payment_frequency') == 'annually' ? 'selected' : '' }}>Annuel</option>
                    </select>
                    @error('payment_frequency')
                        <div class="form-error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 8v4M12 16h.01"/>
                            </svg>
                            {{ $message }}
                        </div>
                    @enderror
                </div>
            </div>

            <!-- Mode de paiement -->
            <div class="form-group full-width" style="margin-top: 32px;">
                <label class="form-label">
                    Mode de paiement
                </label>
                <select name="payment_mode" class="form-control @error('payment_mode') error @enderror">
                    <option value="Espèce" {{ old('payment_mode', 'Espèce') == 'Espèce' ? 'selected' : '' }}>Espèce</option>
                    <option value="Virement" {{ old('payment_mode') == 'Virement' ? 'selected' : '' }}>Virement</option>
                    <option value="Chèque" {{ old('payment_mode') == 'Chèque' ? 'selected' : '' }}>Chèque</option>
                    <option value="Mobile Money" {{ old('payment_mode') == 'Mobile Money' ? 'selected' : '' }}>Mobile Money</option>
                </select>
                @error('payment_mode')
                    <div class="form-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {{ $message }}
                    </div>
                @enderror
            </div>

            <!-- Conditions particulières -->
            <div class="form-group full-width" style="margin-top: 32px;">
                <label class="form-label">
                    Détails / conditions particulières
                </label>
                <textarea name="special_conditions" rows="4"
                          placeholder="Ex: Charges comprises, interdictions de fumer etc."
                          class="form-control @error('special_conditions') error @enderror">{{ old('special_conditions') }}</textarea>
                <div class="form-help">
                    Ces informations seront ajoutées aux conditions générales du bail
                </div>
                @error('special_conditions')
                    <div class="form-error">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 8v4M12 16h.01"/>
                        </svg>
                        {{ $message }}
                    </div>
                @enderror
            </div>

            <!-- Boutons en bas -->
            <div class="bottom-actions">
                <button type="button" class="btn-cancel" onclick="if(confirm('Voulez-vous vraiment annuler ? Les modifications seront perdues.')) { window.location.href='{{ route('co-owner.assign-property.create') }}'; }">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>Annuler</span>
                </button>
                <button type="submit" class="btn-submit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Créer le contrat</span>
                </button>
            </div>
        </div>
    </form>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Éléments du formulaire
    const propertySelect = document.getElementById('property_id');
    const rentInput = document.getElementById('rent_amount');
    const chargesInput = document.getElementById('charges_amount');
    const guaranteeInput = document.getElementById('guarantee_amount');
    const startDateInput = document.getElementById('start_date');
    const durationMonthsInput = document.getElementById('duration_months');
    const endDateInput = document.getElementById('end_date');
    const endDateDisplay = document.getElementById('end_date_display');

    // Fonction pour mettre à jour les informations du bien sélectionné
    function updatePropertyInfo() {
        if (propertySelect && propertySelect.value) {
            const selectedOption = propertySelect.options[propertySelect.selectedIndex];
            const rent = parseFloat(selectedOption.dataset.rent) || 0;
            const charges = parseFloat(selectedOption.dataset.charges) || 0;
            const guarantee = parseFloat(selectedOption.dataset.guarantee) || 0;

            // Mettre à jour les champs
            if (rentInput) rentInput.value = rent;
            if (chargesInput) chargesInput.value = charges;
            if (guaranteeInput) guaranteeInput.value = guarantee;
        }
    }

    // Fonction pour calculer la date de fin
    function calculateEndDate() {
        if (startDateInput && startDateInput.value && durationMonthsInput && durationMonthsInput.value) {
            const startDate = new Date(startDateInput.value);
            const months = parseInt(durationMonthsInput.value) || 0;

            if (months > 0) {
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + months);

                // Format pour l'affichage
                const day = String(endDate.getDate()).padStart(2, '0');
                const month = String(endDate.getMonth() + 1).padStart(2, '0');
                const year = endDate.getFullYear();

                endDateDisplay.value = `${day}/${month}/${year}`;
                endDateInput.value = `${year}-${month}-${day}`;
            }
        }
    }

    // Événement de changement de bien
    if (propertySelect) {
        propertySelect.addEventListener('change', updatePropertyInfo);
        // Appeler une première fois si une valeur est déjà sélectionnée
        if (propertySelect.value) {
            updatePropertyInfo();
        }
    }

    // Événements pour le calcul de la date de fin
    if (startDateInput) {
        startDateInput.addEventListener('change', calculateEndDate);
    }

    if (durationMonthsInput) {
        durationMonthsInput.addEventListener('input', calculateEndDate);
    }

    // Appeler une première fois si des valeurs existent
    calculateEndDate();

    // Effet de chargement sur les boutons submit
    const form = document.getElementById('lease-form');
    const submitButtons = document.querySelectorAll('.btn-submit');

    if (form) {
        form.addEventListener('submit', function(e) {
            // Vérifier que le formulaire est valide
            if (form.checkValidity()) {
                submitButtons.forEach(btn => {
                    btn.classList.add('loading');
                    btn.disabled = true;

                    // Remplacer par un spinner
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" fill="none"></circle>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-opacity="1" fill="none"></path>
                        </svg>
                        <span>Création en cours...</span>
                    `;
                });
            }
        });
    }

    // Focus sur le premier champ en erreur
    const firstError = document.querySelector('.error');
    if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Scroll vers le message de succès si présent
    const successMessage = document.querySelector('.alert-success');
    if (successMessage) {
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Animation d'apparition
        successMessage.style.opacity = '0';
        successMessage.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            successMessage.style.transition = 'all 0.4s ease';
            successMessage.style.opacity = '1';
            successMessage.style.transform = 'translateY(0)';
        }, 100);
    }
});
</script>
@endpush
@endsection
