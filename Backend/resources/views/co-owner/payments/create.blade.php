@extends('layouts.co-owner')

@section('title', 'Enregistrer un paiement manuel')

@section('content')
    <div class="content-card">
        <div class="content-body">
            @if ($errors->any())
                <div class="alert-box alert-error">
                    <i data-lucide="alert-circle" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
                    <div>
                        <strong>Erreurs de validation</strong>
                        <ul style="margin-top: 8px; padding-left: 1rem; font-weight: 650; font-size: 1rem;">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            @endif

            <form method="POST" action="{{ route('co-owner.payments.store') }}" class="form-card" id="paymentForm">
                @csrf

                <!-- Informations principales -->
                <div class="form-grid">
                    <!-- Colonne gauche -->
                    <div class="form-column">
                        <!-- Bouton à droite -->
                        <div class="top-actions">
                            <a href="{{ route('co-owner.payments.index') }}" class="button button-secondary"
                                style="display: inline-flex; align-items: center; gap: 8px;">
                                <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i>
                                Retour à la liste
                            </a>
                        </div>
                        <!-- Sélection du bail -->
                        <div class="form-group">
                            <label class="form-label">
                                <i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Bail concerné *
                            </label>
                            <select name="lease_id" id="leaseSelect" class="form-control form-select" required>
                                <option value="">Sélectionnez un bail</option>
                                @foreach ($leases as $lease)
                                    <option value="{{ $lease->id }}"
                                        data-tenant="{{ $lease->tenant->user->name ?? 'N/A' }}"
                                        data-property="{{ $lease->property->name }}" data-rent="{{ $lease->rent_amount }}"
                                        {{ old('lease_id') == $lease->id ? 'selected' : '' }}>
                                        {{ $lease->property->name }} - {{ $lease->tenant->user->name ?? 'Locataire' }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <!-- Montants -->
                        <div class="form-group">
                            <label class="form-label">
                                <i data-lucide="dollar-sign" style="width: 18px; height: 18px;"></i> Montant total (FCFA) *
                            </label>
                            <div class="input-with-icon">
                                <input type="number" name="amount_total" id="amount_total" class="form-control"
                                    min="0.01" step="0.01" value="{{ old('amount_total') }}" required
                                    placeholder="0,00">
                                <span class="input-suffix">FCFA</span>
                            </div>
                        </div>

                        <!-- Calcul automatique -->
                        <div class="amount-grid">
                            <div class="amount-item">
                                <label class="amount-label">Frais (5%)</label>
                                <div class="amount-value">
                                    <input type="text" id="fee_amount" class="form-control" readonly value="0,00">
                                    <span class="currency">FCFA</span>
                                </div>
                            </div>
                            <div class="amount-item">
                                <label class="amount-label">Montant net</label>
                                <div class="amount-value">
                                    <input type="text" id="amount_net" class="form-control" readonly value="0,00">
                                    <span class="currency">FCFA</span>
                                </div>
                            </div>
                        </div>

                        <!-- Date de paiement -->
                        <div class="form-group">
                            <label class="form-label">
                                <i data-lucide="calendar" style="width: 18px; height: 18px;"></i> Date du paiement *
                            </label>
                            <input type="date" name="payment_date" class="form-control"
                                value="{{ old('payment_date', date('Y-m-d')) }}" required>
                        </div>

                        <!-- Méthode de paiement -->
                        <div class="form-group">
                            <label class="form-label">
                                <i data-lucide="smartphone" style="width: 18px; height: 18px;"></i> Méthode de paiement *
                            </label>
                            <select name="payment_method" id="payment_method" class="form-control form-select" required>
                                <option value="">Sélectionnez une méthode</option>
                                <option value="virement" {{ old('payment_method') == 'virement' ? 'selected' : '' }}>
                                    Virement bancaire
                                </option>
                                <option value="especes" {{ old('payment_method') == 'especes' ? 'selected' : '' }}>
                                    Espèces
                                </option>
                                <option value="cheque" {{ old('payment_method') == 'cheque' ? 'selected' : '' }}>
                                    Chèque
                                </option>
                                <option value="mobile_money"
                                    {{ old('payment_method') == 'mobile_money' ? 'selected' : '' }}>
                                    Mobile Money
                                </option>
                                <option value="card" {{ old('payment_method') == 'card' ? 'selected' : '' }}>
                                    Carte bancaire
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- Colonne droite -->
                    <div class="form-column">
                        <!-- Notes -->
                        <div class="form-group">
                            <label class="form-label">
                                <i data-lucide="message-square" style="width: 18px; height: 18px;"></i> Notes
                                additionnelles
                            </label>
                            <textarea name="notes" class="form-control form-textarea"
                                placeholder="Ajoutez des informations supplémentaires sur ce paiement..." rows="5">{{ old('notes') }}</textarea>
                        </div>

                        <!-- Informations du bail -->
                        <div class="info-card">
                            <div class="info-header">
                                <i data-lucide="info" style="width: 18px; height: 18px;"></i>
                                <h3>Informations du bail</h3>
                            </div>
                            <div class="info-content">
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">Bien</span>
                                        <span id="selected-property" class="info-value">-</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Locataire</span>
                                        <span id="selected-tenant" class="info-value">-</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Loyer mensuel</span>
                                        <span id="selected-rent" class="info-value info-value-highlight">-</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Solde restant</span>
                                        <span id="selected-balance" class="info-value">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Récapitulatif -->
                        <div class="summary-card">
                            <div class="summary-header">
                                <i data-lucide="calculator" style="width: 18px; height: 18px;"></i>
                                <h3>Récapitulatif</h3>
                            </div>
                            <div class="summary-content">
                                <div class="summary-item">
                                    <span class="summary-label">Montant total</span>
                                    <span id="preview-total" class="summary-value">0,00 FCFA</span>
                                </div>
                                <div class="summary-item">
                                    <span class="summary-label">Frais de gestion</span>
                                    <span id="preview-fee" class="summary-value">0,00 FCFA</span>
                                </div>
                                <div class="summary-divider"></div>
                                <div class="summary-item summary-total">
                                    <span class="summary-label">Montant net</span>
                                    <span id="preview-net" class="summary-value">0,00 FCFA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div class="form-actions">
                    <button type="submit" class="button button-primary">
                        <i data-lucide="check" style="width: 18px; height: 18px;"></i> Enregistrer le paiement
                    </button>
                    <a href="{{ route('co-owner.payments.index') }}" class="button button-secondary">
                        <i data-lucide="x" style="width: 18px; height: 18px;"></i> Annuler
                    </a>
                </div>
            </form>
        </div>
    </div>

    <style>
        /* Variables et styles de base */
        :root {
            --gradA: #70AE48;
            --gradB: #8BC34A;
            --indigo: #70AE48;
            --violet: #8BC34A;
            --emerald: #10b981;
            --yellow: #f59e0b;
            --red: #ef4444;
            --ink: #0f172a;
            --muted: #64748b;
            --muted2: #94a3b8;
            --line: rgba(15, 23, 42, .10);
            --line2: rgba(15, 23, 42, .08);
            --shadow: 0 22px 70px rgba(0, 0, 0, .18);
        }

        .content-card {
            max-width: 1500px;
            margin: 0 auto;
            background: rgba(255, 255, 255, .92);
            border-radius: 22px;
            box-shadow: var(--shadow);
            overflow: hidden;
            border: 1px solid rgba(112, 174, 72, .18);
            position: relative;
            backdrop-filter: blur(10px);
        }

        .content-header {
            padding: 1.5rem;
            color: rgb(0, 0, 0);
            position: relative;
            overflow: hidden;
            z-index: 1;
        }

        .content-header h1 {
            font-size: 2.2rem;
            font-weight: 900;
            margin: 0 0 0.6rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            letter-spacing: -0.02em;
            color: black;
        }

        .content-header p {
            opacity: 0.9;
            font-weight: 650;
            font-size: 1.1rem;
        }

        .content-body {
            padding: 2.5rem;
            position: relative;
            z-index: 1;
        }

        .top-actions {
            margin-bottom: 2rem;
        }

        .alert-box {
            border-radius: 14px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            border: 1px solid;
            font-weight: 850;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }

        .alert-error {
            background: rgba(254, 242, 242, .92);
            border-color: rgba(248, 113, 113, .30);
            color: #991b1b;
        }

        .button {
            padding: 1rem 1.5rem;
            border-radius: 14px;
            font-weight: 950;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: inherit;
            white-space: nowrap;
            text-decoration: none;
        }

        .button-primary {
            background: linear-gradient(135deg, var(--indigo) 0%, var(--violet) 100%);
            color: #fff;
            box-shadow: 0 14px 30px rgba(112, 174, 72, .22);
        }

        .button-primary:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 18px 34px rgba(112, 174, 72, .28);
        }

        .button-secondary {
            background: rgba(255, 255, 255, .92);
            color: #70AE48;
            border: 2px solid rgba(112, 174, 72, .20);
        }

        .button-secondary:hover {
            background: rgba(112, 174, 72, .06);
        }

        /* Styles du formulaire */
        .form-card {
            background: white;
            border-radius: 18px;
            padding: 2rem;
            border: 2px solid rgba(112, 174, 72, .15);
            box-shadow: 0 12px 40px rgba(0, 0, 0, .08);
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        @media (max-width: 1024px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
        }

        .form-column {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .form-group {
            margin-bottom: 0;
        }

        .form-label {
            display: block;
            font-size: 1rem;
            font-weight: 950;
            color: var(--ink);
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .form-control {
            width: 100%;
            padding: 1rem 1.2rem;
            border-radius: 12px;
            border: 2px solid rgba(148, 163, 184, .25);
            font-size: 1rem;
            transition: all 0.2s ease;
            background: rgba(255, 255, 255, .92);
        }

        .form-control:focus {
            outline: none;
            border-color: #70AE48;
            box-shadow: 0 0 0 3px rgba(112, 174, 72, .15);
        }

        .form-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2370AE48' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1.2rem center;
            background-size: 18px;
            padding-right: 2.8rem;
        }

        .form-textarea {
            min-height: 140px;
            resize: vertical;
        }

        .input-with-icon {
            position: relative;
            display: flex;
            align-items: center;
        }

        .input-suffix {
            position: absolute;
            right: 1.2rem;
            font-weight: 850;
            color: var(--muted);
            font-size: 1rem;
        }

        /* Grid des montants */
        .amount-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            background: rgba(112, 174, 72, .05);
            padding: 1.2rem;
            border-radius: 12px;
            border: 1px solid rgba(112, 174, 72, .12);
        }

        .amount-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .amount-label {
            font-size: 0.9rem;
            font-weight: 850;
            color: var(--muted);
        }

        .amount-value {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .amount-value .form-control {
            flex: 1;
            background: white;
            font-weight: 850;
            font-size: 1rem;
        }

        .currency {
            font-size: 1rem;
            font-weight: 850;
            color: var(--muted);
            min-width: 50px;
        }

        /* Cartes d'information */
        .info-card,
        .summary-card {
            background: rgba(255, 255, 255, .95);
            border-radius: 14px;
            border: 2px solid rgba(112, 174, 72, .15);
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, .05);
        }

        .info-header,
        .summary-header {
            background: linear-gradient(135deg, rgba(112, 174, 72, .10) 0%, rgba(139, 195, 74, .08) 100%);
            padding: 1.2rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-bottom: 1px solid rgba(112, 174, 72, .15);
        }

        .info-header h3,
        .summary-header h3 {
            font-size: 1.1rem;
            font-weight: 950;
            color: #70AE48;
            margin: 0;
        }

        .info-content,
        .summary-content {
            padding: 1.5rem;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .info-label {
            font-size: 0.85rem;
            font-weight: 850;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }

        .info-value {
            font-size: 1rem;
            font-weight: 750;
            color: var(--ink);
        }

        .info-value-highlight {
            color: #70AE48;
            font-weight: 850;
        }

        /* Récapitulatif */
        .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
        }

        .summary-label {
            font-size: 1rem;
            font-weight: 850;
            color: var(--muted);
        }

        .summary-value {
            font-size: 1rem;
            font-weight: 850;
            color: var(--ink);
        }

        .summary-divider {
            height: 1px;
            background: rgba(148, 163, 184, .20);
            margin: 0.5rem 0;
        }

        .summary-total .summary-label {
            font-size: 1.1rem;
            color: #70AE48;
        }

        .summary-total .summary-value {
            font-size: 1.2rem;
            color: #70AE48;
            font-weight: 950;
        }

        /* Actions du formulaire */
        .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(148, 163, 184, .15);
        }

        /* Animation pour le montant net */
        @keyframes highlight {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }

        .summary-total .summary-value.highlight {
            animation: highlight 0.5s ease;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .content-body {
                padding: 1.5rem;
            }

            .form-card {
                padding: 1.5rem;
            }

            .form-actions {
                flex-direction: column;
            }

            .button {
                width: 100%;
                justify-content: center;
            }
        }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialiser les icônes Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            const leaseSelect = document.getElementById('leaseSelect');
            const amountInput = document.getElementById('amount_total');
            const feeDisplay = document.getElementById('fee_amount');
            const netDisplay = document.getElementById('amount_net');
            const paymentMethod = document.getElementById('payment_method');
            const paymentDate = document.querySelector('input[name="payment_date"]');

            // Éléments d'information
            const selectedProperty = document.getElementById('selected-property');
            const selectedTenant = document.getElementById('selected-tenant');
            const selectedRent = document.getElementById('selected-rent');
            const selectedBalance = document.getElementById('selected-balance');

            // Éléments de prévisualisation
            const previewTotal = document.getElementById('preview-total');
            const previewFee = document.getElementById('preview-fee');
            const previewNet = document.getElementById('preview-net');

            // Taux de frais (5%)
            const feeRate = 0.05;

            // Fonction pour formater les nombres
            function formatNumber(number) {
                return new Intl.NumberFormat('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(number);
            }

            // Fonction pour formater la monnaie
            function formatCurrency(amount) {
                return formatNumber(amount) + ' FCFA';
            }

            // Fonction pour calculer et mettre à jour les montants
            function updateAmounts() {
                const amount = parseFloat(amountInput.value) || 0;
                const fee = amount * feeRate;
                const net = amount - fee;

                // Mettre à jour les champs de calcul
                feeDisplay.value = formatNumber(fee);
                netDisplay.value = formatNumber(net);

                // Mettre à jour la prévisualisation
                previewTotal.textContent = formatCurrency(amount);
                previewFee.textContent = formatCurrency(fee);
                previewNet.textContent = formatCurrency(net);

                // Animation pour le montant net
                previewNet.classList.add('highlight');
                setTimeout(() => previewNet.classList.remove('highlight'), 500);
            }

            // Fonction pour mettre à jour les informations du bail sélectionné
            function updateLeaseInfo() {
                const selectedOption = leaseSelect.options[leaseSelect.selectedIndex];
                if (selectedOption.value) {
                    const propertyName = selectedOption.getAttribute('data-property') || 'Non spécifié';
                    const tenantName = selectedOption.getAttribute('data-tenant') || 'Non spécifié';
                    const rentAmount = selectedOption.getAttribute('data-rent');

                    selectedProperty.textContent = propertyName;
                    selectedTenant.textContent = tenantName;

                    if (rentAmount) {
                        const rent = parseFloat(rentAmount);
                        selectedRent.textContent = formatCurrency(rent);

                        // Pour l'exemple, on suggère de payer le loyer complet
                        if (!amountInput.value || amountInput.value === '0') {
                            amountInput.value = rent;
                            updateAmounts();
                        }
                    } else {
                        selectedRent.textContent = '-';
                    }

                    // Pour l'exemple, on affiche "À calculer" pour le solde
                    selectedBalance.textContent = 'À calculer';
                } else {
                    selectedProperty.textContent = '-';
                    selectedTenant.textContent = '-';
                    selectedRent.textContent = '-';
                    selectedBalance.textContent = '-';
                }
            }

            // Fonction pour afficher une erreur
            function showError(message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert-box alert-error';
                errorDiv.innerHTML = `
                    <i data-lucide="alert-circle" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
                    <div>
                        <strong>Erreur de validation</strong>
                        <p style="margin-top: 8px; font-weight: 650; font-size: 1rem;">${message}</p>
                    </div>
                `;

                const formCard = document.querySelector('.form-card');
                formCard.insertBefore(errorDiv, formCard.firstChild);

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

                setTimeout(() => errorDiv.remove(), 5000);
            }

            // Écouter les changements
            amountInput.addEventListener('input', updateAmounts);
            leaseSelect.addEventListener('change', updateLeaseInfo);

            // Initialiser les calculs
            updateAmounts();
            updateLeaseInfo();

            // Validation avant soumission
            document.getElementById('paymentForm').addEventListener('submit', function(e) {
                if (!leaseSelect.value) {
                    e.preventDefault();
                    showError('Veuillez sélectionner un bail.');
                    leaseSelect.focus();
                    return false;
                }
                if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
                    e.preventDefault();
                    showError('Veuillez saisir un montant valide.');
                    amountInput.focus();
                    return false;
                }
                if (!paymentMethod.value) {
                    e.preventDefault();
                    showError('Veuillez sélectionner une méthode de paiement.');
                    paymentMethod.focus();
                    return false;
                }
                return true;
            });

            // Ajouter des événements pour améliorer l'UX
            amountInput.addEventListener('focus', function() {
                this.select();
            });

            // Ajouter un placeholder pour la date d'aujourd'hui
            const today = new Date().toISOString().split('T')[0];
            document.querySelector('input[name="payment_date"]').min = '2020-01-01';
            document.querySelector('input[name="payment_date"]').max = today;
        });
    </script>
@endsection
