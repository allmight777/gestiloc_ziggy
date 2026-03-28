@extends('layouts.co-owner')

@section('title', 'Détails du préavis - Co-propriétaire')

@section('content')
<div class="content-container">
    <div class="content-card">
        <div class="content-body">
            <!-- Header avec actions -->
            <div class="header-actions">
                <a href="{{ route('co-owner.notices.index') }}" class="btn btn-outline">
                    <i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i>
                    Retour
                </a>
                <div class="actions-group">
                    <a href="{{ route('co-owner.notices.edit', $notice) }}" class="btn btn-outline">
                        <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
                        Modifier
                    </a>
                    <form action="{{ route('co-owner.notices.destroy', $notice) }}" method="POST"
                        onsubmit="return confirm('Supprimer définitivement ce préavis ?');" style="display: inline;">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-danger">
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                            Supprimer
                        </button>
                    </form>
                </div>
            </div>

            <!-- Alertes -->
            @if (session('success'))
                <div class="alert alert-success">
                    <i data-lucide="check-circle" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
                    <div>
                        <strong>Succès</strong>
                        <p>{{ session('success') }}</p>
                    </div>
                </div>
            @endif

            @if (session('error'))
                <div class="alert alert-error">
                    <i data-lucide="alert-circle" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
                    <div>
                        <strong>Erreur</strong>
                        <p>{{ session('error') }}</p>
                    </div>
                </div>
            @endif

            <!-- En-tête du préavis -->
            <div class="notice-header">
                <div>
                    <h1 class="notice-title">{{ $notice->property->address ?? 'Bien sans nom' }}</h1>
                    <p class="notice-ref">NOTICE-{{ str_pad($notice->id, 6, '0', STR_PAD_LEFT) }}</p>
                </div>
                <span class="badge badge-{{ $notice->status }}">
                    @if ($notice->status == 'pending')
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i> En attente
                    @elseif($notice->status == 'confirmed')
                        <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Confirmé
                    @else
                        <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i> Annulé
                    @endif
                </span>
            </div>

            <!-- Grille d'informations -->
            <div class="info-grid">
                <!-- Carte Informations générales -->
                <div class="info-card">
                    <div class="info-card-header">
                        <i data-lucide="info" style="width: 18px; height: 18px;"></i>
                        <h3>Informations générales</h3>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">Type de préavis</span>
                            <span class="info-value">
                                @if ($notice->type == 'landlord')
                                    <i data-lucide="home" style="width: 14px; height: 14px;"></i> Préavis bailleur
                                @else
                                    <i data-lucide="user" style="width: 14px; height: 14px;"></i> Préavis locataire
                                @endif
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date du préavis</span>
                            <span class="info-value">
                                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                                {{ \Carbon\Carbon::parse($notice->notice_date)->format('d/m/Y') }}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date de fin</span>
                            <span class="info-value">
                                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
                                {{ \Carbon\Carbon::parse($notice->end_date)->format('d/m/Y') }}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Créé le</span>
                            <span class="info-value">
                                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                                {{ $notice->created_at->format('d/m/Y H:i') }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Carte Informations du bien -->
                <div class="info-card">
                    <div class="info-card-header">
                        <i data-lucide="home" style="width: 18px; height: 18px;"></i>
                        <h3>Informations du bien</h3>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">Adresse</span>
                            <span class="info-value">{{ $notice->property->address ?? 'Non spécifié' }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Ville</span>
                            <span class="info-value">{{ $notice->property->city ?? 'Non spécifié' }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Code postal</span>
                            <span class="info-value">{{ $notice->property->zip_code ?? 'Non spécifié' }}</span>
                        </div>
                    </div>
                </div>

                <!-- Carte Locataire concerné -->
                <div class="info-card">
                    <div class="info-card-header">
                        <i data-lucide="user" style="width: 18px; height: 18px;"></i>
                        <h3>Locataire concerné</h3>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">Nom</span>
                            <span class="info-value">
                                {{ trim(($notice->tenant->first_name ?? '') . ' ' . ($notice->tenant->last_name ?? '')) ?: 'Non spécifié' }}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email</span>
                            <span class="info-value">{{ $notice->tenant->user->email ?? 'Non spécifié' }}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Téléphone</span>
                            <span class="info-value">{{ $notice->tenant->user->phone ?? 'Non spécifié' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section Motif -->
            <div class="detail-section">
                <div class="detail-section-header">
                    <i data-lucide="message-square" style="width: 18px; height: 18px;"></i>
                    <h3>Motif du préavis</h3>
                </div>
                <div class="detail-section-content">
                    {{ $notice->reason }}
                </div>
            </div>

            <!-- Section Notes (si existantes) -->
            @if ($notice->notes)
                <div class="detail-section">
                    <div class="detail-section-header">
                        <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
                        <h3>Notes additionnelles</h3>
                    </div>
                    <div class="detail-section-content">
                        {{ $notice->notes }}
                    </div>
                </div>
            @endif

            <!-- Actions sur le statut (si en attente) -->
            @if ($notice->status == 'pending')
                <div class="status-actions-section">
                    <div class="status-actions-header">
                        <i data-lucide="settings" style="width: 18px; height: 18px;"></i>
                        <h3>Gérer le statut</h3>
                    </div>
                    <div class="status-actions">
                        <form action="{{ route('co-owner.notices.update-status', $notice) }}" method="POST"
                            class="status-form">
                            @csrf
                            <input type="hidden" name="status" value="confirmed">
                            <button type="submit" class="btn btn-success"
                                onclick="return confirm('Confirmer ce préavis ?')">
                                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Confirmer le préavis
                            </button>
                        </form>
                        <form action="{{ route('co-owner.notices.update-status', $notice) }}" method="POST"
                            class="status-form">
                            @csrf
                            <input type="hidden" name="status" value="cancelled">
                            <button type="submit" class="btn btn-danger"
                                onclick="return confirm('Annuler ce préavis ?')">
                                <i data-lucide="x-circle" style="width: 16px; height: 16px;"></i> Annuler le préavis
                            </button>
                        </form>
                    </div>
                </div>
            @endif
        </div>
    </div>
</div>

<style>
    :root {
        --primary: #70AE48;
        --primary-light: #8BC34A;
        --primary-dark: #5a8f3a;
        --primary-soft: rgba(112, 174, 72, 0.1);
        --success: #10b981;
        --danger: #ef4444;
        --warning: #f59e0b;
        --ink: #1e293b;
        --muted: #64748b;
        --muted-light: #94a3b8;
        --border: #e2e8f0;
        --bg-soft: #f8fafc;
        --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
        --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .content-container {
        min-height: 100vh;
        background: #f8fafc;
        padding: 3rem;
    }

    .content-card {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        border-radius: 24px;
        box-shadow: var(--shadow-lg);
        overflow: hidden;
    }

    .content-body {
        padding: 3rem;
    }

    /* Header Actions */
    .header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .actions-group {
        display: flex;
        gap: 1.25rem;
    }

    /* Boutons */
    .btn {
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1.05rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        text-decoration: none;
    }

    .btn-outline {
        background: white;
        color: var(--ink);
        border: 1px solid var(--border);
    }

    .btn-outline:hover {
        background: var(--bg-soft);
        border-color: var(--primary);
        color: var(--primary);
    }

    .btn-danger {
        background: white;
        color: var(--danger);
        border: 1px solid var(--border);
    }

    .btn-danger:hover {
        background: rgba(239, 68, 68, 0.05);
        border-color: var(--danger);
    }

    .btn-success {
        background: var(--primary);
        color: white;
        border: 1px solid var(--primary);
    }

    .btn-success:hover {
        background: var(--primary-dark);
    }

    /* Alertes */
    .alert {
        border-radius: 14px;
        padding: 2rem;
        margin-bottom: 2.5rem;
        border: 1px solid;
        display: flex;
        align-items: flex-start;
        gap: 1.25rem;
    }

    .alert-success {
        background: rgba(112, 174, 72, 0.05);
        border-color: rgba(112, 174, 72, 0.2);
        color: var(--primary-dark);
    }

    .alert-error {
        background: rgba(239, 68, 68, 0.05);
        border-color: rgba(239, 68, 68, 0.2);
        color: #991b1b;
    }

    .alert p {
        margin-top: 0.25rem;
        font-size: 1.05rem;
        font-weight: 500;
    }

    /* En-tête préavis */
    .notice-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px solid var(--border);
    }

    .notice-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--ink);
        margin: 0 0 0.25rem 0;
    }

    .notice-ref {
        font-size: 1.05rem;
        color: var(--muted);
        font-weight: 500;
    }

    /* Badges */
    .badge {
        padding: 0.5rem 1.25rem;
        border-radius: 100px;
        font-size: 1.2rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 1rem;
    }

    .badge-pending {
        background: rgba(245, 158, 11, 0.1);
        color: #b45309;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .badge-confirmed {
        background: rgba(112, 174, 72, 0.1);
        color: var(--primary-dark);
        border: 1px solid rgba(112, 174, 72, 0.2);
    }

    .badge-cancelled {
        background: rgba(100, 116, 139, 0.1);
        color: var(--muted);
        border: 1px solid rgba(100, 116, 139, 0.2);
    }

    /* Grille d'informations */
    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;
        margin-bottom: 3rem;
    }

    /* Cartes d'information */
    .info-card {
        background: white;
        border: 1px solid var(--border);
        border-radius: 20px;
        overflow: hidden;
        transition: all 0.2s ease;
    }

    .info-card:hover {
        box-shadow: var(--shadow-md);
        border-color: var(--primary);
    }

    .info-card-header {
        background: linear-gradient(135deg, var(--primary-soft) 0%, rgba(139, 195, 74, 0.05) 100%);
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        border-bottom: 1px solid var(--border);
    }

    .info-card-header i {
        color: var(--primary);
    }

    .info-card-header h3 {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--primary-dark);
        margin: 0;
    }

    .info-card-content {
        padding: 2rem;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 0.75rem 0;
        border-bottom: 1px dashed var(--border);
    }

    .info-row:last-child {
        border-bottom: none;
    }

    .info-label {
        font-size: 1.2rem;
        font-weight: 500;
        color: var(--muted);
    }

    .info-value {
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--ink);
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .info-value i {
        color: var(--primary);
    }

    /* Sections de détail */
    .detail-section {
        margin-bottom: 3rem;
        background: white;
        border: 1px solid var(--border);
        border-radius: 20px;
        overflow: hidden;
    }

    .detail-section-header {
        background: linear-gradient(135deg, var(--primary-soft) 0%, rgba(139, 195, 74, 0.05) 100%);
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        border-bottom: 1px solid var(--border);
    }

    .detail-section-header i {
        color: var(--primary);
    }

    .detail-section-header h3 {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--primary-dark);
        margin: 0;
    }

    .detail-section-content {
        padding: 2.5rem;
        font-size: 1.15rem;
        line-height: 1.6;
        color: var(--ink);
        background: white;
        white-space: pre-line;
    }

    /* Section actions statut */
    .status-actions-section {
        margin-top: 2.5rem;
        background: var(--primary-soft);
        border: 1px solid rgba(112, 174, 72, 0.2);
        border-radius: 20px;
        overflow: hidden;
    }

    .status-actions-header {
        padding: 2rem;
        display: flex;
        align-items: center;
        gap: 1.25rem;
    }

    .status-actions-header i {
        color: var(--primary);
    }

    .status-actions-header h3 {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--primary-dark);
        margin: 0;
    }

    .status-actions {
        padding: 2rem;
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    .status-form {
        display: inline;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .content-container {
            padding: 1.5rem;
        }

        .content-body {
            padding: 2.5rem;
        }

        .header-actions {
            flex-direction: column;
            align-items: stretch;
        }

        .actions-group {
            justify-content: flex-end;
        }

        .notice-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.5rem;
        }

        .notice-title {
            font-size: 2rem;
        }

        .info-grid {
            grid-template-columns: 1fr;
        }

        .status-actions {
            flex-direction: column;
        }

        .btn {
            width: 100%;
            justify-content: center;
        }
    }

    /* Augmenter l'espacement général */
    .content-body {
        padding: 3.5rem !important;
    }

    .content-container {
        padding: 3rem !important;
    }

    /* Titres plus grands */
    .notice-title {
        font-size: 2.4rem !important;
        margin-bottom: 0.5rem !important;
    }

    .notice-ref {
        font-size: 1.1rem !important;
    }

    /* Cartes plus espacées */
    .info-card {
        border-radius: 24px !important;
    }

    .info-card-header {
        padding: 1.75rem !important;
    }

    .info-card-header h3 {
        font-size: 1.3rem !important;
    }

    .info-card-content {
        padding: 2rem !important;
    }

    /* Info rows plus espacées */
    .info-row {
        padding: 1rem 0 !important;
    }

    .info-label {
        font-size: 1.05rem !important;
    }

    .info-value {
        font-size: 1.15rem !important;
    }

    /* Sections de détail plus grandes */
    .detail-section {
        margin-bottom: 3rem !important;
        border-radius: 24px !important;
    }

    .detail-section-header {
        padding: 1.75rem !important;
    }

    .detail-section-header h3 {
        font-size: 1.3rem !important;
    }

    .detail-section-content {
        padding: 2.5rem !important;
        font-size: 1.15rem !important;
        line-height: 1.8 !important;
    }

    /* Badges plus grands */
    .badge {
        padding: 0.75rem 1.5rem !important;
        font-size: 1rem !important;
    }

    /* Boutons plus grands */
    .btn {
        padding: 1rem 2rem !important;
        font-size: 1.05rem !important;
        border-radius: 14px !important;
    }

    /* Header actions plus espacé */
    .header-actions {
        margin-bottom: 3rem !important;
    }

    /* Grille plus espacée */
    .info-grid {
        gap: 2rem !important;
        margin-bottom: 3rem !important;
    }

    /* Section actions statut plus grande */
    .status-actions-section {
        margin-top: 3.5rem !important;
        border-radius: 24px !important;
    }

    .status-actions-header {
        padding: 1.75rem !important;
    }

    .status-actions-header h3 {
        font-size: 1.3rem !important;
    }

    .status-actions {
        padding: 2rem !important;
        gap: 1.5rem !important;
    }

    /* Alertes plus grandes */
    .alert {
        padding: 1.75rem !important;
        margin-bottom: 2.5rem !important;
    }

    .alert p {
        font-size: 1.05rem !important;
    }

    /* En-tête préavis plus espacé */
    .notice-header {
        margin-bottom: 3rem !important;
        padding-bottom: 2rem !important;
    }

</style>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
</script>
@endsection
