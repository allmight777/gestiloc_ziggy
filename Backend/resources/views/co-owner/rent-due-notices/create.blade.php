@extends('layouts.co-owner')

@section('title', 'Nouvel avis d\'échéance')

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
        background: #7FBF55;
        color: white;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Manrope', sans-serif;
        box-shadow: 0 4px 6px rgba(127, 191, 85, 0.25), 0 1px 3px rgba(0,0,0,0.08);
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
        background: #6aa548;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(127, 191, 85, 0.35), 0 3px 6px rgba(0,0,0,0.1);
    }

    .btn-submit:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(127, 191, 85, 0.25);
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
        border-color: #7FBF55;
        box-shadow: 0 0 0 4px rgba(127, 191, 85, 0.12);
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
        accent-color: #7FBF55;
        cursor: pointer;
    }

    .checkbox-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 8px;
        margin-bottom: 16px;
    }

    .checkbox-label {
        font-size: 0.9rem;
        color: #374151;
        cursor: pointer;
        font-family: 'Manrope', sans-serif;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #7FBF55;
        cursor: pointer;
    }

    /* ===== INFO CARD ===== */
    .info-card {
        background: #f9fafb;
        border-radius: 12px;
        padding: 1.2rem;
        border: 1px solid #e5e7eb;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
    }

    .info-card h4 {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .info-card p {
        margin-bottom: 0.6rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .info-card .total-amount {
        font-size: 1.1rem;
        font-weight: 700;
        color: #7FBF55;
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

        .grid-2 {
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
    <!-- Header -->
    <div class="page-header">
        <div class="header-left">
            <h1 class="page-title">Nouvel avis d'échéance</h1>
            <p class="page-subtitle">Créez un nouvel avis d'échéance pour un locataire</p>
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
                <ul style="margin-top: 0.5rem; padding-left: 1rem;">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        </div>
    @endif

    <!-- Formulaire -->
    <form method="POST" action="{{ route('co-owner.rent-due-notices.store') }}" id="notice-form">
        @csrf

        <div class="form-card">
            <div class="card-title">
                <span>📋</span>
                Informations de l'avis d'échéance
            </div>

            <!-- Première ligne: Sélection du bail (gauche) + Type de facture (droite) -->
            <div class="grid-2">
                <!-- Sélection du bail -->
                <div class="form-group">
                    <label class="form-label">
                        Bail / Location <span class="required-star">*</span>
                    </label>
                    <select name="lease_id" id="lease_id" class="form-control" required>
                        <option value="">Sélectionner un bail</option>
                        @foreach($leases as $lease)
                            <option value="{{ $lease->id }}"
                                data-rent="{{ $lease->rent_amount }}"
                                data-charges="{{ $lease->charges_amount }}"
                                data-total="{{ ($lease->rent_amount + ($lease->charges_amount ?? 0)) }}"
                                data-tenant="{{ $lease->tenant->first_name }} {{ $lease->tenant->last_name }}"
                                data-property="{{ $lease->property->name }}"
                                {{ old('lease_id') == $lease->id ? 'selected' : '' }}>
                                {{ $lease->property->name }} - {{ $lease->tenant->first_name }} {{ $lease->tenant->last_name }}
                            </option>
                        @endforeach
                    </select>
                    @error('lease_id')
                        <div class="form-help" style="color: #dc2626;">{{ $message }}</div>
                    @enderror
                </div>

                <!-- Type de facture -->
                <div class="form-group">
                    <label class="form-label">Type de facture</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="type" value="rent" checked onchange="updateAmountAndInfo()">
                            Loyer
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="type" value="charges" onchange="updateAmountAndInfo()">
                            Charges
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="type" value="deposit" onchange="updateAmountAndInfo()">
                            Dépôt de garantie
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="type" value="repair" onchange="updateAmountAndInfo()">
                            Réparation
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="type" value="other" onchange="updateAmountAndInfo()">
                            Autre
                        </label>
                    </div>
                </div>
            </div>

            <!-- Deuxième ligne: Carte info bail (pleine largeur) -->
            <div class="full-width" style="margin-bottom: 32px;">
                <div class="info-card" id="lease-info-card" style="display: none;">
                    <h4>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7FBF55" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Informations du bail
                    </h4>
                    <p><strong>Bien :</strong> <span id="info-property">-</span></p>
                    <p><strong>Locataire :</strong> <span id="info-tenant">-</span></p>
                    <p><strong>Loyer mensuel :</strong> <span id="info-rent">-</span> FCFA</p>
                    <p><strong>Charges mensuelles :</strong> <span id="info-charges">-</span> FCFA</p>
                    <p><strong>Total mensuel :</strong> <span id="info-total" class="total-amount">-</span> FCFA</p>
                </div>
            </div>

            <!-- Troisième ligne: Période début et Période fin -->
            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">Période - Début</label>
                    <input type="date" name="period_start" class="form-control" value="{{ old('period_start') }}">
                </div>

                <div class="form-group">
                    <label class="form-label">Période - Fin</label>
                    <input type="date" name="period_end" class="form-control" value="{{ old('period_end') }}">
                </div>
            </div>

            <!-- Quatrième ligne: Date d'échéance -->
            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">
                        Date d'échéance <span class="required-star">*</span>
                    </label>
                    <input type="date" name="due_date" id="due_date" class="form-control"
                           value="{{ old('due_date', date('Y-m-d', strtotime('+10 days'))) }}" required>
                    @error('due_date')
                        <div class="form-help" style="color: #dc2626;">{{ $message }}</div>
                    @enderror
                    <div class="form-help">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Date limite de paiement
                    </div>
                </div>

                <!-- Champ vide pour garder la grille -->
                <div></div>
            </div>

            <!-- Champ montant caché pour l'envoi (obligatoire pour les autres types) -->
            <input type="hidden" name="amount" id="amount-hidden" value="">

            <!-- Champ montant visible pour les types deposit/repair/other -->
            <div id="amount-field" style="display: none;" class="form-group full-width">
                <label class="form-label">
                    Montant total (FCFA) <span class="required-star">*</span>
                </label>
                <input type="number" name="amount_visible" id="amount_visible" class="form-control" placeholder="Ex: 50000" step="1">
                <div class="form-help">Saisissez le montant pour ce type de facture</div>
            </div>

            <!-- Mode de paiement -->
            <div class="form-group full-width">
                <label class="form-label">Mode de paiement</label>
                <select name="payment_method" class="form-control">
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Espèce">Espèce</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Carte bancaire">Carte bancaire</option>
                </select>
            </div>
            <br>

            <!-- Notes -->
            <div class="form-group full-width">
                <label class="form-label">Notes (optionnel)</label>
                <textarea name="notes" class="form-control" rows="3"
                          placeholder="Informations complémentaires...">{{ old('notes') }}</textarea>
            </div>

            <br>
            <!-- Option email -->
            <div class="full-width">
                <div class="checkbox-row">
                    <label class="checkbox-label">
                        <input type="checkbox" name="send_email" value="1" {{ old('send_email') ? 'checked' : '' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Envoyer automatiquement l'avis d'échéance par email au locataire
                    </label>
                </div>
            </div>

            <!-- Boutons en bas -->
            <div class="bottom-actions">
                <button type="submit" class="btn-submit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Créer l'avis</span>
                </button>
            </div>
        </div>
    </form>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Éléments
        const leaseSelect = document.getElementById('lease_id');
        const leaseInfoCard = document.getElementById('lease-info-card');
        const infoProperty = document.getElementById('info-property');
        const infoTenant = document.getElementById('info-tenant');
        const infoRent = document.getElementById('info-rent');
        const infoCharges = document.getElementById('info-charges');
        const infoTotal = document.getElementById('info-total');
        const amountField = document.getElementById('amount-field');
        const amountVisible = document.getElementById('amount_visible');
        const amountHidden = document.getElementById('amount-hidden');

        function updateLeaseInfo() {
            if (leaseSelect && leaseSelect.value) {
                const selectedOption = leaseSelect.options[leaseSelect.selectedIndex];
                const rent = parseFloat(selectedOption.dataset.rent) || 0;
                const charges = parseFloat(selectedOption.dataset.charges) || 0;
                const total = parseFloat(selectedOption.dataset.total) || 0;
                const property = selectedOption.dataset.property || '-';
                const tenant = selectedOption.dataset.tenant || '-';

                infoProperty.textContent = property;
                infoTenant.textContent = tenant;
                infoRent.textContent = rent.toLocaleString('fr-FR');
                infoCharges.textContent = charges.toLocaleString('fr-FR');
                infoTotal.textContent = total.toLocaleString('fr-FR');
                leaseInfoCard.style.display = 'block';

                // Mettre à jour le montant selon le type
                updateAmountAndInfo();
            } else {
                leaseInfoCard.style.display = 'none';
            }
        }

        function updateAmountAndInfo() {
            if (leaseSelect && leaseSelect.value) {
                const selectedOption = leaseSelect.options[leaseSelect.selectedIndex];
                const rent = parseFloat(selectedOption.dataset.rent) || 0;
                const charges = parseFloat(selectedOption.dataset.charges) || 0;
                const total = parseFloat(selectedOption.dataset.total) || 0;
                const type = document.querySelector('input[name="type"]:checked').value;

                if (type === 'rent') {
                    // Pour le loyer, on utilise le montant du loyer
                    amountHidden.value = rent;
                    amountField.style.display = 'none';
                    amountVisible.value = '';
                    amountVisible.required = false;
                } else if (type === 'charges') {
                    // Pour les charges, on utilise le montant des charges
                    amountHidden.value = charges;
                    amountField.style.display = 'none';
                    amountVisible.value = '';
                    amountVisible.required = false;
                } else {
                    // Pour les autres types, on affiche le champ pour saisir un montant
                    amountField.style.display = 'block';
                    amountHidden.value = '';
                    amountVisible.required = true;
                }
            }
        }

        // Événement de soumission pour s'assurer que le montant visible est bien envoyé
        const form = document.getElementById('notice-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                const type = document.querySelector('input[name="type"]:checked').value;
                if (type !== 'rent' && type !== 'charges') {
                    if (!amountVisible.value || parseFloat(amountVisible.value) <= 0) {
                        e.preventDefault();
                        alert('Veuillez saisir un montant valide');
                        amountVisible.focus();
                        return;
                    }
                    amountHidden.value = amountVisible.value;
                }
            });
        }

        // Écouteurs d'événements
        if (leaseSelect) {
            leaseSelect.addEventListener('change', updateLeaseInfo);
            if (leaseSelect.value) {
                updateLeaseInfo();
            }
        }

        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', updateAmountAndInfo);
        });

        // Initialisation
        updateAmountAndInfo();
    });
</script>
@endsection
