@extends('layouts.co-owner')

@section('title', 'Avis d\'échéance')

@section('content')
<div style="min-height: 100vh; background: #F8F9FA; padding: 2rem;">
    <div style="max-width: 1400px; margin: 0 auto;">

        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 2rem; font-weight: 700; color: #1F2937; margin: 0 0 0.5rem 0;">
                    Avis d'échéance
                </h1>
                <p style="color: #6B7280; font-size: 1rem; margin: 0; max-width: 600px;">
                    Gérez les avis d'échéance envoyés aux locataires 10 jours avant la date du loyer.
                </p>
            </div>

            <a href="{{ route('co-owner.rent-due-notices.create') }}" class="btn-create" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #70AE48; color: white; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nouvel avis
            </a>
        </div>

        <!-- Statistiques -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #E5E7EB;">
                <div style="color: #9CA3AF; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">TOTAL</div>
                <div style="font-size: 2rem; font-weight: 700; color: #1F2937;">{{ $stats['total'] ?? 0 }}</div>
            </div>
            <div style="background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #E5E7EB;">
                <div style="color: #9CA3AF; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">EN ATTENTE</div>
                <div style="font-size: 2rem; font-weight: 700; color: #F59E0B;">{{ $stats['pending'] ?? 0 }}</div>
            </div>
            <div style="background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #E5E7EB;">
                <div style="color: #9CA3AF; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">ENVOYÉS</div>
                <div style="font-size: 2rem; font-weight: 700; color: #70AE48;">{{ $stats['sent'] ?? 0 }}</div>
            </div>
            <div style="background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #E5E7EB;">
                <div style="color: #9CA3AF; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">PAYÉS</div>
                <div style="font-size: 2rem; font-weight: 700; color: #10B981;">{{ $stats['paid'] ?? 0 }}</div>
            </div>
        </div>

        <!-- Filtres -->
        <div style="background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #E5E7EB;">
            <form method="GET" action="{{ route('co-owner.rent-due-notices.index') }}" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    <select name="property_id" class="form-control" onchange="this.form.submit()">
                        <option value="">Tous les biens</option>
                        @foreach($properties as $property)
                            <option value="{{ $property->id }}" {{ request('property_id') == $property->id ? 'selected' : '' }}>
                                {{ $property->name }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div style="flex: 1; min-width: 150px;">
                    <select name="status" class="form-control" onchange="this.form.submit()">
                        <option value="">Tous les statuts</option>
                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>En attente</option>
                        <option value="sent" {{ request('status') == 'sent' ? 'selected' : '' }}>Envoyés</option>
                        <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>Payés</option>
                    </select>
                </div>

                <div style="flex: 2; min-width: 250px;">
                    <input type="text" name="search" class="form-control" placeholder="Rechercher..." value="{{ request('search') }}">
                </div>

                <button type="submit" class="btn-search" style="padding: 12px 24px; background: #70AE48; color: white; border: none; border-radius: 12px; cursor: pointer;">
                    Rechercher
                </button>
            </form>
        </div>

        <!-- Liste des avis -->
        @if($notices->isEmpty())
            <div style="text-align: center; padding: 4rem 2rem; background: white; border-radius: 20px; border: 2px dashed #E5E7EB;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <h3 style="font-size: 1.2rem; font-weight: 700; color: #6B7280; margin: 1rem 0 0.5rem;">Aucun avis d'échéance</h3>
                <p style="color: #9CA3AF;">Les avis seront générés automatiquement 10 jours avant chaque échéance.</p>
            </div>
        @else
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: 1.5rem;">
                @foreach($notices as $notice)
                    <div style="background: white; border-radius: 16px; padding: 1.5rem; border: 1px solid #E5E7EB; transition: all 0.2s;">
                        <!-- En-tête -->
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div>
                                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
                                    {{ $notice->status == 'paid' ? 'background: #D1FAE5; color: #065F46;' : ($notice->status == 'sent' ? 'background: #E0E7FF; color: #1E40AF;' : 'background: #FEF3C7; color: #92400E;') }}">
                                    {{ $notice->status == 'paid' ? '✓ PAYÉ' : ($notice->status == 'sent' ? '📧 ENVOYÉ' : '⏳ EN ATTENTE') }}
                                </span>
                            </div>
                            <span style="color: #9CA3AF; font-size: 0.75rem;">{{ $notice->reference }}</span>
                        </div>

                        <!-- Informations -->
                        <h3 style="font-size: 1.1rem; font-weight: 700; color: #1F2937; margin: 0 0 0.5rem 0;">
                            {{ $notice->property->name ?? 'Bien' }}
                        </h3>
                        <div style="color: #6B7280; font-size: 0.85rem; margin-bottom: 1rem;">
                            {{ $notice->tenant->first_name ?? '' }} {{ $notice->tenant->last_name ?? 'Locataire' }}
                        </div>

                        <!-- Détails -->
                        <div style="background: #F9FAFB; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: #6B7280;">Période</span>
                                <span style="font-weight: 600;">{{ \Carbon\Carbon::parse($notice->month_year . '-01')->translatedFormat('F Y') }}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: #6B7280;">Date d'échéance</span>
                                <span style="font-weight: 600;">{{ \Carbon\Carbon::parse($notice->due_date)->format('d/m/Y') }}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: #6B7280;">Loyer + Charges</span>
                                <span style="font-weight: 600;">{{ number_format($notice->total_amount, 0, ',', ' ') }} FCFA</span>
                            </div>
                            @if($notice->sent_at)
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6B7280;">Envoyé le</span>
                                <span style="font-weight: 600;">{{ \Carbon\Carbon::parse($notice->sent_at)->format('d/m/Y H:i') }}</span>
                            </div>
                            @endif
                        </div>

                        <!-- Actions - MODIFIÉ POUR AJOUTER RENVOYER ET SUPPRIMER -->
                        <div style="display: flex; gap: 0.5rem;">
                            @if($notice->status == 'pending')
                                <form action="{{ route('co-owner.rent-due-notices.send', $notice->id) }}" method="POST" style="flex: 1;">
                                    @csrf
                                    <button type="submit" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #70AE48; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                            <polyline points="22,6 12,13 2,6"></polyline>
                                        </svg>
                                        Envoyer
                                    </button>
                                </form>
                            @elseif($notice->status == 'sent')
                                <form action="{{ route('co-owner.rent-due-notices.resend', $notice->id) }}" method="POST" style="flex: 1;">
                                    @csrf
                                    <button type="submit" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #F59E0B; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <polyline points="12 8 12 12 15 15"></polyline>
                                        </svg>
                                        Renvoyer
                                    </button>
                                </form>
                                <form action="{{ route('co-owner.rent-due-notices.destroy', $notice->id) }}" method="POST" onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #EF4444; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        Supprimer
                                    </button>
                                </form>
                            @else
                                <div style="flex: 1; text-align: center; padding: 10px; background: #D1FAE5; border-radius: 10px; color: #065F46; font-weight: 600;">
                                    Paiement reçu
                                </div>
                            @endif
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Pagination -->
            <div style="margin-top: 2rem;">
                {{ $notices->links() }}
            </div>
        @endif
    </div>
</div>

<style>
    .form-control {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        font-size: 0.9rem;
        transition: all 0.2s;
    }
    .form-control:focus {
        outline: none;
        border-color: #70AE48;
        box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
    }
    .btn-search:hover {
        background: #5a8f3a !important;
        transform: translateY(-1px);
    }
    .pagination {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        list-style: none;
        padding: 0;
    }
    .pagination li a, .pagination li span {
        padding: 8px 12px;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        color: #6B7280;
        text-decoration: none;
    }
    .pagination li.active span {
        background: #70AE48;
        color: white;
        border-color: #70AE48;
    }
    button:active {
        transform: translateY(1px);
    }
</style>

<script>
    // Initialiser les icônes Lucide si disponible
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
</script>
@endsection
