@extends('layouts.co-owner')

@section('title', 'Contrats de bail - Co-propriétaire')

@section('content')
<div class="leases-container">

    <!-- Header -->
    <div class="leases-header">
        <div class="header-content">
            <h1>Contrats de bail</h1>
            <p class="subtitle">Générez automatiquement vos contrats de bail personnalisés en quelques clics.<br>Documents conformes et prêts à signer.</p>
        </div>
        <a href="{{ route('co-owner.assign-property.create') }}" class="btn-new-lease">
            <i data-lucide="plus" style="width:18px;height:18px;"></i>
            Contrat de bail
        </a>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
        <div class="filters-card">
            <h3 class="filters-title">FILTRER PAR BIEN</h3>
            <form method="GET" action="{{ route('co-owner.leases.index') }}" class="filters-form">
                <div class="filter-row">
                    <div class="filter-select-wrapper">
                        <select name="property_id" class="filter-select" onchange="this.form.submit()">
                            <option value="all" {{ request('property_id') == 'all' || !request('property_id') ? 'selected' : '' }}>Tous les biens</option>
                            @foreach($properties as $property)
                                <option value="{{ $property->id }}" {{ request('property_id') == $property->id ? 'selected' : '' }}>
                                    {{ $property->name }}
                                </option>
                            @endforeach
                        </select>
                        <i data-lucide="chevron-down" class="select-icon"></i>
                    </div>
                    <div class="search-input-wrapper">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" name="search" class="search-input" placeholder="Rechercher" value="{{ request('search') }}">
                    </div>
                    <button type="submit" class="btn-display">
                        <i data-lucide="settings" style="width:16px;height:16px;"></i>
                        Affichage
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Liste des contrats -->
    <div class="contracts-grid">
        @forelse($leases as $lease)
            @php
                $now                = now();
                $hasValidDates      = $lease->start_date && $lease->end_date;
                $isActive           = $hasValidDates && $lease->start_date <= $now && $lease->end_date >= $now;
                $isPendingDate      = $lease->start_date && $lease->start_date > $now;
                $isExpired          = $lease->end_date && $lease->end_date < $now;
                $isPendingSignature = $lease->status === 'pending_signature';
                $landlordSigned     = !empty($lease->landlord_signature);
                $tenantSigned       = !empty($lease->tenant_signature);
                $hasSigned          = $landlordSigned && $tenantSigned;
                $hasSignedDoc       = !empty($lease->signed_document);
            @endphp

            <div class="contract-card">

                <div class="contract-type">
                    {{ $lease->type == 'meuble' ? 'BAIL MEUBLÉ' : "BAIL D'HABITATION NU" }}
                </div>

                <h3 class="contract-title">Contrat - {{ $lease->tenant->first_name }} {{ $lease->tenant->last_name }}</h3>

                <div class="contract-location">
                    <i data-lucide="map-pin" style="width:16px;height:16px;color:#e74c3c;"></i>
                    <span>{{ $lease->property->name ?? 'Bien sans nom' }} - {{ $lease->property->address ?? 'Adresse non spécifiée' }}</span>
                </div>

                <div class="contract-details">
                    <div class="detail-group">
                        <div class="detail-label">LOYER MENSUEL</div>
                        <div class="detail-value">{{ number_format($lease->rent_amount, 0, ',', ' ') }} FCFA</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">DÉPÔT DE GARANTIE</div>
                        <div class="detail-value">{{ number_format($lease->deposit_amount ?? $lease->rent_amount * 2, 0, ',', ' ') }} FCFA</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">DATE DE DÉBUT</div>
                        <div class="detail-value">{{ $lease->start_date ? $lease->start_date->format('d M Y') : 'Non défini' }}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">DATE DE FIN</div>
                        <div class="detail-value">{{ $lease->end_date ? $lease->end_date->format('d M Y') : 'Non défini' }}</div>
                    </div>
                </div>

                <div class="contract-footer">
                    <div>
                        @if($isPendingSignature)
                            <span class="status-badge status-pending">
                                <i data-lucide="clock" style="width:14px;height:14px;"></i>
                                En attente de signature
                            </span>
                        @elseif(!$hasValidDates)
                            <span class="status-badge status-pending">
                                <i data-lucide="alert-circle" style="width:14px;height:14px;"></i>
                                Dates non définies
                            </span>
                        @elseif($isActive)
                            <span class="status-badge status-active">
                                <i data-lucide="check" style="width:14px;height:14px;"></i>
                                Actif
                            </span>
                        @elseif($isPendingDate)
                            <span class="status-badge status-pending">
                                <i data-lucide="clock" style="width:14px;height:14px;"></i>
                                En attente de début
                            </span>
                        @elseif($isExpired)
                            <span class="status-badge status-expired">
                                <i data-lucide="x" style="width:14px;height:14px;"></i>
                                Expiré
                            </span>
                        @else
                            <span class="status-badge status-expired">
                                <i data-lucide="x" style="width:14px;height:14px;"></i>
                                Statut inconnu
                            </span>
                        @endif
                    </div>

                    <div class="contract-actions">

                        {{-- PDF --}}
                        <a href="{{ route('co-owner.leases.documents.download', $lease) }}"
                           class="action-btn btn-download"
                           title="Télécharger le contrat PDF">
                            <i data-lucide="download" style="width:14px;height:14px;"></i>
                            <span>PDF</span>
                        </a>

                        @if($isPendingSignature)

                            {{-- ✅ SIGNER : ouvre le modal de signature électronique --}}
                            @if(!$landlordSigned)
                                <button type="button"
                                        class="action-btn btn-sign"
                                        title="Signer électroniquement"
                                        onclick="openSignatureModal(
                                            '{{ $lease->uuid }}',
                                            '{{ addslashes('Contrat - ' . $lease->tenant->first_name . ' ' . $lease->tenant->last_name) }}',
                                            '{{ addslashes($lease->property->name ?? '') }}'
                                        )">
                                    <i data-lucide="pen-square" style="width:14px;height:14px;"></i>
                                    <span>Signer</span>
                                </button>
                            @endif

                            {{-- Upload --}}
                            <button type="button"
                                    class="action-btn btn-upload"
                                    title="Uploader un contrat signé"
                                    onclick="openUploadModal('{{ $lease->uuid }}', '{{ addslashes('Contrat - ' . $lease->tenant->first_name . ' ' . $lease->tenant->last_name) }}')">
                                <i data-lucide="upload" style="width:14px;height:14px;"></i>
                                <span>Upload</span>
                            </button>

                        @endif

                        {{-- Voir --}}
                        @if($hasSignedDoc)
                            <a href="{{ route('co-owner.leases.view-signed', $lease->uuid) }}"
                               class="action-btn btn-view"
                               target="_blank"
                               title="Voir le contrat signé"
                               onclick="this.href=this.href.split('?')[0]+'?api_token='+(localStorage.getItem('token')||'')">
                                <i data-lucide="eye" style="width:14px;height:14px;"></i>
                                <span>Voir</span>
                            </a>
                        @endif

                    </div>
                </div>

                <div class="contract-date">
                    Créé le {{ $lease->created_at ? $lease->created_at->format('d M Y') : 'Date inconnue' }}
                </div>

                {{-- Badge signature --}}
                @if($isPendingSignature)
                    <div class="signature-info">
                        <i data-lucide="file-signature" style="width:12px;height:12px;"></i>
                        @if($hasSignedDoc)
                            <span class="signature-badge signed">
                                <i data-lucide="file-text" style="width:10px;height:10px;"></i>
                                Signé (fichier)
                            </span>
                        @elseif($hasSigned)
                            <span class="signature-badge signed">
                                <i data-lucide="check" style="width:10px;height:10px;"></i>
                                Signé électroniquement
                            </span>
                        @elseif($landlordSigned)
                            <span class="signature-badge">
                                <i data-lucide="user-check" style="width:10px;height:10px;"></i>
                                Propriétaire signé
                            </span>
                        @elseif($tenantSigned)
                            <span class="signature-badge">
                                <i data-lucide="users" style="width:10px;height:10px;"></i>
                                Locataire signé
                            </span>
                        @endif
                    </div>
                @endif

            </div>
        @empty
            <div class="empty-state">
                <i data-lucide="file-text" style="width:64px;height:64px;color:#cbd5e1;"></i>
                <h3>Aucun contrat de bail</h3>
                <p>Vous n'avez pas encore créé de contrat de bail pour les biens qui vous sont délégués.</p>
                <a href="{{ route('co-owner.assign-property.create') }}" class="btn-new-lease">
                    <i data-lucide="plus" style="width:18px;height:18px;"></i>
                    Créer un contrat
                </a>
            </div>
        @endforelse
    </div>
</div>

{{-- =====================================================================
     MODAL SIGNATURE ÉLECTRONIQUE
     ===================================================================== --}}
<div id="signatureModal" class="sig-modal-overlay" style="display:none;" onclick="closeSignatureModal()">
    <div class="sig-modal-content" onclick="event.stopPropagation()">

        {{-- Header --}}
        <div class="sig-modal-header">
            <div class="sig-modal-title">
                <div class="sig-modal-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 22L10 14M14 2L22 10M16 8L6 18M18 6L8 16"/>
                    </svg>
                </div>
                <div>
                    <h3>Signer le contrat</h3>
                    <p id="sigModalSubtitle" class="sig-modal-subtitle"></p>
                </div>
            </div>
            <button class="sig-modal-close" onclick="closeSignatureModal()">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>

        {{-- Avertissement --}}
        <div class="sig-warning">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>En signant ce contrat, vous reconnaissez avoir lu et accepté toutes les conditions du bail. Cette action est irréversible.</p>
        </div>

        {{-- Zone de signature --}}
        <div class="sig-canvas-label">Dessinez votre signature ci-dessous</div>
        <div class="sig-canvas-container">
            <canvas id="lease-signature-pad"></canvas>
        </div>

        {{-- Actions canvas --}}
        <div class="sig-canvas-actions">
            <button class="sig-btn sig-btn-clear" onclick="clearLeaseSignature()">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Effacer
            </button>
            <div style="display:flex;gap:0.5rem;">
                <button class="sig-btn sig-btn-cancel" onclick="closeSignatureModal()">Annuler</button>
                <button class="sig-btn sig-btn-confirm" id="sigConfirmBtn" onclick="submitLeaseSignature(this)">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span id="sigConfirmText">Signer le contrat</span>
                </button>
            </div>
        </div>

    </div>
</div>

{{-- =====================================================================
     MODAL UPLOAD (inchangé)
     ===================================================================== --}}
<div id="uploadModal" class="upload-modal-overlay" style="display:none;" onclick="closeUploadModal()">
    <div class="upload-modal-content" onclick="event.stopPropagation()">
        <div class="upload-modal-header">
            <h3>Uploader un contrat signé</h3>
            <button class="upload-modal-close" onclick="closeUploadModal()">×</button>
        </div>
        <div class="upload-modal-body">
            <p style="margin-bottom:1rem;font-size:0.85rem;">
                Contrat : <strong id="modalContractTitle"></strong>
            </p>
            <p style="margin-bottom:0.5rem;font-size:0.8rem;color:#666;">
                Sélectionnez le fichier PDF signé :
            </p>
            <form id="uploadForm" method="POST" enctype="multipart/form-data">
                @csrf
                <input type="file" id="signedFileInput" name="signed_file" class="file-input" accept=".pdf" onchange="onFileSelected(this)">
                <p id="fileSelectedLabel" style="font-size:0.75rem;color:#70AE48;display:none;"></p>
                <div class="upload-modal-footer">
                    <button type="button" class="action-btn" onclick="closeUploadModal()" style="padding:0.5rem 1rem;">Annuler</button>
                    <button type="submit" id="uploadSubmitBtn" class="action-btn btn-upload" disabled style="padding:0.5rem 1rem;">Uploader</button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    /* ── LAYOUT ── */
    .leases-container { max-width:1400px; margin:0 auto; padding:2rem; background:#f8fafc; min-height:100vh; }

    .leases-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; gap:2rem; }
    .header-content h1 { font-size:2.5rem; font-weight:700; color:#1e293b; margin:0 0 0.5rem 0; }
    .subtitle { color:#64748b; font-size:1.125rem; line-height:1.5; margin:0; }

    .btn-new-lease { display:inline-flex; align-items:center; gap:0.5rem; background:#70AE48; color:white; padding:0.875rem 1.5rem; border-radius:50px; text-decoration:none; font-weight:600; font-size:1.125rem; border:none; cursor:pointer; transition:all 0.2s ease; white-space:nowrap; }
    .btn-new-lease:hover { background:#5a8f3a; transform:translateY(-1px); box-shadow:0 4px 12px rgba(112,174,72,0.3); }

    .filters-section { margin-bottom:2rem; }
    .filters-card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
    .filters-title { font-size:0.875rem; font-weight:700; color:#64748b; letter-spacing:0.05em; margin:0 0 1rem 0; text-transform:uppercase; }
    .filters-form { display:flex; flex-direction:column; gap:1rem; }
    .filter-row { display:flex; gap:1rem; align-items:center; width:100%; }

    .filter-select-wrapper { position:relative; flex:2; }
    .filter-select { width:100%; padding:0.75rem 1rem; padding-right:2.5rem; border:1px solid #d1d5db; border-radius:8px; font-size:1.125rem; color:#000; background:#fff; appearance:none; cursor:pointer; transition:border-color 0.2s; }
    .filter-select:focus { outline:none; border-color:#70AE48 !important; box-shadow:0 0 0 3px rgba(112,174,72,0.1); }
    .select-icon { position:absolute; right:1rem; top:50%; transform:translateY(-50%); width:16px; height:16px; color:#6b7280; pointer-events:none; }

    .search-input-wrapper { position:relative; flex:3; }
    .search-icon { position:absolute; left:1rem; top:50%; transform:translateY(-50%); width:16px; height:16px; color:#9ca3af; }
    .search-input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; border:1px solid #d1d5db; border-radius:8px; font-size:1.125rem; color:#374151; transition:border-color 0.2s; }
    .search-input:focus { outline:none; border-color:#70AE48; box-shadow:0 0 0 3px rgba(112,174,72,0.1); }
    .search-input::placeholder { color:#9ca3af; font-size:1rem; }

    .btn-display { display:inline-flex; align-items:center; gap:0.5rem; padding:0.75rem 1.25rem; border:1px solid #d1d5db; border-radius:8px; background:white; color:#374151; font-size:1rem; font-weight:500; cursor:pointer; transition:all 0.2s; white-space:nowrap; flex:1; }
    .btn-display:hover { background:#f9fafb; border-color:#9ca3af; }

    /* ── CARTES ── */
    .contracts-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(500px, 1fr)); gap:1.5rem; }
    .contract-card { background:white; border-radius:12px; border:1px solid #e2e8f0; padding:2rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s ease; display:flex; flex-direction:column; gap:0.9rem; }
    .contract-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); transform:translateY(-2px); }

    .contract-type { font-size:0.95rem; font-weight:700; color:#94a3b8; letter-spacing:0.05em; text-transform:uppercase; }
    .contract-title { font-size:1.3rem; font-weight:700; color:#1e293b; margin:0; }
    .contract-location { display:flex; align-items:center; gap:0.5rem; font-size:1.05rem; color:#64748b; margin-bottom:0.5rem; }

    .contract-details { display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; padding:1.2rem 0; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; }
    .detail-group { display:flex; flex-direction:column; gap:0.3rem; }
    .detail-label { font-size:0.925rem; font-weight:700; color:#94a3b8; letter-spacing:0.05em; }
    .detail-value { font-size:1.175rem; font-weight:600; color:#1e293b; }

    .contract-footer { display:flex; justify-content:space-between; align-items:center; padding-top:0.5rem; }

    .status-badge { display:inline-flex; align-items:center; gap:0.375rem; padding:0.4rem 0.8rem; border-radius:6px; font-size:0.9875rem; font-weight:600; }
    .status-active  { background:#dcfce7; color:#166534; }
    .status-pending { background:#fef3c7; color:#92400e; }
    .status-expired { background:#f3f4f6; color:#6b7280; }

    .contract-actions { display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end; }

    .action-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.3rem; padding:0.5rem 1rem; border-radius:6px; border:none; background:#f3f4f6; color:#374151; cursor:pointer; transition:all 0.2s; text-decoration:none; font-size:0.9rem; font-weight:500; }
    .action-btn:hover   { background:#e5e7eb; }
    .btn-download       { background:#70AE48; color:white; }
    .btn-download:hover { background:#5a8f3a; color:white; }
    .btn-sign           { background:#fef3c7; color:#92400e; }
    .btn-sign:hover     { background:#fde68a; }
    .btn-upload         { background:#dbeafe; color:#1e40af; }
    .btn-upload:hover   { background:#bfdbfe; }
    .btn-view           { background:#f3f4f6; color:#4b5563; }
    .btn-view:hover     { background:#e5e7eb; }

    .contract-date { font-size:0.925rem; color:#94a3b8; margin-top:0.25rem; }
    .signature-info { display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; color:#64748b; }
    .signature-badge { display:inline-flex; align-items:center; gap:0.2rem; font-size:0.75rem; color:#64748b; }
    .signature-badge.signed { color:#166534; }

    .empty-state { grid-column:1/-1; text-align:center; padding:3rem 2rem; background:white; border-radius:12px; border:2px dashed #e2e8f0; }
    .empty-state h3 { font-size:1.3rem; font-weight:600; color:#374151; margin:1rem 0 0.5rem 0; }
    .empty-state p  { color:#6b7280; font-size:1.125rem; margin-bottom:1.5rem; }

    /* ── MODAL SIGNATURE ── */
    .sig-modal-overlay {
        position: fixed; top:0; left:0; right:0; bottom:0;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        z-index: 500;
        padding: 1rem;
    }

    .sig-modal-content {
        background: white;
        border-radius: 20px;
        width: 100%;
        max-width: 560px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.2);
        overflow: hidden;
        animation: sigSlideUp 0.25s ease-out;
    }

    @keyframes sigSlideUp {
        from { opacity:0; transform:translateY(24px); }
        to   { opacity:1; transform:translateY(0); }
    }

    .sig-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 1.75rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .sig-modal-title {
        display: flex;
        align-items: center;
        gap: 0.875rem;
    }

    .sig-modal-icon {
        width: 44px; height: 44px;
        background: #f0f7eb;
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        color: #70AE48;
        flex-shrink: 0;
    }

    .sig-modal-title h3 {
        font-size: 1.2rem;
        font-weight: 700;
        color: #111827;
        margin: 0 0 0.2rem 0;
    }

    .sig-modal-subtitle {
        font-size: 0.85rem;
        color: #6b7280;
        margin: 0;
    }

    .sig-modal-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.4rem;
        border-radius: 8px;
        color: #6b7280;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .sig-modal-close:hover { background: #f3f4f6; }

    .sig-warning {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
        padding: 1rem 1.75rem;
        margin: 1.25rem 1.75rem 0;
        border-radius: 0 8px 8px 0;
    }

    .sig-warning p {
        font-size: 0.9rem;
        color: #92400e;
        margin: 0;
        line-height: 1.5;
    }

    .sig-canvas-label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
        padding: 1.25rem 1.75rem 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .sig-canvas-container {
        margin: 0 1.75rem;
        border: 2px dashed #d1d5db;
        border-radius: 12px;
        background: #fafafa;
        overflow: hidden;
        transition: border-color 0.2s;
    }
    .sig-canvas-container:hover { border-color: #70AE48; }

    #lease-signature-pad {
        width: 100%;
        height: 200px;
        display: block;
        background: white;
        cursor: crosshair;
        touch-action: none;
    }

    .sig-canvas-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.75rem 1.75rem;
    }

    .sig-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.65rem 1.2rem;
        border-radius: 10px;
        border: none;
        font-size: 0.925rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .sig-btn-clear {
        background: #f3f4f6;
        color: #6b7280;
        border: 1px solid #e5e7eb;
    }
    .sig-btn-clear:hover { background: #e5e7eb; }

    .sig-btn-cancel {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    .sig-btn-cancel:hover { background: #f9fafb; }

    .sig-btn-confirm {
        background: #70AE48;
        color: white;
        border: none;
        box-shadow: 0 2px 8px rgba(112,174,72,0.3);
    }
    .sig-btn-confirm:hover:not(:disabled) { background: #5a8f3a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(112,174,72,0.35); }
    .sig-btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* ── MODAL UPLOAD (inchangé) ── */
    .upload-modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:500; }
    .upload-modal-content { background:white; border-radius:12px; padding:1.5rem; max-width:500px; width:90%; max-height:90vh; overflow-y:auto; }
    .upload-modal-header  { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .upload-modal-header h3 { margin:0; font-size:1.1rem; font-weight:600; }
    .upload-modal-close   { background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b; line-height:1; }
    .upload-modal-body    { margin-bottom:0.5rem; }
    .upload-modal-footer  { display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem; }
    .file-input { width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px; margin-bottom:0.5rem; font-size:0.85rem; }

    @media (max-width:768px) {
        .leases-container  { padding:1rem; }
        .leases-header     { flex-direction:column; align-items:stretch; }
        .contracts-grid    { grid-template-columns:1fr; }
        .filter-row        { flex-direction:column; gap:0.75rem; }
        .btn-display       { width:100%; justify-content:center; }
        .header-content h1 { font-size:2rem; }
        .subtitle          { font-size:1rem; }
        .contract-actions  { flex-wrap:wrap; }
        .sig-modal-content { border-radius:16px; }
        .sig-canvas-actions { flex-direction:column-reverse; gap:0.75rem; align-items:stretch; }
        .sig-btn-clear { width:100%; justify-content:center; }
        .sig-canvas-actions > div { display:flex; gap:0.5rem; }
        .sig-canvas-actions > div .sig-btn { flex:1; justify-content:center; }
    }
</style>

<script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>
<script>
    // ── Lucide ──
    function initLucide() {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        else setTimeout(initLucide, 100);
    }
    document.addEventListener('DOMContentLoaded', initLucide);

    // ── SignaturePad pour le bail ──
    let leaseSignaturePad = null;
    let currentLeaseUuid  = null;

    document.addEventListener('DOMContentLoaded', function () {
        const canvas = document.getElementById('lease-signature-pad');
        if (!canvas) return;

        leaseSignaturePad = new SignaturePad(canvas, {
            penColor: '#111827',
            backgroundColor: 'rgb(255,255,255)',
        });

        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            canvas.width  = w * ratio;
            canvas.height = h * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
            leaseSignaturePad.clear();
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    });

    // ── Ouvrir modal signature ──
function openSignatureModal(uuid, contractTitle, propertyName) {
    currentLeaseUuid = uuid;

    document.getElementById('sigModalSubtitle').textContent =
        contractTitle + (propertyName ? ' — ' + propertyName : '');

    document.getElementById('signatureModal').style.display = 'flex';

    // ✅ FIX : redimensionner le canvas APRÈS que le modal soit visible
    setTimeout(function () {
        const canvas = document.getElementById('lease-signature-pad');
        if (!canvas || !leaseSignaturePad) return;

        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width  = canvas.offsetWidth  * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        leaseSignaturePad.clear();
    }, 50);

    document.getElementById('sigConfirmText').textContent = 'Signer le contrat';
    document.getElementById('sigConfirmBtn').disabled = false;
}

    // ── Fermer modal signature ──
    function closeSignatureModal() {
        document.getElementById('signatureModal').style.display = 'none';
        currentLeaseUuid = null;
        if (leaseSignaturePad) leaseSignaturePad.clear();
    }

    // ── Effacer la signature ──
    function clearLeaseSignature() {
        if (leaseSignaturePad) leaseSignaturePad.clear();
    }

    // ── Soumettre la signature ──
    async function submitLeaseSignature(btn) {
        if (!leaseSignaturePad || leaseSignaturePad.isEmpty()) {
            alert('Veuillez dessiner votre signature avant de valider.');
            return;
        }

        if (!currentLeaseUuid) {
            alert('Erreur : contrat introuvable.');
            return;
        }

        // Feedback visuel
        btn.disabled = true;
        document.getElementById('sigConfirmText').textContent = 'Signature en cours…';

        const token = localStorage.getItem('token') || '';

        try {
            const response = await fetch('/coproprietaire/leases/' + currentLeaseUuid + '/sign-electronic?api_token=' + token, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]') ?
                        document.querySelector('meta[name="csrf-token"]').getAttribute('content') : '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    signature: leaseSignaturePad.toDataURL('image/png'),
                })
            });

            const data = await response.json();

            if (data.success) {
                closeSignatureModal();
                // Afficher un message de succès et recharger
                showToast(data.message || 'Contrat signé avec succès !', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast(data.error || 'Erreur lors de la signature.', 'error');
                btn.disabled = false;
                document.getElementById('sigConfirmText').textContent = 'Signer le contrat';
            }

        } catch (err) {
            console.error(err);
            showToast('Erreur de connexion. Veuillez réessayer.', 'error');
            btn.disabled = false;
            document.getElementById('sigConfirmText').textContent = 'Signer le contrat';
        }
    }

    // ── Toast notification ──
    function showToast(message, type) {
        const existing = document.getElementById('lease-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'lease-toast';
        toast.style.cssText = `
            position:fixed; bottom:2rem; right:2rem; z-index:9999;
            padding:1rem 1.5rem; border-radius:12px; font-size:0.95rem; font-weight:600;
            box-shadow:0 8px 24px rgba(0,0,0,0.15); max-width:360px;
            animation:toastIn 0.3s ease-out;
            background:${type === 'success' ? '#ecfdf5' : '#fef2f2'};
            color:${type === 'success' ? '#065f46' : '#991b1b'};
            border-left:4px solid ${type === 'success' ? '#10b981' : '#ef4444'};
        `;
        toast.textContent = message;

        const style = document.createElement('style');
        style.textContent = '@keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }';
        document.head.appendChild(style);

        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
    }

    // ── Fermer modal signature avec Echap ──
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeSignatureModal();
    });

    // ── Modal Upload (inchangé) ──
    function openUploadModal(uuid, title) {
        var token = localStorage.getItem('token') || '';
        document.getElementById('modalContractTitle').textContent = title;
        document.getElementById('uploadForm').action = '/coproprietaire/leases/' + uuid + '/upload-signed?api_token=' + token;
        document.getElementById('signedFileInput').value = '';
        document.getElementById('fileSelectedLabel').style.display = 'none';
        document.getElementById('uploadSubmitBtn').disabled = true;
        document.getElementById('uploadModal').style.display = 'flex';
    }

    function closeUploadModal() {
        document.getElementById('uploadModal').style.display = 'none';
    }

    function onFileSelected(input) {
        var label = document.getElementById('fileSelectedLabel');
        var btn   = document.getElementById('uploadSubmitBtn');
        if (input.files && input.files[0]) {
            label.textContent = 'Fichier sélectionné : ' + input.files[0].name;
            label.style.display = 'block';
            btn.disabled = false;
        } else {
            label.style.display = 'none';
            btn.disabled = true;
        }
    }
</script>
@endsection
