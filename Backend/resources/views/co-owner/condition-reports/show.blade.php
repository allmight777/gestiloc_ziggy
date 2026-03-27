@extends('layouts.co-owner')

@section('title', 'État des lieux')

@section('content')
<style>
    /* ===== VOTRE STYLE EXISTANT (inchangé) ===== */
    :root {
        --primary: #70AE48;
        --primary-dark: #5a8f3a;
        --primary-light: #f0f7eb;
        --gray-50: #f9fafb;
        --gray-100: #f3f4f6;
        --gray-200: #e5e7eb;
        --gray-300: #d1d5db;
        --gray-400: #9ca3af;
        --gray-500: #6b7280;
        --gray-600: #4b5563;
        --gray-700: #374151;
        --gray-800: #1f2937;
        --gray-900: #111827;
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        --radius-sm: 0.375rem;
        --radius: 0.5rem;
        --radius-md: 0.75rem;
        --radius-lg: 1rem;
    }

    .page-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .page-title {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .page-title-icon {
        width: 3rem;
        height: 3rem;
        background: var(--primary-light);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary);
    }

    .page-title-icon svg {
        width: 1.5rem;
        height: 1.5rem;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
    }

    .page-title h1 {
        font-size: 2rem;
        font-weight: 700;
        color: var(--gray-900);
        margin: 0;
        letter-spacing: -0.02em;
    }

    .page-title .badge {
        background: var(--gray-100);
        color: var(--gray-600);
        font-size: 0.875rem;
        font-weight: 600;
        padding: 0.35rem 1rem;
        border-radius: 2rem;
        margin-left: 0.75rem;
    }

    .page-actions {
        display: flex;
        gap: 0.75rem;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.625rem;
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius);
        font-size: 0.95rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        border: none;
        line-height: 1;
        white-space: nowrap;
    }

    .btn svg {
        width: 1.125rem;
        height: 1.125rem;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
    }

    .btn-primary {
        background: var(--primary);
        color: white;
        box-shadow: 0 2px 4px rgba(112, 174, 72, 0.2);
    }

    .btn-primary:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(112, 174, 72, 0.3);
    }

    .btn-outline {
        background: white;
        border: 1px solid var(--gray-200);
        color: var(--gray-700);
    }

    .btn-outline:hover {
        background: var(--gray-50);
        border-color: var(--gray-300);
    }

    .btn-outline-primary {
        background: white;
        border: 1px solid var(--gray-200);
        color: var(--primary);
    }

    .btn-outline-primary:hover {
        background: var(--primary-light);
        border-color: var(--primary);
    }

    .btn-outline-danger {
        background: white;
        border: 1px solid var(--gray-200);
        color: #dc2626;
    }

    .btn-outline-danger:hover {
        background: #fef2f2;
        border-color: #fecaca;
    }

    .btn-lg {
        padding: 0.875rem 2rem;
        font-size: 1rem;
    }

    .btn-lg svg {
        width: 1.25rem;
        height: 1.25rem;
    }

    .btn-block {
        width: 100%;
    }

    .card {
        background: white;
        border-radius: var(--radius-lg);
        border: 1px solid var(--gray-200);
        overflow: hidden;
        margin-bottom: 1.5rem;
        box-shadow: var(--shadow);
    }

    .card-header {
        padding: 1.5rem 2rem;
        border-bottom: 1px solid var(--gray-200);
        background: white;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .card-header svg {
        width: 1.25rem;
        height: 1.25rem;
        stroke: var(--primary);
        stroke-width: 2;
        fill: none;
    }

    .card-header h2 {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--gray-800);
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .card-header .badge {
        margin-left: auto;
        background: var(--gray-100);
        color: var(--gray-600);
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 1rem;
        border-radius: 2rem;
    }

    .card-body {
        padding: 2rem;
    }

    .grid-2 {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
    }

    @media (max-width: 1024px) {
        .grid-2 {
            grid-template-columns: 1fr;
        }
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-label {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--gray-500);
        text-transform: uppercase;
        letter-spacing: 0.025em;
    }

    .info-value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--gray-900);
        line-height: 1.4;
    }

    .info-value-lg {
        font-size: 1.25rem;
        font-weight: 700;
    }

    .info-note {
        margin-top: 1.5rem;
        padding: 1.25rem;
        background: var(--gray-50);
        border-radius: var(--radius);
        font-size: 1rem;
        color: var(--gray-700);
        border-left: 4px solid var(--primary);
        line-height: 1.6;
    }

    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1;
    }

    .status-badge svg {
        width: 1rem;
        height: 1rem;
        stroke: currentColor;
        stroke-width: 2.5;
        fill: none;
    }

    .status-badge.success {
        background: #ecfdf5;
        color: #059669;
    }

    .status-badge.warning {
        background: #fffbeb;
        color: #d97706;
    }

    .status-badge.entry {
        background: #ecfdf5;
        color: #059669;
    }

    .status-badge.exit {
        background: #fef2f2;
        color: #dc2626;
    }

    .status-badge.intermediate {
        background: #eff6ff;
        color: #2563eb;
    }

    .signature-box {
        background: var(--primary-light);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        border: 1px solid rgba(112, 174, 72, 0.2);
    }

    .signature-box svg {
        width: 2rem;
        height: 2rem;
        stroke: var(--primary);
        stroke-width: 2;
        fill: none;
    }

    .signature-content {
        flex: 1;
    }

    .signature-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--primary-dark);
        margin-bottom: 0.25rem;
    }

    .signature-date {
        font-size: 0.9rem;
        color: var(--gray-600);
    }

    .signature-pending {
        background: var(--gray-50);
        border-radius: var(--radius-lg);
        padding: 2rem;
        text-align: center;
        border: 2px dashed var(--gray-300);
    }

    .signature-pending svg {
        width: 3rem;
        height: 3rem;
        stroke: var(--gray-400);
        stroke-width: 1.5;
        margin-bottom: 1rem;
    }

    .signature-pending h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--gray-700);
        margin-bottom: 0.5rem;
    }

    .signature-pending p {
        color: var(--gray-500);
        margin-bottom: 1.5rem;
        font-size: 1rem;
    }

    .actions-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .actions-list .btn {
        width: 100%;
        justify-content: flex-start;
        padding: 1rem 1.5rem;
        font-size: 1rem;
    }

    .photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .photo-card {
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all 0.2s ease;
    }

    .photo-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
    }

    .photo-image {
        height: 220px;
        background: var(--gray-100);
        position: relative;
        overflow: hidden;
    }

    .photo-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .photo-overlay {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(4px);
        padding: 0.5rem;
        border-radius: 2rem;
        box-shadow: var(--shadow);
    }

    .photo-info {
        padding: 1.25rem;
    }

    .photo-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--gray-800);
        margin-bottom: 0.75rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .photo-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .photo-notes {
        font-size: 0.9rem;
        color: var(--gray-600);
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--gray-200);
        line-height: 1.5;
    }

    .photo-notes svg {
        width: 0.875rem;
        height: 0.875rem;
        margin-right: 0.375rem;
        stroke: var(--primary);
    }

    .empty-gallery {
        text-align: center;
        padding: 4rem 2rem;
        background: var(--gray-50);
        border-radius: var(--radius-lg);
    }

    .empty-gallery svg {
        width: 4rem;
        height: 4rem;
        stroke: var(--gray-300);
        stroke-width: 1.5;
        margin-bottom: 1.5rem;
    }

    .empty-gallery p {
        color: var(--gray-500);
        margin-bottom: 1.5rem;
        font-size: 1.1rem;
    }

    .signature-canvas-container {
        border: 2px dashed var(--gray-300);
        border-radius: var(--radius);
        padding: 1rem;
        background: white;
        margin-bottom: 1rem;
    }

    #signature-pad {
        width: 100%;
        height: 200px;
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-sm);
    }

    @media (max-width: 768px) {
        .page-container {
            padding: 1rem;
        }

        .page-header {
            flex-direction: column;
            align-items: flex-start;
        }

        .page-actions {
            width: 100%;
            flex-direction: column;
        }

        .page-actions .btn {
            width: 100%;
            justify-content: center;
        }

        .info-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .photo-grid {
            grid-template-columns: 1fr;
        }

        .signature-box {
            flex-direction: column;
            text-align: center;
        }
    }
</style>

<div class="page-container">
    <!-- Header -->
    <div class="page-header">
        <div class="page-title">
            <div class="page-title-icon">
                <svg viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
            </div>
            <h1>
                État des lieux
                <span class="badge">#{{ str_pad($report->id, 6, '0', STR_PAD_LEFT) }}</span>
            </h1>
        </div>
        <div class="page-actions">
            <a href="{{ route('co-owner.condition-reports.download', $report->id) }}" class="btn btn-outline-primary">
                <svg viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger PDF
            </a>
            <a href="{{ route('co-owner.condition-reports.index') }}" class="btn btn-outline">
                <svg viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Retour
            </a>
        </div>
    </div>

    <!-- Grille principale -->
    <div class="grid-2">
        <!-- Colonne gauche : Informations -->
        <div>
            <!-- Carte informations générales -->
            <div class="card">
                <div class="card-header">
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <h2>Informations générales</h2>
                </div>
                <div class="card-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Date de l'état des lieux</span>
                            <span class="info-value">{{ \Carbon\Carbon::parse($report->report_date)->format('d/m/Y') }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Type</span>
                            <span class="status-badge {{ $report->type }}">
                                @if($report->type == 'entry')
                                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    État des lieux d'entrée
                                @elseif($report->type == 'exit')
                                    <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                    État des lieux de sortie
                                @else
                                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                    État des lieux intermédiaire
                                @endif
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Bien concerné</span>
                            <span class="info-value">{{ $report->property->name ?? 'Non spécifié' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Adresse du bien</span>
                            <span class="info-value">{{ $report->property->address ?? 'Non spécifiée' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Bail associé</span>
                            <span class="info-value">#{{ str_pad($report->lease_id, 6, '0', STR_PAD_LEFT) }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Locataire</span>
                            <span class="info-value">
                                {{ $report->lease->tenant->first_name ?? '' }} {{ $report->lease->tenant->last_name ?? 'Non spécifié' }}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Créé par</span>
                            <span class="info-value">{{ $report->creator->name ?? 'Utilisateur' }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Créé le</span>
                            <span class="info-value">{{ \Carbon\Carbon::parse($report->created_at)->format('d/m/Y à H:i') }}</span>
                        </div>
                    </div>

                    @if($report->notes)
                    <div class="info-note">
                        <svg viewBox="0 0 24 24" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5 5 5-5M12 14V3"/>
                        </svg>
                        <strong>Notes :</strong> {{ $report->notes }}
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Colonne droite : Actions et Signature -->
        <div>
            <!-- Carte signature -->
            <div class="card">
                <div class="card-header">
                    <svg viewBox="0 0 24 24">
                        <path d="M2 22L10 14M14 2L22 10M16 8L6 18M18 6L8 16"/>
                    </svg>
                    <h2>Signature</h2>
                    @if($report->signed_at)
                        <span class="badge" style="background: #ecfdf5; color: #059669;">Signé</span>
                    @else
                        <span class="badge" style="background: #fffbeb; color: #d97706;">En attente</span>
                    @endif
                </div>
                <div class="card-body">
                    @if($report->signed_at)
                        <!-- Déjà signé -->
                        <div class="signature-box">
                            <svg viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <div class="signature-content">
                                <div class="signature-title">Document signé</div>
                          
                            </div>
                        </div>
                    @else
                        <!-- En attente de signature -->
                        <div class="signature-pending">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <h3>État des lieux en attente de signature</h3>
                            <p>Signez ce document pour finaliser l'état des lieux. Une fois signé, il ne pourra plus être modifié.</p>

                           <div class="signature-canvas-container">
    <canvas id="signature-pad"></canvas>

    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.8rem;">

        <button
            class="btn btn-outline"
            onclick="clearSignature()"
            style="font-size: 13px; padding: 6px 10px; display: flex; align-items: center; gap: 5px;"
        >
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Effacer
        </button>

        <button
            class="btn btn-primary"
            onclick="submitSignature(this)"
            style="font-size: 13px; padding: 6px 10px; display: flex; align-items: center; gap: 5px;"
        >
            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Signer
        </button>

    </div>
</div>

                            <div style="position: relative; text-align: center; margin: 1rem 0;">
                                <span style="background: white; padding: 0 1rem; color: var(--gray-400); font-size: 0.9rem;">OU</span>
                                <hr style="border: none; border-top: 1px solid var(--gray-200); margin: -0.7rem 0 0 0;">
                            </div>

                            <!-- Upload PDF -->
                            <form action="{{ route('co-owner.condition-reports.upload-signed', $report->id) }}" method="POST" enctype="multipart/form-data">
                                @csrf
                                <div style="display: flex; gap: 1rem;">
                                    <input type="file" name="signed_file" class="form-control" accept=".pdf" required style="flex: 1;">
                                    <button
    type="submit"
    class="btn btn-primary"
    style="font-size: 13px; padding: 6px 10px; display: flex; align-items: center; gap: 5px;"
>
    <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    Uploader
</button>
                                </div>
                                <p style="font-size: 0.85rem; color: var(--gray-500); margin-top: 0.5rem; text-align: left;">
                                    PDF uniquement (max 10 Mo)
                                </p>
                            </form>
                        </div>
                    @endif
                </div>
            </div>

            <!-- Carte actions -->
            <div class="card">
                <div class="card-header">
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82L12 22zM12 2v5"/>
                    </svg>
                    <h2>Actions</h2>
                </div>
                <div class="card-body">
                    <div class="actions-list">
                        <a href="{{ route('co-owner.condition-reports.download', $report->id) }}" class="btn btn-outline-primary">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Télécharger le PDF
                        </a>

                        @if(!$report->signed_at)
                        <form action="{{ route('co-owner.condition-reports.destroy', $report->id) }}" method="POST" style="display: contents;">
                            @csrf @method('DELETE')
                            <button type="submit" class="btn btn-outline-danger" onclick="return confirm('Êtes-vous sûr de vouloir supprimer cet état des lieux ?')">
                                <svg viewBox="0 0 24 24">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Supprimer
                            </button>
                        </form>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Galerie photos -->
    <div class="card">
        <div class="card-header">
            <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
            <h2>Photos et constats</h2>
            <span class="badge">{{ $report->photos->count() }} photo(s)</span>
        </div>
        <div class="card-body">
            @if($report->photos->isEmpty())
                <div class="empty-gallery">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>Aucune photo</p>
                    @if(!$report->signed_at)
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addPhotosModal">
                        <svg viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Ajouter des photos
                    </button>
                    @endif
                </div>
            @else
                <div class="photo-grid">
                    @foreach($report->photos as $photo)
                    <div class="photo-card">
                        <div class="photo-image">
                            <img src="{{ Storage::url($photo->path) }}" alt="">
                            <div class="photo-overlay">
                                <span class="status-badge {{ $photo->condition_status }}">
                                    @if($photo->condition_status == 'good')
                                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                                    @elseif($photo->condition_status == 'satisfactory')
                                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    @elseif($photo->condition_status == 'poor')
                                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    @else
                                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                    @endif
                                </span>
                            </div>
                        </div>
                        <div class="photo-info">
                            <div class="photo-name">{{ $photo->original_filename }}</div>
                            @if($photo->condition_notes)
                            <div class="photo-notes">{{ $photo->condition_notes }}</div>
                            @endif
                        </div>
                    </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</div>



<script src="https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js"></script>
<script>
// Définir les variables globales
let signaturePad;
let photoCount = 0;

// Fonctions globales
function clearSignature() {
    if (signaturePad) signaturePad.clear();
}

async function submitSignature() {
    if (!signaturePad || signaturePad.isEmpty()) {
        alert('Veuillez signer');
        return;
    }

    try {
        const response = await fetch('{{ route("co-owner.condition-reports.sign", $report->id) }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}'
            },
            body: JSON.stringify({ signature: signaturePad.toDataURL() })
        });

        const data = await response.json();
        if (data.success) {
            alert('Signé avec succès !');
            location.reload();
        } else {
            alert('Erreur: ' + (data.error || 'Inconnue'));
        }
    } catch (error) {
        alert('Erreur de connexion');
    }
}

function addPhotoField() {
    const container = document.getElementById('photos-container');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'mb-3 p-3 border rounded';
    div.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <strong>Photo ${++photoCount}</strong>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <input type="file" name="photos[]" class="form-control mb-2" accept="image/*" required>
        <select name="condition_statuses[]" class="form-select mb-2">
            <option value="good">Bon</option>
            <option value="satisfactory">Correct</option>
            <option value="poor">Mauvais</option>
            <option value="damaged">Abîmé</option>
        </select>
        <input type="text" name="condition_notes[]" class="form-control" placeholder="Notes">
    `;
    container.appendChild(div);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('signature-pad');
    if (canvas) {
        signaturePad = new SignaturePad(canvas);
        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
            signaturePad.clear();
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
    }

    const modal = document.getElementById('addPhotosModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', function() {
            document.getElementById('photos-container').innerHTML = '';
            photoCount = 0;
            addPhotoField();
        });
    }
});
</script>
@endsection
