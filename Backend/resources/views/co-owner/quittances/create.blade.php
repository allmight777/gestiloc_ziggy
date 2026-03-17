@extends('layouts.co-owner')

@section('title', 'Créer une quittance - Co-propriétaire')

@section('content')
<div class="content-body">
    <div class="top-actions">
        <a href="{{ route('co-owner.quittances.index') }}" class="button button-back">
            <i data-lucide="arrow-left" style="width: 24px; height: 24px;"></i>
            Retour à la liste
        </a>
    </div>

    @if(session('success'))
        <div class="alert-box alert-success">
            <i data-lucide="check-circle" style="width: 28px; height: 28px; flex-shrink: 0;"></i>
            <div>
                <strong>Succès</strong>
                <p style="margin-top: 6px; font-weight: 650; font-size: 1.1rem;">{{ session('success') }}</p>
            </div>
        </div>
    @endif

    @if(session('error'))
        <div class="alert-box alert-error">
            <i data-lucide="alert-circle" style="width: 28px; height: 28px; flex-shrink: 0;"></i>
            <div>
                <strong>Erreur</strong>
                <p style="margin-top: 6px; font-weight: 650; font-size: 1.1rem;">{{ session('error') }}</p>
            </div>
        </div>
    @endif

    @if($leases->isEmpty())
        <div class="empty-state">
            <i data-lucide="home" class="empty-state-icon" style="width: 80px; height: 80px;"></i>
            <h3 class="empty-state-title">Aucun bail disponible</h3>
            <p class="empty-state-text">Vous devez avoir au moins un bail actif pour créer une quittance.</p>
            <a href="{{ route('co-owner.leases.index') }}" class="button button-primary">
                <i data-lucide="plus" style="width: 20px; height: 20px;"></i>
                Gérer les baux
            </a>
        </div>
    @else
        <div class="form-container">
            <form method="POST" action="{{ route('co-owner.quittances.store') }}">
                @csrf

                <div class="form-grid">
                    <!-- Sélection du bail -->
                    <div class="form-group">
                        <label for="lease_id" class="form-label">Sélectionner le bail *</label>
                        <select name="lease_id" id="lease_id" class="form-control @error('lease_id') is-invalid @enderror" required>
                            <option value="">-- Choisir un bail --</option>
                            @foreach($leases as $lease)
                                <option value="{{ $lease->id }}"
                                    data-property="{{ $lease->property->name }}"
                                    data-tenant="{{ $lease->tenant->first_name }} {{ $lease->tenant->last_name }}"
                                    data-rent="{{ number_format($lease->rent_amount, 2, ',', ' ') }}"
                                    {{ old('lease_id') == $lease->id ? 'selected' : '' }}>
                                    {{ $lease->property->name }} - {{ $lease->tenant->first_name }} {{ $lease->tenant->last_name }}
                                </option>
                            @endforeach
                        </select>
                        @error('lease_id')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                        <div class="form-text">Choisissez le bail pour lequel créer la quittance</div>
                    </div>

                    <!-- Informations du bail -->
                    <div class="form-group">
                        <div class="info-card">
                            <h6><i data-lucide="info" style="width: 24px; height: 24px;"></i> Informations du bail</h6>
                            <div id="lease-info">
                                <p><i data-lucide="home" style="width: 20px; height: 20px;"></i> <strong>Bien:</strong> <span id="property-name">-</span></p>
                                <p><i data-lucide="user" style="width: 20px; height: 20px;"></i> <strong>Locataire:</strong> <span id="tenant-name">-</span></p>
                                <p><i data-lucide="credit-card" style="width: 20px; height: 20px;"></i> <strong>Loyer mensuel:</strong> <span id="rent-amount">-</span> FCFA</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-grid">
                    <!-- Mois payé -->
                    <div class="form-group">
                        <label for="paid_month" class="form-label">Mois payé *</label>
                        <input type="month"
                               name="paid_month"
                               id="paid_month"
                               class="form-control @error('paid_month') is-invalid @enderror"
                               value="{{ old('paid_month', date('Y-m')) }}"
                               required>
                        @error('paid_month')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                        <div class="form-text">Mois correspondant au loyer payé</div>
                    </div>

                    <!-- Date d'émission -->
                    <div class="form-group">
                        <label for="issued_date" class="form-label">Date d'émission *</label>
                        <input type="date"
                               name="issued_date"
                               id="issued_date"
                               class="form-control @error('issued_date') is-invalid @enderror"
                               value="{{ old('issued_date', date('Y-m-d')) }}"
                               required>
                        @error('issued_date')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                        <div class="form-text">Date à laquelle la quittance est émise</div>
                    </div>

                    <!-- Montant payé -->
                    <div class="form-group">
                        <label for="amount_paid" class="form-label">Montant payé (FCFA) *</label>
                        <input type="number"
                               step="0.01"
                               min="0"
                               name="amount_paid"
                               id="amount_paid"
                               class="form-control @error('amount_paid') is-invalid @enderror"
                               value="{{ old('amount_paid') }}"
                               placeholder="0.00"
                               required>
                        @error('amount_paid')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                        <div class="form-text">Montant effectivement payé par le locataire</div>
                    </div>
                </div>

                <!-- Notes -->
                <div class="form-group form-group-full">
                    <label for="notes" class="form-label">Notes (optionnel)</label>
                    <textarea name="notes"
                              id="notes"
                              class="form-control @error('notes') is-invalid @enderror"
                              rows="4"
                              placeholder="Notes complémentaires...">{{ old('notes') }}</textarea>
                    @error('notes')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                    <div class="form-text">Informations complémentaires sur ce paiement</div>
                </div>

                <!-- Option email -->
                <div class="form-check">
                    <input type="checkbox"
                           name="send_email"
                           id="send_email"
                           class="form-check-input"
                           value="1"
                           {{ old('send_email') ? 'checked' : '' }}>
                    <label for="send_email" class="form-check-label">
                        <i data-lucide="mail" style="width: 20px; height: 20px; margin-right: 0.75rem;"></i>
                        Envoyer automatiquement la quittance par email au locataire
                    </label>
                </div>

                <!-- Boutons -->
                <div class="form-actions">
                    <button type="submit" class="button button-primary">
                        <i data-lucide="file-plus" style="width: 20px; height: 20px;"></i>
                        Créer la quittance
                    </button>
                    <a href="{{ route('co-owner.quittances.index') }}" class="button button-secondary">
                        <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                        Annuler
                    </a>
                </div>
            </form>
        </div>
    @endif
</div>

<style>
    /* Styles spécifiques à la page de création de quittance */
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
        --line: rgba(15,23,42,.10);
        --line2: rgba(15,23,42,.08);
        --shadow: 0 22px 70px rgba(0,0,0,.18);
    }

    .content-body {
        padding: 3rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .top-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .alert-box {
        border-radius: 18px;
        padding: 1.75rem;
        margin-bottom: 2.5rem;
        border: 2px solid;
        font-weight: 850;
        display: flex;
        align-items: flex-start;
        gap: 14px;
    }

    .alert-success {
        background: rgba(112, 174, 72, 0.1);
        border-color: rgba(112, 174, 72, 0.3);
        color: #2e5e1e;
    }

    .alert-error {
        background: rgba(254,242,242,.92);
        border-color: rgba(248,113,113,.30);
        color: #991b1b;
    }

    .button {
        padding: 1.2rem 2rem;
        border-radius: 14px;
        font-weight: 700;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-family: inherit;
        white-space: nowrap;
        text-decoration: none;
    }

    .button-primary {
        background: #70AE48;
        color: #fff;
        box-shadow: 0 6px 16px rgba(112, 174, 72, 0.3);
    }

    .button-primary:hover {
        background: #5d8f3a;
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(112, 174, 72, 0.4);
    }

    .button-secondary {
        background: white;
        color: #70AE48;
        border: 2px solid rgba(112, 174, 72, 0.3);
    }

    .button-secondary:hover {
        background: rgba(112, 174, 72, 0.05);
        border-color: #70AE48;
    }

    .button-back {
        background: white;
        color: #6B7280;
        border: 2px solid #E5E7EB;
    }

    .button-back:hover {
        background: #F9FAFB;
        color: #70AE48;
        border-color: #70AE48;
    }

    .form-container {
        background: white;
        border: 2px solid #E5E7EB;
        border-radius: 24px;
        padding: 3rem;
        box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2.5rem;
        margin-bottom: 2.5rem;
    }

    .form-group {
        margin-bottom: 0;
    }

    .form-group-full {
        grid-column: 1 / -1;
        margin-bottom: 2rem;
    }

    .form-label {
        display: block;
        margin-bottom: 0.75rem;
        font-weight: 750;
        color: #1F2937;
        font-size: 1.15rem;
    }

    .form-control {
        width: 100%;
        padding: 1.2rem 1.25rem;
        border-radius: 14px;
        border: 2px solid #E5E7EB;
        background: white;
        font-size: 1.1rem;
        font-weight: 500;
        color: #1F2937;
        transition: all 0.2s ease;
        line-height: 1.5;
    }

    .form-control:focus {
        outline: none;
        border-color: #70AE48;
        box-shadow: 0 0 0 4px rgba(112, 174, 72, 0.15);
    }

    .form-control.is-invalid {
        border-color: var(--red);
    }

    .invalid-feedback {
        color: var(--red);
        font-size: 0.95rem;
        font-weight: 600;
        margin-top: 0.5rem;
    }

    .form-text {
        color: #9CA3AF;
        font-size: 0.95rem;
        font-weight: 500;
        margin-top: 0.5rem;
    }

    .info-card {
        background: rgba(112, 174, 72, 0.08);
        border: 2px solid rgba(112, 174, 72, 0.25);
        border-radius: 20px;
        padding: 2rem;
        height: 100%;
    }

    .info-card h6 {
        color: #70AE48;
        font-weight: 800;
        margin-bottom: 1.5rem;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .info-card p {
        margin-bottom: 1rem;
        font-weight: 650;
        color: #1F2937;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.05rem;
    }

    .info-card p:last-child {
        margin-bottom: 0;
    }

    .info-card span {
        color: #6B7280;
        font-weight: 550;
        margin-left: 0.25rem;
    }

    .form-check {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 2.5rem 0;
        padding: 1.5rem;
        background: rgba(112, 174, 72, 0.08);
        border-radius: 16px;
        border: 2px solid rgba(112, 174, 72, 0.25);
    }

    .form-check-input {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        border: 2px solid #70AE48;
        cursor: pointer;
        appearance: none;
        position: relative;
        flex-shrink: 0;
    }

    .form-check-input:checked {
        background-color: #70AE48;
        border-color: #70AE48;
    }

    .form-check-input:checked::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 3px;
    }

    .form-check-label {
        font-weight: 700;
        color: #1F2937;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-size: 1.1rem;
    }

    .form-check-label i {
        color: #70AE48;
    }

    .form-actions {
        display: flex;
        gap: 1.5rem;
        margin-top: 1rem;
        padding-top: 0;
        border-top: none;
        margin-bottom: 0% !important;
        padding-bottom: 0% !important;
    }

    .empty-state {
        text-align: center;
        padding: 4rem;
        border: 3px dashed #E5E7EB;
        border-radius: 24px;
        background: white;
    }

    .empty-state-icon {
        margin: 0 auto 1.5rem;
        width: 80px;
        height: 80px;
        color: #9CA3AF;
    }

    .empty-state-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #4B5563;
        margin-bottom: 0.75rem;
    }

    .empty-state-text {
        color: #9CA3AF;
        font-weight: 600;
        margin-bottom: 2rem;
        font-size: 1.1rem;
    }

    .badge {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.9rem;
        font-weight: 850;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    .badge-paid {
        background: rgba(34,197,94,.15);
        color: #166534;
        border: 1px solid rgba(34,197,94,.25);
    }

    .badge-pending {
        background: rgba(245,158,11,.15);
        color: #92400e;
        border: 1px solid rgba(245,158,11,.25);
    }

    .badge-overdue {
        background: rgba(239,68,68,.15);
        color: #991b1b;
        border: 1px solid rgba(239,68,68,.25);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .content-body {
            padding: 1.5rem;
        }

        .form-container {
            padding: 2rem;
        }

        .form-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
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

        // Mise à jour des informations du bail
        const leaseSelect = document.getElementById('lease_id');
        const propertyName = document.getElementById('property-name');
        const tenantName = document.getElementById('tenant-name');
        const rentAmount = document.getElementById('rent-amount');
        const amountPaid = document.getElementById('amount_paid');

        if (leaseSelect) {
            // Mettre à jour les informations du bail
            leaseSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];

                if (selectedOption.value) {
                    propertyName.textContent = selectedOption.getAttribute('data-property');
                    tenantName.textContent = selectedOption.getAttribute('data-tenant');
                    rentAmount.textContent = selectedOption.getAttribute('data-rent');

                    // Pré-remplir le montant payé avec le loyer
                    const rentValue = selectedOption.getAttribute('data-rent').replace(/\s/g, '').replace(',', '.');
                    amountPaid.value = parseFloat(rentValue) || '';
                } else {
                    propertyName.textContent = '-';
                    tenantName.textContent = '-';
                    rentAmount.textContent = '-';
                    amountPaid.value = '';
                }
            });

            // Déclencher l'événement au chargement si une valeur est déjà sélectionnée
            if (leaseSelect.value) {
                leaseSelect.dispatchEvent(new Event('change'));
            }
        }

        // Animation de spin pour le loader (si besoin)
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    });
</script>
@endsection
