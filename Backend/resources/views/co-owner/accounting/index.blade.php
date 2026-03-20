@extends('layouts.co-owner')

@section('title', 'Comptabilité et travaux - Copropriétaire')

@section('content')

@if(isset($error))
    <div class="alert alert-danger" style="background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #f87171;">
        <strong>Erreur:</strong> {{ $error }}
    </div>
@endif

<div class="accounting-container">
    <!-- Header -->
    <div class="page-header">
        <div class="header-content">
            <h1>Comptabilité et travaux</h1>
            <p class="subtitle">Suivez vos revenus et dépenses locatives en temps réel.<br>Exportez vos données comptables et générez vos déclarations fiscales.</p>
        </div>
        <div class="header-actions">
            <button class="btn-payment" onclick="openPaymentModal()">
                <i data-lucide="credit-card" style="width: 18px; height: 18px;"></i>
                Mode de paiement
            </button>
            <button class="btn-export" onclick="exportData()">
                <i data-lucide="download" style="width: 18px; height: 18px;"></i>
                Exporter
            </button>
            <a href="{{ route('co-owner.payments.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="btn-add">
                <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
                Ajouter une transaction
            </a>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card stat-primary">
            <div class="stat-label">RÉSULTAT NET {{ $currentYear }}</div>
            <div class="stat-value-large">+ {{ $stats['resultat_net_formatted'] }}</div>
            <div class="stat-variation">{{ $stats['variation'] }} vs {{ $currentYear - 1 }}</div>
        </div>

        <div class="stat-card">
            <div class="stat-label">REVENUS LOCATIFS</div>
            <div class="stat-value-large text-green">{{ $stats['revenus_formatted'] }}</div>
            <div class="stat-sublabel">{{ $stats['active_properties'] }} biens actifs</div>
        </div>

        <div class="stat-card">
            <div class="stat-label">CHARGES TOTALES</div>
            <div class="stat-value-large text-red">{{ $stats['charges_formatted'] }}</div>
            <div class="stat-sublabel">{{ $stats['transactions_count'] }} transactions</div>
        </div>

        <div class="stat-card">
            <div class="stat-label">TAUX DE RENTABILITÉ</div>
            <div class="stat-value-large text-green">{{ $stats['rentabilite'] }}%</div>
            <div class="stat-sublabel">Brut annuel</div>
        </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
        <div class="chart-card chart-large">
            <div class="chart-header">
                <div class="chart-title">
                    <i data-lucide="trending-up" style="width: 20px; height: 20px;"></i>
                    Revenus mensuels
                </div>
                <select class="year-select" id="chartYear" onchange="updateCharts()">
                    @foreach($years as $year)
                        <option value="{{ $year }}" {{ $year == $currentYear ? 'selected' : '' }}>{{ $year }}</option>
                    @endforeach
                    @if(empty($years))
                        <option value="{{ date('Y') }}" selected>{{ date('Y') }}</option>
                    @endif
                </select>
            </div>
            <div class="chart-container">
                <canvas id="revenueChart"></canvas>
            </div>
            <div class="chart-legend">
                <div class="legend-item">
                    <span class="legend-dot dot-green"></span>
                    <span>Loyers reçus</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot dot-orange"></span>
                    <span>Moyenne mensuelle</span>
                </div>
            </div>
        </div>

        <div class="chart-card chart-small">
            <div class="chart-title centered">Taux d'occupation</div>
            <div class="chart-container doughnut-container">
                <canvas id="occupancyChart"></canvas>
            </div>
            <div class="occupancy-stats">
                <div class="occupancy-item">
                    <div class="occupancy-number text-green">{{ $stats['occupied'] }}</div>
                    <div class="occupancy-label">Occupés</div>
                </div>
                <div class="occupancy-item">
                    <div class="occupancy-number text-yellow">{{ $stats['vacant'] }}</div>
                    <div class="occupancy-label">Vacants</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Categories Section -->
    <div class="categories-section">
        <div class="category-card">
            <h4><i data-lucide="arrow-up-circle" style="width: 16px; height: 16px; color: #70AE48;"></i> Revenus par catégorie</h4>
            <div class="category-list">
                @foreach($stats['revenus_par_categorie'] as $name => $amount)
                    @if($amount > 0)
                        <div class="category-item">
                            <span>{{ $name }}</span>
                            <span class="amount">{{ number_format($amount, 0, ',', ' ') }} FCFA</span>
                        </div>
                    @endif
                @endforeach
                @if(array_sum($stats['revenus_par_categorie']) == 0)
                    <div class="category-item">
                        <span>Aucun revenu</span>
                        <span class="amount">0 FCFA</span>
                    </div>
                @endif
                <div class="category-item total">
                    <span>Total revenus</span>
                    <span class="amount text-green">{{ number_format(array_sum($stats['revenus_par_categorie']), 0, ',', ' ') }} FCFA</span>
                </div>
            </div>
        </div>

        <div class="category-card">
            <h4><i data-lucide="arrow-down-circle" style="width: 16px; height: 16px; color: #ef4444;"></i> Charges par catégorie</h4>
            <div class="category-list">
                @foreach($stats['charges_par_categorie'] as $name => $amount)
                    @if($amount > 0)
                        <div class="category-item">
                            <span>{{ $name }}</span>
                            <span class="amount">{{ number_format($amount, 0, ',', ' ') }} FCFA</span>
                        </div>
                    @endif
                @endforeach
                @if(array_sum($stats['charges_par_categorie']) == 0)
                    <div class="category-item">
                        <span>Aucune charge</span>
                        <span class="amount">0 FCFA</span>
                    </div>
                @endif
                <div class="category-item total">
                    <span>Total charges</span>
                    <span class="amount text-red">{{ $stats['charges_formatted'] }}</span>
                </div>
            </div>
        </div>

        <div class="category-card">
            <h4><i data-lucide="home" style="width: 16px; height: 16px; color: #70AE48;"></i> Performance par bien</h4>
            <div class="category-list">
                @if(!empty($stats['repartition_par_bien']))
                    @foreach(array_slice($stats['repartition_par_bien'], 0, 5, true) as $name => $data)
                        <div class="category-item">
                            <span title="{{ $name }}">{{ \Illuminate\Support\Str::limit($name, 20) }}</span>
                            <span class="amount {{ $data['resultat'] >= 0 ? 'text-green' : 'text-red' }}">
                                {{ $data['resultat'] >= 0 ? '+' : '' }}{{ number_format($data['resultat'], 0, ',', ' ') }} FCFA
                            </span>
                        </div>
                    @endforeach
                @else
                    <div class="category-item">
                        <span>Aucun résultat</span>
                        <span class="amount">0 FCFA</span>
                    </div>
                @endif
                <div class="category-item total">
                    <span>Résultat total</span>
                    <span class="amount text-green">+{{ $stats['resultat_net_formatted'] }}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Filter Pills -->
    <div class="filter-pills">
        <button class="pill active" onclick="filterTransactions('all', this)">Toutes les transactions</button>
        <button class="pill" onclick="filterTransactions('revenu', this)">Revenus</button>
        <button class="pill" onclick="filterTransactions('charge', this)">Charges</button>
        <button class="pill" onclick="filterByMonth('01', this)">Janvier {{ $currentYear }}</button>
        <button class="pill" onclick="filterByMonth('02', this)">Février {{ $currentYear }}</button>
    </div>

    <!-- Filters Card -->
    <div class="filters-card">
        <h3 class="filters-title">FILTRER LES TRANSACTIONS</h3>
        <div class="filters-row">
            <div class="filter-select-wrapper">
                <select id="propertyFilter" class="filter-select" onchange="applyFilters()">
                    <option value="all">Tous les biens</option>
                    @foreach($properties as $property)
                        <option value="{{ $property->id }}">{{ \Illuminate\Support\Str::limit($property->name ?? $property->address, 30) }}</option>
                    @endforeach
                </select>
                <i data-lucide="chevron-down" class="select-icon"></i>
            </div>

            <div class="filter-select-wrapper">
                <select id="categoryFilter" class="filter-select" onchange="applyFilters()">
                    <option value="all">Toutes les catégories</option>
                    <option value="Loyer">Loyer</option>
                    <option value="Dépôt de garantie">Dépôt de garantie</option>
                    <option value="Charges">Charges</option>
                    <option value="Réparations">Réparations</option>
                </select>
                <i data-lucide="chevron-down" class="select-icon"></i>
            </div>
        </div>

        <div class="search-row">
            <div class="search-input-wrapper">
                <i data-lucide="search" class="search-icon"></i>
                <input type="text" id="searchInput" class="search-input" placeholder="Rechercher une transaction" onkeyup="applyFilters()">
            </div>
            <div class="transactions-count">
                <span id="transactionCount">{{ $transactions->count() }}</span> transactions
            </div>
        </div>
    </div>

    <!-- Liste des méthodes de paiement -->
    <div class="payment-methods-section">
        <h3 class="section-title">
            <i data-lucide="credit-card" style="width: 24px; height: 24px;"></i>
            Mes méthodes de paiement
        </h3>
        <div class="payment-methods-grid" id="paymentMethodsList">
            <!-- Les méthodes de paiement seront chargées ici dynamiquement -->
            <div class="loading-state">
                <i data-lucide="loader" style="width: 32px; height: 32px;"></i>
                <p>Chargement des méthodes de paiement...</p>
            </div>
        </div>
    </div>

    <!-- Transactions Table -->
    <div class="transactions-card">
        <h3 class="transactions-title">Dernières transactions</h3>
        <div class="table-responsive">
            <table class="transactions-table" id="transactionsTable">
                <thead>
                    <tr>
                        <th>DATE</th>
                        <th>TYPE</th>
                        <th>DESCRIPTION</th>
                        <th>BIEN</th>
                        <th>CATÉGORIE</th>
                        <th>MONTANT</th>
                        
                    </tr>
                </thead>
                <tbody id="transactionsBody">
                    @forelse($transactions as $trans)
                        @php
                            $transaction = $trans;
                            $isRevenu = $transaction->type === 'REVENU';
                            $amountClass = $isRevenu ? 'text-green' : 'text-red';
                            $sign = $isRevenu ? '+' : '-';
                            $date = $transaction->date ? \Carbon\Carbon::parse($transaction->date)->format('d M Y') : 'N/A';
                            $propertyName = $transaction->property_name ?? 'N/A';
                            $typeText = $isRevenu ? 'REVENU' : 'CHARGE';
                            $currency = $transaction->currency ?? 'FCFA';
                        @endphp
                        <tr class="transaction-row" data-type="{{ strtolower($transaction->type) }}" data-property="{{ $transaction->property_id ?? '' }}" data-category="{{ $transaction->category }}">
                            <td>{{ $date }}</td>
                            <td>
                                <span class="badge {{ $isRevenu ? 'badge-revenu' : 'badge-charge' }}">
                                    {{ $typeText }}
                                </span>
                            </td>
                            <td>{{ $transaction->description }}</td>
                            <td>{{ \Illuminate\Support\Str::limit($propertyName, 20) }}</td>
                            <td>{{ $transaction->category }}</td>
                            <td class="amount {{ $amountClass }}">{{ $sign }} {{ number_format($transaction->amount, 0, ',', ' ') }} {{ $currency }}</td>

                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" class="empty-cell">
                                <div class="empty-state">
                                    <i data-lucide="file-text" style="width: 48px; height: 48px;"></i>
                                    <p>Aucune transaction trouvée</p>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal de gestion des méthodes de paiement -->
<div id="paymentMethodModal" class="modal" style="display: none;">
    <div class="modal-overlay" onclick="closePaymentModal()"></div>
    <div class="modal-container">
        <div class="modal-header">
            <h3 id="modalTitle">Ajouter un mode de paiement</h3>
            <button class="modal-close" onclick="closePaymentModal()">
                <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="paymentMethodForm" onsubmit="savePaymentMethod(event)">
                <input type="hidden" id="methodId" name="id">

                <div class="form-group">
                    <label for="type">Type de paiement</label>
                    <select id="type" name="type" class="form-control" required onchange="togglePaymentFields()">
                        <option value="">Sélectionnez un type</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="card">Carte bancaire</option>
                        <option value="bank_transfer">Virement bancaire</option>
                        <option value="cash">Espèces</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="beneficiary_name">Nom du bénéficiaire</label>
                    <input type="text" id="beneficiary_name" name="beneficiary_name" class="form-control" required>
                </div>

                <div class="form-row">
                    <div class="form-group half">
                        <label for="country">Pays</label>
                        <select id="country" name="country" class="form-control" required>
                            <option value="CI">Côte d'Ivoire</option>
                            <option value="BF">Burkina Faso</option>
                            <option value="SN">Sénégal</option>
                            <option value="ML">Mali</option>
                            <option value="GN">Guinée</option>
                            <option value="CM">Cameroun</option>
                        </select>
                    </div>
                    <div class="form-group half">
                        <label for="currency">Devise</label>
                        <select id="currency" name="currency" class="form-control" required>
                            <option value="XOF">FCFA (UEMOA)</option>
                            <option value="XAF">FCFA (CEMAC)</option>
                            <option value="EUR">Euro</option>
                            <option value="USD">Dollar</option>
                        </select>
                    </div>
                </div>

                <!-- Champs Mobile Money -->
                <div id="mobileMoneyFields" class="payment-type-fields" style="display: none;">
                    <div class="form-group">
                        <label for="mobile_operator">Opérateur</label>
                        <select id="mobile_operator" name="mobile_operator" class="form-control">
                            <option value="">Sélectionnez un opérateur</option>
                            <option value="MTN">MTN</option>
                            <option value="MOOV">MOOV</option>
                            <option value="CELTIS">CELTIS</option>
                            <option value="ORANGE">Orange</option>
                            <option value="WAVE">Wave</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="mobile_number">Numéro de téléphone</label>
                        <input type="tel" id="mobile_number" name="mobile_number" class="form-control" placeholder="Ex: 0708091011">
                    </div>
                </div>

                <!-- Champs Carte bancaire -->
                <div id="cardFields" class="payment-type-fields" style="display: none;">
                    <div class="form-group">
                        <label for="card_brand">Type de carte</label>
                        <select id="card_brand" name="card_brand" class="form-control">
                            <option value="">Sélectionnez un type</option>
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="American Express">American Express</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="card_last4">4 derniers chiffres</label>
                        <input type="text" id="card_last4" name="card_last4" class="form-control" maxlength="4" placeholder="1234">
                    </div>
                    <input type="hidden" id="card_token" name="card_token">
                </div>

                <!-- Champs Virement bancaire -->
                <div id="bankFields" class="payment-type-fields" style="display: none;">
                    <div class="form-group">
                        <label for="bank_name">Nom de la banque</label>
                        <input type="text" id="bank_name" name="bank_name" class="form-control" placeholder="Ex: Société Générale">
                    </div>
                    <div class="form-group">
                        <label for="bank_account_number">Numéro de compte</label>
                        <input type="text" id="bank_account_number" name="bank_account_number" class="form-control" placeholder="Ex: 12345678901">
                    </div>
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="bank_iban">IBAN</label>
                            <input type="text" id="bank_iban" name="bank_iban" class="form-control" placeholder="Ex: FR76 1234 5678 9012">
                        </div>
                        <div class="form-group half">
                            <label for="bank_swift">SWIFT/BIC</label>
                            <input type="text" id="bank_swift" name="bank_swift" class="form-control" placeholder="Ex: SOGEFRPP">
                        </div>
                    </div>
                </div>

                <div class="form-group checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="is_default" name="is_default" value="1">
                        <span>Définir comme méthode de paiement par défaut</span>
                    </label>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn-cancel" onclick="closePaymentModal()">Annuler</button>
                    <button type="submit" class="btn-save">Enregistrer</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    // Données pour les graphiques
    const chartData = @json($chartData);
    const occupancyData = {
        occupied: {{ $stats['occupied'] }},
        vacant: {{ $stats['vacant'] }}
    };

    let revenueChart, occupancyChart;

    document.addEventListener('DOMContentLoaded', function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        initCharts();
        updateTransactionCount();
        loadPaymentMethods();
    });

    function initCharts() {
        // Graphique des revenus (barres)
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.month),
                datasets: [
                    {
                        label: 'Loyers reçus',
                        data: chartData.map(d => d.received),
                        backgroundColor: '#70AE48',
                        borderRadius: 4,
                        barPercentage: 0.6,
                    },
                    {
                        label: 'Moyenne mensuelle',
                        data: chartData.map(d => d.average),
                        backgroundColor: '#f59e0b',
                        borderRadius: 4,
                        barPercentage: 0.6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // Graphique d'occupation (doughnut)
        const occupancyCtx = document.getElementById('occupancyChart').getContext('2d');
        occupancyChart = new Chart(occupancyCtx, {
            type: 'doughnut',
            data: {
                labels: ['Occupés', 'Vacants'],
                datasets: [{
                    data: [occupancyData.occupied, occupancyData.vacant],
                    backgroundColor: ['#70AE48', '#fbbf24'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    function updateCharts() {
        const year = document.getElementById('chartYear').value;

        fetch(`{{ route('co-owner.accounting.data') }}?year=${year}`)
            .then(response => response.json())
            .then(data => {
                revenueChart.data.datasets[0].data = data.data.map(d => d.received);
                revenueChart.data.datasets[1].data = data.data.map(d => d.average);
                revenueChart.update();
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour des graphiques:', error);
            });
    }

    function filterTransactions(type, btn) {
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');

        const rows = document.querySelectorAll('.transaction-row');
        rows.forEach(row => {
            if (type === 'all' || row.dataset.type === type) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        updateTransactionCount();
    }

    function filterByMonth(month, btn) {
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');

        const rows = document.querySelectorAll('.transaction-row');
        rows.forEach(row => {
            const dateCell = row.cells[0].textContent;
            const rowMonth = dateCell.split(' ')[1];

            const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            const targetMonth = monthNames[parseInt(month) - 1];

            if (dateCell.includes(targetMonth)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        updateTransactionCount();
    }

    function applyFilters() {
        const propertyFilter = document.getElementById('propertyFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        const rows = document.querySelectorAll('.transaction-row');
        rows.forEach(row => {
            let show = true;

            if (propertyFilter !== 'all' && row.dataset.property !== propertyFilter) {
                show = false;
            }

            if (categoryFilter !== 'all') {
                const rowCategory = row.dataset.category;
                if (rowCategory !== categoryFilter) {
                    show = false;
                }
            }

            if (searchTerm) {
                const text = row.textContent.toLowerCase();
                if (!text.includes(searchTerm)) {
                    show = false;
                }
            }

            row.style.display = show ? '' : 'none';
        });

        updateTransactionCount();
    }

    function updateTransactionCount() {
        const visibleRows = document.querySelectorAll('.transaction-row:not([style*="display: none"])');
        document.getElementById('transactionCount').textContent = visibleRows.length;
    }

    function exportData() {
        const rows = document.querySelectorAll('.transaction-row');
        let csv = 'Date;Type;Description;Bien;Catégorie;Montant\n';

        rows.forEach(row => {
            if (row.style.display !== 'none') {
                const cells = row.cells;
                const date = cells[0].textContent;
                const type = cells[1].textContent.trim();
                const description = cells[2].textContent.replace(/;/g, ',');
                const bien = cells[3].textContent.replace(/;/g, ',');
                const categorie = cells[4].textContent;
                const montant = cells[5].textContent.replace(' FCFA', '');

                csv += `${date};${type};${description};${bien};${categorie};${montant}\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'transactions_' + new Date().toISOString().slice(0,10) + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Charger la liste des méthodes de paiement
    function loadPaymentMethods() {
        const container = document.getElementById('paymentMethodsList');

        const _token = new URLSearchParams(window.location.search).get('api_token') || localStorage.getItem('token');
        fetch('/payment-methods' + (window.location.search || '?') + '&_blade=1', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur réseau');
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    console.error('Réponse non-JSON:', text.substring(0, 200));
                    throw new Error('La réponse n\'est pas au format JSON');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayPaymentMethods(data.data);
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="alert-circle" style="width: 48px; height: 48px;"></i>
                        <p>Erreur: ${data.error || 'Impossible de charger les méthodes de paiement'}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="alert-circle" style="width: 48px; height: 48px;"></i>
                    <p>Erreur de chargement des méthodes de paiement</p>
                </div>
            `;
        })
        .finally(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    }

    // Afficher les méthodes de paiement
    function displayPaymentMethods(methods) {
        const container = document.getElementById('paymentMethodsList');

        if (!methods || methods.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="credit-card" style="width: 64px; height: 64px;"></i>
                    <p class="empty-title">Aucune méthode de paiement</p>
                    <p class="empty-subtitle">Ajoutez votre première méthode de paiement en cliquant sur le bouton "Mode de paiement"</p>
                </div>
            `;
            return;
        }

        let html = '';
        methods.forEach(method => {
            const displayName = getDisplayName(method);
            const icon = getIcon(method.type);
            const color = getColor(method.type);
            const typeLabel = getTypeLabel(method.type);

            html += `
                <div class="payment-method-card ${method.is_default ? 'default' : ''}" onclick="openPaymentModal(${method.id})">
                    <div class="payment-method-header">
                        <div class="payment-method-icon" style="background: ${color}20; color: ${color};">
                            <i data-lucide="${icon}" style="width: 24px; height: 24px;"></i>
                        </div>
                        <div class="payment-method-info">
                            <div class="payment-method-name">
                                ${displayName}
                                ${method.is_default ? '<span class="default-badge">Par défaut</span>' : ''}
                            </div>
                            <div class="payment-method-type">${typeLabel}</div>
                        </div>
                    </div>

                    <div class="payment-method-details">
                        <div class="payment-method-detail">
                            <span class="detail-label">Bénéficiaire:</span>
                            <span class="detail-value">${method.beneficiary_name || 'Non spécifié'}</span>
                        </div>

                        <div class="payment-method-detail">
                            <span class="detail-label">Pays:</span>
                            <span class="detail-value">${getCountryName(method.country)}</span>
                        </div>

                        <div class="payment-method-detail">
                            <span class="detail-label">Devise:</span>
                            <span class="detail-value">${method.currency || 'Non spécifié'}</span>
                        </div>

                        ${method.mobile_operator ? `
                        <div class="payment-method-detail">
                            <span class="detail-label">Opérateur:</span>
                            <span class="detail-value">${method.mobile_operator}</span>
                        </div>
                        ` : ''}

                        ${method.mobile_number ? `
                        <div class="payment-method-detail">
                            <span class="detail-label">Téléphone:</span>
                            <span class="detail-value">${maskNumber(method.mobile_number)}</span>
                        </div>
                        ` : ''}

                        ${method.card_brand && method.card_last4 ? `
                        <div class="payment-method-detail">
                            <span class="detail-label">Carte:</span>
                            <span class="detail-value">${method.card_brand} •••• ${method.card_last4}</span>
                        </div>
                        ` : ''}

                        ${method.bank_name ? `
                        <div class="payment-method-detail">
                            <span class="detail-label">Banque:</span>
                            <span class="detail-value">${method.bank_name}</span>
                        </div>
                        ` : ''}

                        ${method.bank_account_number ? `
                        <div class="payment-method-detail">
                            <span class="detail-label">Compte:</span>
                            <span class="detail-value">${maskNumber(method.bank_account_number)}</span>
                        </div>
                        ` : ''}

                        ${method.bank_iban ? `
                        <div class="payment-method-detail">
                            <span class="detail-label">IBAN:</span>
                            <span class="detail-value">${maskNumber(method.bank_iban)}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="payment-method-actions">
                        <button class="btn-action" onclick="event.stopPropagation(); openPaymentModal(${method.id})">
                            <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                            Modifier
                        </button>

                        ${!method.is_default ? `
                        <button class="btn-action" onclick="event.stopPropagation(); setDefaultMethod(${method.id})">
                            <i data-lucide="star" style="width: 16px; height: 16px;"></i>
                            Définir par défaut
                        </button>
                        ` : ''}

                        <button class="btn-action delete" onclick="event.stopPropagation(); deleteMethod(${method.id})">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                            Supprimer
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Fonctions utilitaires
    function getCountryName(code) {
        const countries = {
            'CI': 'Côte d\'Ivoire',
            'BF': 'Burkina Faso',
            'SN': 'Sénégal',
            'ML': 'Mali',
            'GN': 'Guinée',
            'CM': 'Cameroun',
            'BJ': 'Bénin',
            'TG': 'Togo'
        };
        return countries[code] || code;
    }

    function getDisplayName(method) {
        if (method.type === 'mobile_money') {
            return method.mobile_operator + ' - ' + maskNumber(method.mobile_number);
        } else if (method.type === 'card') {
            return method.card_brand + ' •••• ' + method.card_last4;
        } else if (method.type === 'bank_transfer') {
            return method.bank_name + ' - ' + maskNumber(method.bank_account_number);
        } else if (method.type === 'cash') {
            return 'Espèces';
        }
        return 'Méthode de paiement';
    }

    function getIcon(type) {
        const icons = {
            'mobile_money': 'smartphone',
            'card': 'credit-card',
            'bank_transfer': 'landmark',
            'cash': 'wallet'
        };
        return icons[type] || 'credit-card';
    }

    function getColor(type) {
        const colors = {
            'mobile_money': '#70AE48',
            'card': '#FF9800',
            'bank_transfer': '#2196F3',
            'cash': '#4CAF50'
        };
        return colors[type] || '#9E9E9E';
    }

    function getTypeLabel(type) {
        const labels = {
            'mobile_money': 'Mobile Money',
            'card': 'Carte bancaire',
            'bank_transfer': 'Virement bancaire',
            'cash': 'Espèces'
        };
        return labels[type] || 'Autre';
    }

    function maskNumber(number) {
        if (!number) return '';
        if (number.length <= 4) return number;
        const visible = number.slice(-4);
        const masked = '*'.repeat(4);
        return masked + visible;
    }

    // Fonctions du modal de paiement
    function openPaymentModal(methodId = null) {
        const modal = document.getElementById('paymentMethodModal');
        modal.style.display = 'flex';

        if (methodId) {
            document.getElementById('modalTitle').textContent = 'Modifier le mode de paiement';
            loadPaymentMethod(methodId);
        } else {
            document.getElementById('modalTitle').textContent = 'Ajouter un mode de paiement';
            resetPaymentForm();
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function closePaymentModal() {
        const modal = document.getElementById('paymentMethodModal');
        modal.style.display = 'none';
        resetPaymentForm();
    }

    function resetPaymentForm() {
        document.getElementById('paymentMethodForm').reset();
        document.getElementById('methodId').value = '';
        document.getElementById('type').value = '';
        document.getElementById('card_token').value = 'tok_' + Math.random().toString(36).substr(2, 9);
        togglePaymentFields();
    }

    function togglePaymentFields() {
        const type = document.getElementById('type').value;

        document.getElementById('mobileMoneyFields').style.display = 'none';
        document.getElementById('cardFields').style.display = 'none';
        document.getElementById('bankFields').style.display = 'none';

        document.getElementById('mobile_operator').required = false;
        document.getElementById('mobile_number').required = false;
        document.getElementById('card_brand').required = false;
        document.getElementById('card_last4').required = false;
        document.getElementById('bank_name').required = false;
        document.getElementById('bank_account_number').required = false;

        if (type === 'mobile_money') {
            document.getElementById('mobileMoneyFields').style.display = 'block';
            document.getElementById('mobile_operator').required = true;
            document.getElementById('mobile_number').required = true;
        } else if (type === 'card') {
            document.getElementById('cardFields').style.display = 'block';
            document.getElementById('card_brand').required = true;
            document.getElementById('card_last4').required = true;
        } else if (type === 'bank_transfer') {
            document.getElementById('bankFields').style.display = 'block';
            document.getElementById('bank_name').required = true;
            document.getElementById('bank_account_number').required = true;
        }
    }

    function loadPaymentMethod(id) {
        console.log('Chargement de la méthode de paiement ID:', id);

        fetch(`/payment-methods/${id}?api_token=${new URLSearchParams(window.location.search).get('api_token') || localStorage.getItem('token')}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            console.log('Statut de la réponse:', response.status);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Méthode de paiement non trouvée');
                } else if (response.status === 401) {
                    throw new Error('Non authentifié');
                } else {
                    throw new Error('Erreur serveur: ' + response.status);
                }
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    console.error('Réponse non-JSON reçue:', text.substring(0, 200));
                    throw new Error('La réponse n\'est pas au format JSON');
                });
            }

            return response.json();
        })
        .then(data => {
            console.log('Données reçues:', data);

            if (data.success) {
                const method = data.data;

                document.getElementById('methodId').value = method.id || '';
                document.getElementById('type').value = method.type || '';
                document.getElementById('beneficiary_name').value = method.beneficiary_name || '';
                document.getElementById('country').value = method.country || 'CI';
                document.getElementById('currency').value = method.currency || 'XOF';
                document.getElementById('is_default').checked = method.is_default ? true : false;

                if (method.type === 'mobile_money') {
                    document.getElementById('mobile_operator').value = method.mobile_operator || '';
                    document.getElementById('mobile_number').value = method.mobile_number || '';
                } else if (method.type === 'card') {
                    document.getElementById('card_brand').value = method.card_brand || '';
                    document.getElementById('card_last4').value = method.card_last4 || '';
                    document.getElementById('card_token').value = method.card_token || 'tok_' + Math.random().toString(36).substr(2, 9);
                } else if (method.type === 'bank_transfer') {
                    document.getElementById('bank_name').value = method.bank_name || '';
                    document.getElementById('bank_account_number').value = method.bank_account_number || '';
                    document.getElementById('bank_iban').value = method.bank_iban || '';
                    document.getElementById('bank_swift').value = method.bank_swift || '';
                }

                togglePaymentFields();
            } else {
                alert('Erreur: ' + (data.error || 'Impossible de charger la méthode de paiement'));
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement de la méthode de paiement: ' + error.message);
        });
    }

    function savePaymentMethod(event) {
        event.preventDefault();

        const form = document.getElementById('paymentMethodForm');
        const formData = new FormData(form);
        const methodId = document.getElementById('methodId').value;

        const data = {};
        formData.forEach((value, key) => {
            if (value !== '') {
                data[key] = value;
            }
        });

        data.is_default = document.getElementById('is_default').checked ? 1 : 0;

        const _t = new URLSearchParams(window.location.search).get('api_token') || localStorage.getItem('token');
        const url = methodId ? `/payment-methods/${methodId}?api_token=${_t}` : `/payment-methods?api_token=${_t}`;
        const method = methodId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closePaymentModal();
                loadPaymentMethods();
                alert(methodId ? 'Méthode de paiement modifiée avec succès' : 'Méthode de paiement ajoutée avec succès');
            } else {
                alert('Erreur: ' + (data.error || 'Une erreur est survenue'));
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'enregistrement');
        });
    }

    function setDefaultMethod(id) {
        if (!confirm('Voulez-vous définir cette méthode comme méthode de paiement par défaut ?')) {
            return;
        }

        fetch(`/payment-methods/${id}/set-default?api_token=${new URLSearchParams(window.location.search).get('api_token') || localStorage.getItem('token')}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadPaymentMethods();
                alert('Méthode par défaut mise à jour');
            } else {
                alert('Erreur: ' + (data.error || 'Une erreur est survenue'));
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la mise à jour');
        });
    }

    function deleteMethod(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
            return;
        }

        fetch(`/payment-methods/${id}?api_token=${new URLSearchParams(window.location.search).get('api_token') || localStorage.getItem('token')}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadPaymentMethods();
                alert('Méthode de paiement supprimée avec succès');
            } else {
                alert('Erreur: ' + (data.error || 'Une erreur est survenue'));
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la suppression');
        });
    }

    // Fermer le modal si on clique sur l'overlay
    window.onclick = function(event) {
        const modal = document.getElementById('paymentMethodModal');
        if (event.target.classList.contains('modal-overlay')) {
            closePaymentModal();
        }
    }
</script>

<style>
    .accounting-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
        background: #f8fafc;
        min-height: 100vh;
    }

    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        gap: 2rem;
    }

    .header-content h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
    }

    .subtitle {
        color: #64748b;
        font-size: 1rem;
        line-height: 1.6;
        margin: 0;
    }

    .header-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .btn-payment {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-payment:hover {
        background: #2563eb;
        transform: translateY(-1px);
    }

    .btn-export {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #f97316;
        color: white;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-export:hover {
        background: #ea580c;
        transform: translateY(-1px);
    }

    .btn-add {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        background: #70AE48;
        color: white;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        transition: all 0.2s;
    }

    .btn-add:hover {
        background: #5d8f3a;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
    }

    .btn-view-payment {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-view-payment:hover {
        background: #2563eb;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .stat-primary {
        background: #70AE48;
        color: white;
        border-color: #70AE48;
    }

    .stat-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }

    .stat-primary .stat-label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.85rem;
    }

    .stat-value-large {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.5rem;
        line-height: 1.2;
    }

    .stat-primary .stat-value-large {
        color: white;
        font-size: 2.4rem;
    }

    .text-green { color: #70AE48; }
    .text-red { color: #ef4444; }
    .text-yellow { color: #f59e0b; }
    .text-blue { color: #3b82f6; }

    .stat-variation {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
    }

    .stat-sublabel {
        font-size: 0.9rem;
        color: #94a3b8;
        font-weight: 500;
    }

    .charts-section {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .chart-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .chart-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
    }

    .chart-title.centered {
        justify-content: center;
        margin-bottom: 1rem;
    }

    .chart-title i {
        color: #70AE48;
    }

    .year-select {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.9rem;
        background: white;
        cursor: pointer;
    }

    .chart-container {
        height: 300px;
        position: relative;
    }

    .doughnut-container {
        height: 200px;
        display: flex;
        justify-content: center;
    }

    .chart-legend {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 1rem;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
    }

    .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .dot-green { background: #70AE48; }
    .dot-orange { background: #f59e0b; }

    .occupancy-stats {
        display: flex;
        justify-content: center;
        gap: 3rem;
        margin-top: 1.5rem;
    }

    .occupancy-item {
        text-align: center;
    }

    .occupancy-number {
        font-size: 2rem;
        font-weight: 700;
    }

    .occupancy-label {
        font-size: 0.875rem;
        color: #64748b;
    }

    .categories-section {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .category-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .category-card h4 {
        font-size: 0.9rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .category-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .category-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.875rem;
        color: #374151;
    }

    .category-item.total {
        padding-top: 0.75rem;
        border-top: 1px solid #e2e8f0;
        font-weight: 600;
    }

    .category-item .amount {
        font-weight: 600;
    }

    .filter-pills {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .pill {
        padding: 0.75rem 1.5rem;
        background: #e2e8f0;
        color: #475569;
        border: none;
        border-radius: 50px;
        font-weight: 500;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .pill:hover {
        background: #cbd5e1;
    }

    .pill.active {
        background: #70AE48;
        color: white;
    }

    .filters-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filters-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: 0.05em;
        margin: 0 0 1rem 0;
    }

    .filters-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .filter-select-wrapper {
        position: relative;
    }

    .filter-select {
        width: 100%;
        padding: 0.875rem 1rem;
        padding-right: 2.5rem;
        border: 1px solid #70AE48;
        border-radius: 10px;
        font-size: 0.95rem;
        color: #64748b;
        background: white;
        appearance: none;
        cursor: pointer;
    }

    .filter-select:focus {
        outline: none;
        border-color: #5d8f3a;
        box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
    }

    .select-icon {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        color: #64748b;
        pointer-events: none;
    }

    .search-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .search-input-wrapper {
        position: relative;
        flex: 1;
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        color: #70AE48;
    }

    .search-input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 2.75rem;
        border: 1px solid #70AE48;
        border-radius: 10px;
        font-size: 0.95rem;
        color: #374151;
    }

    .search-input:focus {
        outline: none;
        border-color: #5d8f3a;
        box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
    }

    .transactions-count {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
        white-space: nowrap;
    }

    /* Section Méthodes de paiement */
    .payment-methods-section {
        margin-bottom: 2rem;
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 1.5rem;
    }

    .payment-methods-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 1.5rem;
    }

    .loading-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #64748b;
        font-size: 1.1rem;
    }

    .loading-state i {
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 16px;
        border: 1px dashed #e2e8f0;
    }

    .empty-state i {
        color: #94a3b8;
        margin-bottom: 1rem;
    }

    .empty-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.5rem;
    }

    .empty-subtitle {
        font-size: 1rem;
        color: #64748b;
    }

    .payment-method-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .payment-method-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        border-color: #70AE48;
    }

    .payment-method-card.default {
        border-left: 4px solid #70AE48;
        background: linear-gradient(to right, #ffffff, #f8fafc);
    }

    .payment-method-header {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .payment-method-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .payment-method-info {
        flex: 1;
    }

    .payment-method-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    .default-badge {
        background: #70AE48;
        color: white;
        font-size: 0.8rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 500;
    }

    .payment-method-type {
        font-size: 0.95rem;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .payment-method-details {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .payment-method-detail {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 1rem;
        line-height: 1.5;
    }

    .detail-label {
        font-weight: 600;
        color: #1e293b;
        min-width: 100px;
        font-size: 0.95rem;
    }

    .detail-value {
        color: #374151;
        font-size: 1rem;
        word-break: break-word;
    }

    .payment-method-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }

    .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.2rem;
        background: white;
        color: #1e293b;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-action:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
    }

    .btn-action.delete:hover {
        background: #fee2e2;
        color: #dc2626;
        border-color: #fecaca;
    }

    .transactions-card {
        background: white;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .transactions-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1.5rem 0;
    }

    .table-responsive {
        overflow-x: auto;
    }

    .transactions-table {
        width: 100%;
        border-collapse: collapse;
    }

    .transactions-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e2e8f0;
    }

    .transactions-table td {
        padding: 1rem;
        font-size: 0.95rem;
        color: #374151;
        border-bottom: 1px solid #f1f5f9;
    }

    .transactions-table tr:hover {
        background: #f8fafc;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.9rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.05em;
    }

    .badge-revenu {
        background: #e6f2e0;
        color: #70AE48;
    }

    .badge-charge {
        background: #fee2e2;
        color: #dc2626;
    }

    .amount {
        font-weight: 600;
        font-size: 1rem;
    }

    .empty-cell {
        text-align: center;
        padding: 3rem;
    }

    /* Styles du modal */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1001;
    }

    .modal-container {
        position: relative;
        background: white;
        border-radius: 20px;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        z-index: 1002;
        animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
        font-size: 1.4rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
    }

    .modal-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        border-radius: 8px;
        transition: all 0.2s;
    }

    .modal-close:hover {
        background: #f1f5f9;
        color: #1e293b;
    }

    .modal-body {
        padding: 2rem;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-group label {
        display: block;
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.5rem;
    }

    .form-control {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.2s;
    }

    .form-control:focus {
        outline: none;
        border-color: #70AE48;
        box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
    }

    .form-row {
        display: flex;
        gap: 1rem;
    }

    .form-row .half {
        flex: 1;
    }

    .checkbox-group {
        margin-top: 1rem;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-size: 1rem;
    }

    .checkbox-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }

    .checkbox-label span {
        font-size: 1rem;
        color: #374151;
    }

    .payment-type-fields {
        background: #f8fafc;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 1rem;
        border: 1px solid #e2e8f0;
    }

    .btn-cancel {
        padding: 0.875rem 1.5rem;
        background: #e2e8f0;
        color: #475569;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-cancel:hover {
        background: #cbd5e1;
    }

    .btn-save {
        padding: 0.875rem 2rem;
        background: #70AE48;
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-save:hover {
        background: #5d8f3a;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
    }

    @media (max-width: 1024px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .charts-section {
            grid-template-columns: 1fr;
        }

        .categories-section {
            grid-template-columns: 1fr;
        }

        .payment-methods-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 768px) {
        .page-header {
            flex-direction: column;
            align-items: stretch;
        }

        .header-actions {
            flex-direction: row;
            flex-wrap: wrap;
        }

        .btn-payment,
        .btn-export,
        .btn-add {
            flex: 1;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .filters-row {
            grid-template-columns: 1fr;
        }

        .search-row {
            flex-direction: column;
            align-items: stretch;
        }

        .transactions-count {
            text-align: center;
        }

        .form-row {
            flex-direction: column;
            gap: 0;
        }

        .modal-container {
            width: 95%;
            margin: 1rem;
        }

        .payment-method-actions {
            flex-direction: column;
        }

        .btn-action {
            width: 100%;
            justify-content: center;
        }

        .payment-method-detail {
            flex-direction: column;
            gap: 0.25rem;
        }

        .detail-label {
            min-width: auto;
        }
    }
</style>
@endsection
