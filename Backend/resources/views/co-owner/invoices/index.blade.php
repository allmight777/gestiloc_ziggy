@extends('layouts.co-owner')

@section('title', 'Factures et documents divers')

@section('content')
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .invoices-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
        background: #f8f9fa;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
    }

    .header-content h1 {
        font-size: 2.8rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.75rem;
    }

    .header-description {
        color: #1a1a1a;
        font-size: 1.2rem;
        line-height: 1.6;
        max-width: 600px;
    }

    .add-document-btn {
        background: #70AE48;
        color: white;
        padding: 1.2rem 2.2rem;
        border-radius: 3rem;
        font-weight: 600;
        font-size: 1.2rem;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(124, 179, 66, 0.3);
        border: none;
        cursor: pointer;
    }

    .add-document-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(124, 179, 66, 0.4);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        padding: 1.8rem;
        border-radius: 0.75rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border: 1px solid #e8e8e8;
    }

    .stat-label {
        font-size: 0.9rem;
        color: #9e9e9e;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.75rem;
        font-weight: 600;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.25rem;
    }

    .stat-value.orange {
        color: #ff9800;
    }

    .stat-value.red {
        color: #f44336;
    }

    .stat-sublabel {
        font-size: 1rem;
        color: #757575;
    }

    .filter-tabs {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }

    .filter-tab {
        padding: 0.9rem 2.2rem;
        border-radius: 2.5rem;
        border: none;
        background: #e0e0e0;
        color: #616161;
        font-weight: 600;
        font-size: 1.1rem;
        cursor: pointer;
        transition: all 0.3s;
        text-decoration: none;
        display: inline-block;
    }

    .filter-tab.active {
        background: #70AE48;
        color: white;
        box-shadow: 0 2px 8px rgba(124, 179, 66, 0.3);
    }

    .filter-tab:hover:not(.active) {
        background: #d0d0d0;
    }

    .filter-section {
        background: white;
        padding: 2rem;
        border-radius: 0.75rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border: 1px solid #e8e8e8;
    }

    .filter-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a1a1a;
        margin-bottom: 1.25rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .filter-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .filter-input {
        width: 100%;
        padding: 1rem 1.25rem;
        border: 1px solid #e0e0e0;
        border-radius: 0.5rem;
        font-size: 1.1rem;
        color: #424242;
        background: #fafafa;
        transition: all 0.3s;
    }

    .filter-input:focus {
        outline: none;
        border-color: #7cb342;
        background: white;
    }

    .search-input-wrapper {
        position: relative;
        grid-column: 1 / -1;
    }

    .search-input-wrapper svg {
        position: absolute;
        left: 1.25rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9e9e9e;
        width: 22px;
        height: 22px;
    }

    .search-input {
        padding-left: 3.8rem;
    }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
        gap: 1.8rem;
        margin-bottom: 2rem;
    }

    .invoice-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.8rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        border: 1px solid #e8e8e8;
        transition: all 0.3s;
        position: relative;
        overflow: hidden;
    }

    .invoice-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
    }

    .card-type-badge {
        position: absolute;
        top: 0;
        left: 0;
        padding: 0.6rem 1.2rem;
        border-radius: 0 0 0.5rem 0;
        font-size: 0.9rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .badge-rent {
        background: #fff3e0;
        color: #e65100;
    }

    .badge-deposit {
        background: #e3f2fd;
        color: #0d47a1;
    }

    .badge-charge {
        background: #f3e5f5;
        color: #4a148c;
    }

    .badge-repair {
        background: #e8f5e9;
        color: #1b5e20;
    }

    .card-header {
        margin-top: 2.2rem;
        margin-bottom: 1.2rem;
    }

    .card-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.6rem;
    }

    .card-location {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #757575;
        font-size: 1rem;
    }

    .card-location svg {
        width: 18px;
        height: 18px;
    }

    .card-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.2rem;
        margin: 1.8rem 0;
        padding: 1.2rem 0;
        border-top: 1px solid #f0f0f0;
        border-bottom: 1px solid #f0f0f0;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }

    .detail-label {
        font-size: 0.9rem;
        color: #9e9e9e;
        text-transform: uppercase;
        font-weight: 600;
    }

    .detail-value {
        font-size: 1.1rem;
        color: #424242;
        font-weight: 600;
    }

    .detail-value.amount {
        font-size: 1.4rem;
        color: #ff9800;
        font-weight: 700;
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1.2rem;
    }

    .added-date {
        font-size: 1rem;
        color: #9e9e9e;
    }

    .card-actions {
        display: flex;
        gap: 0.6rem;
    }

    .action-btn {
        width: 3rem;
        height: 3rem;
        border-radius: 0.5rem;
        border: 1px solid #e0e0e0;
        background: white;
        color: #616161;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .action-btn:hover {
        background: #f5f5f5;
        border-color: #2196f3;
        color: #2196f3;
    }

    .action-btn.primary {
        background: #70AE48;
        color: white;
        border-color: #70AE48;
    }

    .action-btn.primary:hover {
        background: #5a8f3a;
    }

    .action-btn svg {
        width: 22px;
        height: 22px;
    }

    .empty-state {
        text-align: center;
        padding: 5rem 2rem;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        grid-column: 1 / -1;
    }

    .empty-state svg {
        margin-bottom: 1.5rem;
        opacity: 0.3;
        width: 100px;
        height: 100px;
    }

    .empty-state h3 {
        font-size: 1.5rem;
        color: #424242;
        margin-bottom: 0.8rem;
    }

    .empty-state p {
        color: #757575;
        margin-bottom: 1.8rem;
        font-size: 1.1rem;
    }

    .empty-state a {
        color: #70AE48;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.2rem;
    }

    @media (max-width: 768px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .filter-grid {
            grid-template-columns: 1fr;
        }

        .cards-grid {
            grid-template-columns: 1fr;
        }

        .header-section {
            flex-direction: column;
            gap: 1rem;
        }

        .add-document-btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>

<div class="invoices-container">
    <!-- Header -->
    <div class="header-section">
        <div class="header-content">
            <h1>Factures et documents divers</h1>
            <p class="header-description">
                Centralisez tous vos documents importants : factures de travaux, assurances, diagnostics, attestations.<br>
                Gardez une trace de toutes vos dépenses et documents administratifs.
            </p>
        </div>
        <a href="{{ route('co-owner.invoices.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="add-document-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5V19M5 12H19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            Ajouter un document
        </a>
    </div>

    <!-- Statistiques -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Documents</div>
            <div class="stat-value">{{ $invoices->total() }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Factures ce mois</div>
            <div class="stat-value">{{ $stats['count_pending'] + $stats['count_paid'] }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Montant</div>
            <div class="stat-value orange">{{ number_format($stats['total_pending'] + $stats['total_paid'], 0, ',', ' ') }} FCFA</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">À renouveler</div>
            <div class="stat-value red">{{ $stats['count_overdue'] ?? 0 }}</div>
        </div>
    </div>

    <!-- Filtres par type -->
    <div class="filter-tabs">
        <a href="{{ route('co-owner.invoices.index') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="filter-tab {{ !request('type') ? 'active' : '' }}">
            Tous
        </a>
        <a href="{{ route('co-owner.invoices.index', ['type' => 'rent']) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="filter-tab {{ request('type') == 'rent' ? 'active' : '' }}">
            Facture
        </a>
        <a href="{{ route('co-owner.invoices.index', ['type' => 'repair']) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="filter-tab {{ request('type') == 'repair' ? 'active' : '' }}">
            Travaux
        </a>
        <a href="{{ route('co-owner.invoices.index', ['type' => 'deposit']) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="filter-tab {{ request('type') == 'deposit' ? 'active' : '' }}">
            Assurances
        </a>
        <a href="{{ route('co-owner.invoices.index', ['type' => 'charge']) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="filter-tab {{ request('type') == 'charge' ? 'active' : '' }}">
            Diagnostics
        </a>
        <a href="{{ route('co-owner.invoices.index', ['type' => 'other']) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="filter-tab {{ request('type') == 'other' ? 'active' : '' }}">
            Autres
        </a>
    </div>

    <!-- Section de filtres -->
    <div class="filter-section">
        <h3 class="filter-title">Filtrer par bien et par type</h3>
        <form method="GET" action="{{ route('co-owner.invoices.index') }}">
                <input type="hidden" name="api_token" value="{{ request()->get('api_token') ?? session('api_token', '') }}">
            <div class="filter-grid">
                <select name="property_id" class="filter-input">
                    <option value="">Tous les biens</option>
                    @foreach($properties ?? [] as $property)
                        <option value="{{ $property->id }}" {{ request('property_id') == $property->id ? 'selected' : '' }}>
                            {{ $property->name }}
                        </option>
                    @endforeach
                </select>

                <select name="invoice_type" class="filter-input">
                    <option value="">Tous les types</option>
                    <option value="rent" {{ request('invoice_type') == 'rent' ? 'selected' : '' }}>Facture</option>
                    <option value="repair" {{ request('invoice_type') == 'repair' ? 'selected' : '' }}>Travaux</option>
                    <option value="deposit" {{ request('invoice_type') == 'deposit' ? 'selected' : '' }}>Assurances</option>
                    <option value="charge" {{ request('invoice_type') == 'charge' ? 'selected' : '' }}>Diagnostics</option>
                </select>

                <div class="search-input-wrapper">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        name="search"
                        class="filter-input search-input"
                        placeholder="Rechercher"
                        value="{{ request('search') }}"
                    >
                </div>
            </div>
            <button type="submit" style="display: none;">Rechercher</button>
        </form>
    </div>

    <!-- Grille de cartes -->
    <div class="cards-grid">
        @forelse($invoices as $inv)
        @php $invoice = $inv; @endphp
        <div class="invoice-card">
            <div class="card-type-badge badge-{{ $invoice->type }}">
                @switch($invoice->type)
                    @case('rent') Facture Travaux @break
                    @case('deposit') Assurance GLI @break
                    @case('charge') Diagnostic Amiante @break
                    @case('repair') Facture Travaux @break
                    @default {{ ucfirst($invoice->type) }}
                @endswitch
            </div>

            <div class="card-header">
                <div class="card-title">
                    {{ $invoice->description ?? ($invoice->invoice_number ?? 'FACT-' . $invoice->id) }}
                </div>
                <div class="card-location">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {{ $invoice->lease->tenant->user->name ?? 'N/A' }} • {{ $invoice->lease->property->name ?? 'N/A' }}
                </div>
            </div>

            <div class="card-details">
                <div class="detail-item">
                    <div class="detail-label">
                        @if($invoice->type == 'rent') Prestataire
                        @elseif($invoice->type == 'deposit') Compagnie
                        @elseif($invoice->type == 'charge') Diagnostiqueur
                        @else Fournisseur
                        @endif
                    </div>
                    <div class="detail-value">{{ $invoice->lease->property->name ?? 'N/A' }}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">N° Facture</div>
                    <div class="detail-value">{{ $invoice->invoice_number ?? 'FACT-' . $invoice->id }}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Montant TTC</div>
                    <div class="detail-value amount">{{ number_format($invoice->amount_total, 0, ',', ' ') }} FCFA</div>
                </div>
            </div>

            <div class="card-footer">
                <div class="added-date">
                    Ajouté le {{ \Carbon\Carbon::parse($invoice->created_at)->format('d M Y') }}
                </div>
                <div class="card-actions">
                    <a href="{{ route('co-owner.invoices.pdf', $invoice->id) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="action-btn primary" title="Télécharger PDF">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
        @empty
        <div class="empty-state">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
            </svg>
            <h3>Aucune facture trouvée</h3>
            <p>
                <a href="{{ route('co-owner.invoices.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}">Créez votre première facture</a>
            </p>
        </div>
        @endforelse
    </div>

    <!-- Pagination -->
    @if($invoices->hasPages())
    <div style="margin-top: 2rem; display: flex; justify-content: center;">
        {{ $invoices->links() }}
    </div>
    @endif
</div>

<script>
    // Auto-submit form on select change
    document.querySelectorAll('.filter-input').forEach(select => {
        if (select.tagName === 'SELECT') {
            select.addEventListener('change', function() {
                this.closest('form').submit();
            });
        }
    });

    // Submit form on search input with debounce
    let searchTimeout;
    document.querySelector('.search-input')?.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            this.closest('form').submit();
        }, 500);
    });
</script>
@endsection
