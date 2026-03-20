@extends('layouts.co-owner')

@section('title', 'États des lieux')

@section('content')
<style>
    .condition-reports-container {
        padding: 3rem;
        max-width: 1400px;
        margin: 0 auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 3rem;
    }

    .header-content h1 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
    }

    .header-description {
        color: #6b7280;
        font-size: 1.15rem;
        line-height: 1.5;
        margin: 0;
    }

    .create-btn {
        background: #70AE48;
        color: white;
        padding: 1rem 2rem;
        border-radius: 2rem;
        font-weight: 500;
        font-size: 1.15rem;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        text-decoration: none;
    }

    .create-btn:hover {
        background: #70AE48;
        transform: translateY(-1px);
    }

    .create-btn svg {
        width: 20px;
        height: 20px;
    }

    /* Tabs */
    .tabs-container {
        background: #f3f4f6;
        border-radius: 0.75rem;
        padding: 0.375rem;
        display: inline-flex;
        gap: 0.5rem;
        margin-bottom: 2.5rem;
    }

    .tab-btn {
        padding: 0.875rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        background: transparent;
        color: #6b7280;
        font-weight: 500;
        font-size: 1.1rem;
        transition: all 0.2s ease;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .tab-btn.active {
        background: #70AE48;
        color: white;
    }

    .tab-btn:not(.active):hover {
        color: #377DF4;
    }

    /* Filter Section */
    .filter-section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 1rem;
        padding: 2.5rem;
        margin-bottom: 3rem;
    }

    .filter-title {
        font-size: 1.05rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .property-select {
        width: 100%;
        padding: 1.2rem 1.5rem;
        border: 1px solid #84cc16;
        border-radius: 0.75rem;
        font-size: 1.15rem;
        color: #6b7280;
        margin-bottom: 1.5rem;
        background: white;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
    }

    .property-select:focus {
        outline: none;
        border-color: #65a30d;
    }

    .filter-row {
        display: flex;
        gap: 1.5rem;
        align-items: center;
    }

    .search-input-wrapper {
        position: relative;
        flex: 1;
    }

    .search-input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 2.5rem;
        border: 1px solid #84cc16;
        border-radius: 0.75rem;
        font-size: 1.15rem;
        color: #374151;
        background: white;
    }

    .search-input:focus {
        outline: none;
        border-color: #65a30d;
    }

    .search-input::placeholder {
        color: #9ca3af;
    }

    .search-icon {
        position: absolute;
        left: 0.875rem;
        top: 50%;
        transform: translateY(-50%);
        color: #84cc16;
        width: 18px;
        height: 18px;
    }

    .display-btn {
        padding: 0.875rem 1.25rem;
        border: 1px solid #84cc16;
        background: white;
        color: #374151;
        border-radius: 0.75rem;
        font-weight: 500;
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        white-space: nowrap;
    }

    .display-btn:hover {
        background: #f9fafb;
    }

    /* Reports Grid */
    .reports-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2.5rem;
    }

    .report-card {
        background: white;
        border-radius: 1rem;
        overflow: hidden;
        transition: all 0.2s ease;
        border: 1px solid #e5e7eb;
        border-left: 4px solid transparent;
    }

    .report-card.entry {
        border-left-color: #84cc16;
    }

    .report-card.exit {
        border-left-color: #ef4444;
    }

    .report-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .report-header {
        padding: 2rem;
        border-bottom: 1px solid #f3f4f6;
    }

    .report-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.95rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        margin-bottom: 1.25rem;
    }

    .report-badge.entry {
        background: #ecfdf5;
        color: #059669;
    }

    .report-badge.exit {
        background: #fef2f2;
        color: #dc2626;
    }

    .report-title {
        font-size: 1.4rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.375rem;
    }

    .report-location {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #84cc16;
        font-size: 1.05rem;
        font-weight: 500;
    }

    .report-location svg {
        width: 14px;
        height: 14px;
        color: #84cc16;
    }

    .report-body {
        padding: 2rem;
    }

    .report-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem 2rem;
        margin-bottom: 1.5rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .info-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: #111827;
    }

    .status-value {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .status-check {
        color: #111827;
        font-weight: 600;
    }

    .photo-count {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.625rem 0.875rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        font-size: 1.05rem;
        color: #374151;
    }

    .photo-count svg {
        width: 16px;
        height: 16px;
        color: #6b7280;
    }

    .report-footer {
        padding: 0.875rem 1.25rem;
        background: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .creation-date {
        font-size: 1rem;
        color: #6b7280;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
    }

    .action-btn {
        width: 32px;
        height: 32px;
        border-radius: 0.5rem;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: transparent;
    }

    .action-btn svg {
        width: 16px;
        height: 16px;
    }

    .action-btn.download {
        color: #377DF4;
    }

    .action-btn.download:hover {
        background: rgba(55, 125, 244, 0.1);
    }

    .action-btn.edit {
        color: #f59e0b;
    }

    .action-btn.edit:hover {
        background: rgba(245, 158, 11, 0.1);
    }

    .action-btn.more {
        color: #9ca3af;
    }

    .action-btn.more:hover {
        background: #e5e7eb;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 1rem;
        border: 2px dashed #e5e7eb;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1.5rem;
    }

    .empty-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 1rem;
    }

    .empty-description {
        color: #6b7280;
        margin-bottom: 2.5rem;
        font-size: 1.1rem;
    }

    /* Pagination */
    .pagination-container {
        margin-top: 2rem;
        display: flex;
        justify-content: center;
    }

    @media (max-width: 768px) {
        .header-section {
            flex-direction: column;
            gap: 1.5rem;
        }

        .reports-grid {
            grid-template-columns: 1fr;
        }

        .filter-row {
            flex-direction: column;
        }

        .display-btn {
            width: 100%;
            justify-content: center;
        }
    }

    /* Augmenter l'espacement général */
    .condition-reports-container {
        padding: 1.25rem !important;
    }

    /* Titres plus grands */
    .header-content h1 {
        font-size: 2rem !important;
        margin-bottom: 0.5rem !important;
    }

    .header-description {
        font-size: 1rem !important;
        line-height: 1.7 !important;
    }

    /* Bouton créer plus grand */
    .create-btn {
        padding: 1.2rem 2.5rem !important;
        font-size: 0.9rem !important;
        border-radius: 3rem !important;
    }

    .create-btn svg {
        width: 24px !important;
        height: 24px !important;
    }

    /* Tabs plus grands */
    .tabs-container {
        padding: 0.5rem !important;
        gap: 0.5rem !important;
        margin-bottom: 1.5rem !important;
    }

    .tab-btn {
        padding: 0.875rem 1.75rem !important;
        font-size: 0.9rem !important;
    }

    /* Section filtres plus grande */
    .filter-section {
        padding: 1.5rem !important;
        margin-bottom: 1.5rem !important;
    }

    .filter-title {
        font-size: 0.9rem !important;
        margin-bottom: 1.5rem !important;
    }

    .property-select {
        padding: 1.2rem 1.5rem !important;
        font-size: 0.9rem !important;
        margin-bottom: 1.5rem !important;
    }

    .search-input {
        padding: 1.2rem 1.5rem 1.2rem 3rem !important;
        font-size: 0.9rem !important;
    }

    .search-icon {
        width: 22px !important;
        height: 22px !important;
        left: 1.2rem !important;
    }

    .display-btn {
        padding: 1.2rem 1.75rem !important;
        font-size: 0.9rem !important;
    }

    /* Cartes d'état des lieux plus grandes et espacées */
    .reports-grid {
        gap: 1.5rem !important;
    }

    .report-card {
        border-radius: 1.5rem !important;
        border-left-width: 6px !important;
    }

    .report-header {
        padding: 1.25rem !important;
    }

    .report-badge {
        padding: 0.625rem 1rem !important;
        font-size: 0.9rem !important;
        margin-bottom: 1.25rem !important;
    }

    .report-title {
        font-size: 1.6rem !important;
        margin-bottom: 0.75rem !important;
    }

    .report-location {
        font-size: 0.9rem !important;
    }

    .report-location svg {
        width: 18px !important;
        height: 18px !important;
    }

    .report-body {
        padding: 1.25rem !important;
    }

    .report-info-grid {
        gap: 1.5rem 3rem !important;
        margin-bottom: 1.5rem !important;
    }

    .info-label {
        font-size: 0.95rem !important;
        margin-bottom: 0.5rem !important;
    }

    .info-value {
        font-size: 0.95rem !important;
    }

    .photo-count {
        padding: 1rem 1.25rem !important;
        font-size: 0.9rem !important;
    }

    .photo-count svg {
        width: 20px !important;
        height: 20px !important;
    }

    .report-footer {
        padding: 1.25rem 2rem !important;
    }

    .creation-date {
        font-size: 1rem !important;
    }

    .action-btn {
        width: 44px !important;
        height: 44px !important;
    }

    .action-btn svg {
        width: 20px !important;
        height: 20px !important;
    }

    /* Empty state plus grand */
    .empty-state {
        padding: 6rem 3rem !important;
    }

    .empty-icon {
        font-size: 4rem !important;
        margin-bottom: 2rem !important;
    }

    .empty-title {
        font-size: 1.8rem !important;
        margin-bottom: 0.5rem !important;
    }

    .empty-description {
        font-size: 0.95rem !important;
        margin-bottom: 2rem !important;
    }

    /* Responsive pour mobile */
    @media (max-width: 1024px) {
        .reports-grid {
            grid-template-columns: 1fr !important;
        }
    }


    /* Réduire l'espace en haut du titre principal */
    .header-content h1 {
        margin-top: 0 !important;
        padding-top: 0 !important;
    }

    /* Réduire l'espacement du header-section */
    .header-section {
        margin-bottom: 1.5rem !important;
        padding-top: 0 !important;
    }

    /* Réduire la taille du titre dans la carte */
    .report-title {
        font-size: 1.25rem !important;
    }

    /* Réduire le padding des cartes */
    .report-card {
        border-radius: 1rem !important;
    }

    .report-header {
        padding: 1.25rem !important;
    }

    .report-body {
        padding: 1.25rem !important;
    }

    .report-footer {
        padding: 0.875rem 1.25rem !important;
    }

    /* Réduire le gap de la grille d'info */
    .report-info-grid {
        gap: 1rem 2rem !important;
        margin-bottom: 1rem !important;
    }

    /* Réduire le padding des boutons */
    .create-btn {
        padding: 0.875rem 1.5rem !important;
        font-size: 0.95rem !important;
    }

    /* Réduire le padding des tabs */
    .tab-btn {
        padding: 0.625rem 1.25rem !important;
        font-size: 0.9rem !important;
    }

    /* Réduire le padding des inputs */
    .search-input {
        padding: 0.875rem 1rem 0.875rem 2.5rem !important;
        font-size: 0.9rem !important;
    }

    .property-select {
        padding: 0.875rem 1rem !important;
        font-size: 0.9rem !important;
    }

    .display-btn {
        padding: 0.875rem 1.25rem !important;
        font-size: 0.9rem !important;
    }

    /* Réduire le padding de la section filtre */
    .filter-section {
        padding: 1.5rem !important;
        margin-bottom: 1.5rem !important;
    }

    /* Réduire le margin du container principal */
    .condition-reports-container {
        padding: 1.5rem 2rem !important;
    }

</style>

<div class="condition-reports-container">
    <!-- Header -->
    <div class="header-section">
        <div class="header-content">
            <h1>États des lieux</h1>
            <p class="header-description">
                Documentez l'état de vos biens avec photos et descriptions détaillées.<br>
                Générez des PDF professionnels en quelques clics.
            </p>
        </div>
        <a href="{{ route('co-owner.condition-reports.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="create-btn">
            <svg viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Créer un nouvel état de lieu
        </a>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
        <button class="tab-btn {{ !request('type') ? 'active' : '' }}" onclick="filterByType('')">
            Tous
        </button>
        <button class="tab-btn {{ request('type') == 'entry' ? 'active' : '' }}" onclick="filterByType('entry')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
            Entrée
        </button>
        <button class="tab-btn {{ request('type') == 'exit' ? 'active' : '' }}" onclick="filterByType('exit')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            Sortie
        </button>
    </div>

    <!-- Filters -->
    <div class="filter-section">
        <h3 class="filter-title">Filtrer par bien</h3>

        <form id="filterForm" action="{{ route('co-owner.condition-reports.index') }}" method="GET">
                <input type="hidden" name="api_token" value="{{ request()->get('api_token') ?? session('api_token', '') }}">
            <input type="hidden" name="type" id="typeInput" value="{{ request('type') }}">

            <select name="property_id" class="property-select" onchange="this.form.submit()">
                <option value="">Tous les biens</option>
                @foreach($properties as $property)
                    <option value="{{ $property->id }}" {{ request('property_id') == $property->id ? 'selected' : '' }}>
                        {{ $property->name }}
                    </option>
                @endforeach
            </select>

            <div class="filter-row">
                <div class="search-input-wrapper">
                    <svg class="search-icon" viewBox="0 0 20 20" fill="none">
                        <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <input type="text" name="search" class="search-input" placeholder="Rechercher" value="{{ request('search') }}">
                </div>
                <button type="button" class="display-btn">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M10 6V2M10 18v-4M6 10H2M18 10h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    Affichage
                </button>
            </div>
        </form>
    </div>

    <!-- Reports Grid -->
    @if($reports->isEmpty())
        <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h4 class="empty-title">Aucun état des lieux trouvé</h4>
            <p class="empty-description">Commencez par créer votre premier état des lieux.</p>
            <a href="{{ route('co-owner.condition-reports.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="create-btn">
                <svg viewBox="0 0 20 20" fill="none" style="width: 18px; height: 18px;">
                    <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Créer un état des lieux
            </a>
        </div>
    @else
        <div class="reports-grid">
            @foreach($reports as $report)
            <div class="report-card {{ $report->type }}">
                <!-- Header -->
                <div class="report-header">
                    <div class="report-badge {{ $report->type }}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        @if($report->type == 'entry')
                            État des lieux d'entrée
                        @else
                            État des lieux de sortie
                        @endif
                    </div>
                    <h3 class="report-title">EDL - {{ $report->tenant_name }}</h3>
                    <div class="report-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {{ $report->property_name }}
                    </div>
                </div>

                <!-- Body -->
                <div class="report-body">
                    <div class="report-info-grid">
                        <div class="info-item">
                            <span class="info-label">Locataire</span>
                            <span class="info-value">{{ $report->tenant_name }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Date</span>
                            <span class="info-value">{{ \Carbon\Carbon::parse($report->report_date)->format('d M Y') }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">État général</span>
                            <span class="info-value">{{ $report->general_condition }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Signé</span>
                            <span class="info-value status-value">
                                <span class="status-check">✓</span> {{ $report->is_signed ? 'Oui' : 'Non' }}
                            </span>
                        </div>
                    </div>

                    <div class="photo-count">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <span style="font-weight: 600;">{{ $report->photos_count }} photos</span>
                    </div>
                </div>

                <!-- Footer -->
                <div class="report-footer">
                    <span class="creation-date">Créé le {{ $report->created_at->format('d M Y') }}</span>
                    <div class="action-buttons">
                        <a href="{{ route('co-owner.condition-reports.download', $report->id) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="action-btn download" title="Télécharger PDF">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </a>
                       <a href="{{ route('co-owner.condition-reports.show', $report->id) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="action-btn show" title="Voir">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
</a>
                      
                    </div>
                </div>
            </div>
            @endforeach
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
            {{ $reports->links() }}
        </div>
    @endif
</div>

<script>
function filterByType(type) {
    document.getElementById('typeInput').value = type;
    document.getElementById('filterForm').submit();
}

function showOptions(reportId) {
    // Afficher un menu contextuel avec options supplémentaires
    console.log('Options for report:', reportId);
}
</script>
@endsection
