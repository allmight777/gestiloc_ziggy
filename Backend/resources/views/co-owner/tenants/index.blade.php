@extends('layouts.co-owner')

@section('title', 'Liste des Locataires')

@section('content')
<div class="tl-container">
    <div class="tl-card">
        <!-- Header -->
        <div class="tl-header">
            <h1>Liste des locataires</h1>
            <p>Créez un nouveau contrat entre un bien et un locataire</p>

            <div class="tl-tabs">
                <a href="{{ route('co-owner.tenants.index', array_merge(request()->except('status'), ['status' => 'active'])) }}"
                   class="tl-tab {{ $status === 'active' ? 'active' : '' }}">
                    Actifs ({{ $actifCount ?? 0 }})
                </a>
                <a href="{{ route('co-owner.tenants.index', array_merge(request()->except('status'), ['status' => 'archived'])) }}"
                   class="tl-tab {{ $status === 'archived' ? 'active' : '' }}">
                    Archives ({{ $archiveCount ?? 0 }})
                </a>
            </div>
        </div>

        <div class="tl-body">
            <!-- Actions buttons -->
            <div class="tl-top-actions">
                <a href="#" class="tl-btn-back" onclick="goToReact('/coproprietaire/dashboard'); return false;">
                    <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Retour au tableau de bord
                </a>
                <a href="{{ route('co-owner.tenants.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="tl-btn-primary">
                    <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Créer un locataire
                </a>
            </div>

            @if (session('success'))
                <div style="margin-bottom: 1rem; background: rgba(112,174,72,0.1); border: 1px solid rgba(112,174,72,0.3); border-radius: 14px; padding: 14px 17px; color: #2e5e1e; font-weight: 600; display: flex; align-items: center; gap: 12px; font-size: 17.5px;">
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>{{ session('success') }}</span>
                </div>
            @endif

            @if (session('error'))
                <div style="margin-bottom: 1rem; background: rgba(255,241,242,.92); border: 1px solid rgba(244,63,94,.30); border-radius: 14px; padding: 14px 17px; color: #9f1239; font-weight: 600; display: flex; align-items: center; gap: 12px; font-size: 17.5px;">
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    <span>{{ session('error') }}</span>
                </div>
            @endif

            <!-- Filter Section -->
            <div class="tl-filters">
                <div class="tl-filters-title">
                    <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                    </svg>
                    FILTRER - UTILISEZ LES OPTIONS CI-DESSOUS
                </div>

                <form method="GET" action="{{ route('co-owner.tenants.index') }}" id="filter-form">
                    <input type="hidden" name="status" value="{{ $status }}">
                    <div class="tl-filters-grid">
                        <div class="tl-filter-group">
                            <label>Bien</label>
                            <select name="property_id" class="tl-select" onchange="this.form.submit()">
                                <option value="">Tous les biens</option>
                                @foreach ($delegatedProperties as $property)
                                    @if ($property)
                                        <option value="{{ $property->id }}" {{ $propertyId == $property->id ? 'selected' : '' }}>
                                            {{ $property->name ?? 'Bien #' . $property->id }}
                                        </option>
                                    @endif
                                @endforeach
                            </select>
                        </div>
                        <div class="tl-filter-group">
                            <label>Lignes par page</label>
                            <select name="per_page" class="tl-select" onchange="this.form.submit()">
                                <option value="10" {{ $perPage == 10 ? 'selected' : '' }}>10 lignes</option>
                                <option value="20" {{ $perPage == 20 ? 'selected' : '' }}>20 lignes</option>
                                <option value="50" {{ $perPage == 50 ? 'selected' : '' }}>50 lignes</option>
                                <option value="100" {{ $perPage == 100 ? 'selected' : '' }}>100 lignes</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Search -->
            <form method="GET" action="{{ route('co-owner.tenants.index') }}" class="tl-search-row">
                <input type="hidden" name="status" value="{{ $status }}">
                <input type="hidden" name="property_id" value="{{ $propertyId }}">
                <input type="hidden" name="per_page" value="{{ $perPage }}">
                <div class="tl-search-box">
                    <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="#70AE48" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input type="text" name="search" placeholder="Rechercher" class="tl-search-input" value="{{ $search }}">
                </div>
                <button type="submit" class="tl-btn-view">
                    <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M21 9H3M9 21V9" />
                    </svg>
                    Affichage
                </button>
            </form>

            <!-- Tenant List -->
            <div class="tenants-list-section">
                @if ($tenants && $tenants->count() > 0)
                    <div class="tl-results-info">
                        <p>{{ $tenants->total() }} résultat(s) trouvé(s)</p>
                    </div>

                    <div class="tl-table-wrap">
                        <table class="tl-table">
                            <thead>
                                <tr>
                                    <th>Locataire</th>
                                    <th>Bien</th>
                                    <th>Contact</th>
                                    <th>Invitation</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($tenants as $tenant)
                                    @php
                                        $tenantEmail = $tenant->user->email ?? ($tenant->meta['invitation_email'] ?? ($tenant->meta['email'] ?? '—'));
                                        $tenantPhone = $tenant->user->phone ?? ($tenant->meta['phone'] ?? '—');

                                        $property = null;
                                        if ($tenant->leases && $tenant->leases->count() > 0) {
                                            $property = $tenant->leases->first()->property ?? null;
                                        }
                                        $propertyName = $property ? ($property->name ?? 'Bien #' . $property->id) : 'Aucun bien';

                                        // Statut invitation
                                        $invitationStatus = 'pending';
                                        if (isset($tenant->meta['invitation_id'])) {
                                            $invitation = \App\Models\TenantInvitation::find($tenant->meta['invitation_id']);
                                            if ($invitation) {
                                                if ($invitation->accepted_at) {
                                                    $invitationStatus = 'accepted';
                                                } elseif ($invitation->expires_at < now()) {
                                                    $invitationStatus = 'expired';
                                                } else {
                                                    $invitationStatus = 'pending';
                                                }
                                            }
                                        }

                                        $invIcon = $invitationStatus === 'accepted' ? '✅' : ($invitationStatus === 'expired' ? '❌' : '⏳');
                                        $invText = $invitationStatus === 'accepted' ? 'Acceptée' : ($invitationStatus === 'expired' ? 'Expirée' : 'Non acceptée');
                                        $invClass = $invitationStatus === 'accepted' ? 'active' : ($invitationStatus === 'expired' ? 'expired' : 'pending');
                                    @endphp
                                    <tr>
                                        <td style="font-weight:600; color:#111827; font-size:17.5px;">{{ $tenant->first_name }} {{ $tenant->last_name }}</td>
                                        <td style="font-size:17.5px;">{{ $propertyName }}</td>
                                        <td style="font-size:17.5px;">
                                            <div>{{ $tenantPhone }}</div>
                                            <div style="color:#9ca3af; font-size:15.5px;">{{ $tenantEmail }}</div>
                                        </td>
                                        <td>
                                            <span class="tl-invitation-badge {{ $invClass }}" style="font-size:15.5px;">{{ $invIcon }} {{ $invText }}</span>
                                        </td>
                                        <td>
                                            <div class="tl-actions">
                                               {{--  <a href="{{ route('co-owner.tenants.show', $tenant) . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="tl-btn-action" style="font-size:15.5px;">
                                                    <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z"/></svg>
                                                    Voir
                                                </a>  --}}
                                                @if ($status === 'active')
                                                    <button type="button" class="tl-btn-action tl-btn-archive" style="font-size:15.5px;"
                                                        onclick="showArchiveConfirmation('{{ $tenant->id }}', '{{ $tenant->first_name }} {{ $tenant->last_name }}')">
                                                        <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
                                                        Archiver
                                                    </button>
                                                @else
                                                    <button type="button" class="tl-btn-action tl-btn-restore" style="font-size:15.5px;"
                                                        onclick="showRestoreConfirmation('{{ $tenant->id }}', '{{ $tenant->first_name }} {{ $tenant->last_name }}')">
                                                        <svg width="15.5" height="15.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                                        Restaurer
                                                    </button>
                                                @endif
                                            </div>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>

                    @if ($tenants->hasPages())
                        <div class="pagination">
                            {{ $tenants->appends(['status' => $status, 'search' => $search, 'property_id' => $propertyId, 'per_page' => $per_page])->links('vendor.pagination.custom') }}
                        </div>
                    @endif

                    <div class="tl-add-bottom">
                        <a href="{{ route('co-owner.tenants.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="tl-btn-add" style="font-size:17.5px;">
                            <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Ajouter un locataire
                        </a>
                    </div>
                @else
                    <div class="tl-empty">
                        <svg width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <h3 style="font-size:19.5px;">Aucun locataire trouvé</h3>
                        <p style="font-size:17.5px;">Vous pouvez inviter vos locataires pour leur donner accès à la zone membres.</p>
                        <a href="{{ route('co-owner.tenants.create') . '?api_token=' . (request()->get('api_token') ?? session('api_token', '')) }}" class="tl-btn-primary" style="font-size:17.5px;">
                            <svg width="17.5" height="17.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Créer un locataire
                        </a>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>

<!-- Confirmation Modal -->
<div id="confirmationModal" class="modal-overlay">
    <div class="modal-container">
        <div class="modal-header">
            <h3 id="modalTitle" style="font-size:21px;">Confirmation</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div id="modalIcon" class="modal-icon"></div>
            <p id="modalMessage" style="font-size:17.5px;"></p>
            <div id="modalDetails" class="modal-details" style="font-size:17.5px;"></div>
        </div>
        <div class="modal-footer">
            <button class="modal-btn modal-btn-cancel" onclick="closeModal()" style="font-size:17.5px;">Annuler</button>
            <form id="actionForm" method="POST" style="display: inline;">
                @csrf
                @method('PUT')
                <button type="submit" class="modal-btn modal-btn-confirm" id="confirmBtn" style="font-size:17.5px;"></button>
            </form>
        </div>
    </div>
</div>

<style>
    .tl-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
    .tl-container *, .tl-container *::before, .tl-container *::after { box-sizing: border-box; }

    .tl-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }

    .tl-header { color: #000; padding: 26px 26px 0; }
    .tl-header h1 { font-size: 30px; font-weight: 700; margin: 0 0 5px; }
    .tl-header > p { font-size: 17.5px; color: #6b7280; margin: 0 0 17px; }

    .tl-tabs { display: flex; gap: 9px; margin-top: 17px; margin-bottom: 13px; }
    .tl-tab { padding: 11px 18px; border-radius: 7px; font-weight: 600; font-size: 17.5px; cursor: pointer; border: 1px solid #70AE48; background: #ecfdf5; color: #065f46; transition: all 0.2s ease; text-decoration: none; display: inline-block; }
    .tl-tab.active { background: #70AE48; color: #fff; }
    .tl-tab:not(.active):hover { background: #70AE48; color: #fff; }

    .tl-body { padding: 26px; }

    .tl-top-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
    .tl-btn-back { display: inline-flex; align-items: center; gap: 7px; padding: 11px 17px; background: #fff; border: 1px solid #e5e7eb; border-radius: 7px; color: #6b7280; font-size: 17.5px; font-weight: 500; cursor: pointer; text-decoration: none; }
    .tl-btn-back:hover { background: #f3f4f6; border-color: #70AE48; color: #70AE48; }
    .tl-btn-primary { display: inline-flex; align-items: center; gap: 7px; padding: 11px 19px; background: #70AE48; border: none; border-radius: 7px; color: white; font-size: 17.5px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .tl-btn-primary:hover { background: #5d8f3a; }

    .tl-filters { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 7px; padding: 17px; margin-bottom: 22px; }
    .tl-filters-title { display: flex; align-items: center; gap: 7px; color: #6b7280; font-size: 15.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 13px; }
    .tl-filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 17px; }
    .tl-filter-group label { display: block; color: #111827; font-size: 17.5px; font-weight: 600; margin-bottom: 7px; }
    .tl-select { width: 100%; padding: 9px 13px; border: 1px solid #e5e7eb; border-radius: 5px; font-size: 17.5px; color: #111827; background: white; cursor: pointer; }

    .tl-search-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
    .tl-search-box { display: flex; align-items: center; gap: 7px; padding: 9px 13px; background: white; border: 1px solid #e5e7eb; border-radius: 5px; width: 300px; }
    .tl-search-input { flex: 1; border: none; outline: none; font-size: 17.5px; color: #111827; background: transparent; }
    .tl-search-input::placeholder { color: #9ca3af; }
    .tl-btn-view { display: inline-flex; align-items: center; gap: 7px; padding: 9px 17px; background: white; border: 1px solid #e5e7eb; border-radius: 5px; color: #6b7280; font-size: 17.5px; font-weight: 500; cursor: pointer; }

    .tl-results-info { margin-bottom: 13px; color: #6b7280; font-size: 17.5px; }

    .tl-table-wrap { overflow-x: auto; margin-bottom: 22px; }
    .tl-table { width: 100%; border-collapse: collapse; }
    .tl-table th { padding: 13px 17px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb; white-space: nowrap; font-size: 17.5px; text-transform: uppercase; background: #f8fafc; }
    .tl-table td { padding: 17px 17px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; font-size: 17.5px; }
    .tl-table tbody tr:hover { background: #f9fafb; }

    .tl-invitation-badge { display: inline-flex; align-items: center; gap: 5px; padding: 7px 15px; border-radius: 22px; font-size: 15.5px; font-weight: 600; white-space: nowrap; }
    .tl-invitation-badge.active   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .tl-invitation-badge.pending  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .tl-invitation-badge.expired  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    .tl-muted   { color: #9ca3af; font-style: italic; font-size: 15.5px; }

    .tl-actions { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
    .tl-btn-action { padding: 9px 15px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 5px; color: #374151; font-size: 15.5px; font-weight: 500; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; }
    .tl-btn-action:hover { background: #e5e7eb; }
    .tl-btn-archive { background: #fef3c7 !important; color: #92400e !important; border: 1px solid #fde68a !important; }
    .tl-btn-archive:hover { background: #fde68a !important; }
    .tl-btn-restore { background: #d1fae5 !important; color: #065f46 !important; border: 1px solid #a7f3d0 !important; }
    .tl-btn-restore:hover { background: #a7f3d0 !important; }

    .tl-add-bottom { text-align: center; padding: 22px; border-top: 1px solid #e5e7eb; }
    .tl-btn-add { display: inline-flex; align-items: center; gap: 7px; padding: 11px 26px; background: white; border: 2px dashed #e5e7eb; border-radius: 7px; color: #6b7280; font-size: 17.5px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .tl-btn-add:hover { border-color: #70AE48; color: #70AE48; background: rgba(112,174,72,0.05); }

    .tl-empty { text-align: center; padding: 52px 26px; background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 9px; margin: 26px 0; }
    .tl-empty h3 { font-size: 19.5px; font-weight: 600; color: #111827; margin-bottom: 7px; }
    .tl-empty p { color: #6b7280; margin-bottom: 17px; font-size: 17.5px; }

    /* Modal */
    .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; }
    .modal-container { background: white; border-radius: 17px; width: 90%; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
    .modal-header { padding: 26px 26px 17px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { font-size: 21px; font-weight: 700; color: #111827; margin: 0; }
    .modal-close { background: none; border: none; font-size: 30px; color: #9ca3af; cursor: pointer; }
    .modal-body { padding: 26px; text-align: center; }
    .modal-icon { width: 68px; height: 68px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 22px; font-size: 34px; }
    .modal-icon.archive { background: #fef3c7; }
    .modal-icon.restore { background: #d1fae5; }
    .modal-body p { font-size: 17.5px; color: #111827; line-height: 1.5; margin-bottom: 17px; }
    .modal-details { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 9px; padding: 17px; margin-top: 17px; text-align: left; font-size: 17.5px; }
    .modal-footer { padding: 17px 26px 26px; border-top: 1px solid #e5e7eb; display: flex; gap: 13px; justify-content: flex-end; }
    .modal-btn { padding: 13px 26px; border-radius: 9px; font-size: 17.5px; font-weight: 600; cursor: pointer; border: none; }
    .modal-btn-cancel { background: white; border: 1px solid #e5e7eb !important; color: #6b7280; }
    .modal-btn-cancel:hover { background: #f3f4f6; }
    .modal-btn-confirm { background: #70AE48; color: white; }
    .modal-btn-confirm:hover { background: #5d8f3a; }

    @keyframes tl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
        .tl-body { padding: 17px; }
        .tl-filters-grid { grid-template-columns: 1fr; }
        .tl-search-row { flex-direction: column; gap: 13px; align-items: stretch; }
        .tl-search-box { width: 100%; }
        .tl-top-actions { flex-direction: column; gap: 11px; align-items: stretch; }
    }
</style>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    let currentTenantId = null;

    function showArchiveConfirmation(tenantId, tenantName) {
        currentTenantId = tenantId;
        document.getElementById('modalTitle').textContent = 'Archiver le locataire';
        document.getElementById('modalMessage').textContent = 'Êtes-vous sûr de vouloir archiver ce locataire ?';
        document.getElementById('modalDetails').innerHTML = `
            <div style="text-align:left;">
                <p><strong>Locataire :</strong> ${tenantName}</p>

                <p style="color:#92400E; margin-top:9px;">⚠️ Le locataire sera déplacé vers les archives.</p>
            </div>`;
        const icon = document.getElementById('modalIcon');
        icon.className = 'modal-icon archive';
        icon.innerHTML = '📁';
        document.getElementById('actionForm').action = `/coproprietaire/tenants/${tenantId}/archive`;
        const btn = document.getElementById('confirmBtn');
        btn.textContent = 'Oui, archiver';
        btn.className = 'modal-btn modal-btn-confirm';
        document.getElementById('confirmationModal').style.display = 'flex';
    }

    function showRestoreConfirmation(tenantId, tenantName) {
        currentTenantId = tenantId;
        document.getElementById('modalTitle').textContent = 'Restaurer le locataire';
        document.getElementById('modalMessage').textContent = 'Êtes-vous sûr de vouloir restaurer ce locataire ?';
        document.getElementById('modalDetails').innerHTML = `
            <div style="text-align:left;">
                <p><strong>Locataire :</strong> ${tenantName}</p>

                <p style="color:#065F46; margin-top:9px;">✅ Le locataire sera déplacé vers la liste active.</p>
            </div>`;
        const icon = document.getElementById('modalIcon');
        icon.className = 'modal-icon restore';
        icon.innerHTML = '🔄';
        document.getElementById('actionForm').action = `/coproprietaire/tenants/${tenantId}/restore`;
        const btn = document.getElementById('confirmBtn');
        btn.textContent = 'Oui, restaurer';
        btn.className = 'modal-btn modal-btn-confirm';
        document.getElementById('confirmationModal').style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('confirmationModal').style.display = 'none';
        currentTenantId = null;
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
    document.getElementById('confirmationModal').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
</script>
@endsection
