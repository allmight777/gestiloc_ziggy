<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>État des lieux signé #{{ str_pad($report->id, 6, '0', STR_PAD_LEFT) }}</title>
    <style>
        /* ===== VARIABLES ===== */
        :root {
            --primary: #70AE48;
            --primary-dark: #5a8f3a;
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
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            color: var(--gray-900);
            line-height: 1.5;
            padding: 2rem;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 3px solid var(--primary);
        }

        .header-left h1 {
            font-size: 2rem;
            font-weight: 700;
            color: var(--gray-900);
            margin-bottom: 0.5rem;
        }

        .header-left .reference {
            font-size: 1rem;
            color: var(--gray-500);
        }

        .header-right {
            text-align: right;
        }

        .header-right .date {
            font-size: 0.9rem;
            color: var(--gray-500);
            margin-bottom: 0.25rem;
        }

        .header-right .type-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .type-badge.entry {
            background: #ecfdf5;
            color: #059669;
        }

        .type-badge.exit {
            background: #fef2f2;
            color: #dc2626;
        }

        .type-badge.intermediate {
            background: #eff6ff;
            color: #2563eb;
        }

        .signed-stamp {
            margin-top: 0.5rem;
            background: #ecfdf5;
            color: #059669;
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .signed-stamp svg {
            width: 1rem;
            height: 1rem;
        }

        .card {
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: 1rem;
            margin-bottom: 2rem;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .card-header {
            background: var(--gray-50);
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--gray-200);
        }

        .card-header h2 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary-dark);
            margin: 0;
        }

        .card-body {
            padding: 1.5rem;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
        }

        .info-group {
            margin-bottom: 1.5rem;
        }

        .info-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--gray-500);
            text-transform: uppercase;
            letter-spacing: 0.025em;
            margin-bottom: 0.25rem;
        }

        .info-value {
            font-size: 1rem;
            font-weight: 600;
            color: var(--gray-900);
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .table th {
            text-align: left;
            padding: 0.75rem 1rem;
            background: var(--gray-50);
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--gray-600);
            text-transform: uppercase;
            letter-spacing: 0.025em;
            border-bottom: 2px solid var(--gray-200);
        }

        .table td {
            padding: 0.75rem 1rem;
            font-size: 0.95rem;
            color: var(--gray-700);
            border-bottom: 1px solid var(--gray-200);
        }

        .badge {
            display: inline-block;
            padding: 0.35rem 0.75rem;
            border-radius: 2rem;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge.good {
            background: #ecfdf5;
            color: #059669;
        }

        .badge.satisfactory {
            background: #eff6ff;
            color: #2563eb;
        }

        .badge.poor {
            background: #fffbeb;
            color: #d97706;
        }

        .badge.damaged {
            background: #fef2f2;
            color: #dc2626;
        }

        .signature-box {
            margin-top: 2rem;
            padding: 1.5rem;
            background: var(--gray-50);
            border-radius: 1rem;
            border: 1px solid var(--primary);
            page-break-inside: avoid;
        }

        .signature-box h3 {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--primary-dark);
            margin-bottom: 1rem;
        }

        .signature-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 2rem;
        }

        .signature {
            width: 45%;
        }

        .signature-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--gray-500);
            margin-bottom: 0.5rem;
        }

        .signature-field {
            border-bottom: 1px solid var(--gray-300);
            padding-bottom: 0.5rem;
            min-height: 2rem;
        }

        .signature-field.signed {
            font-family: 'Brush Script MT', cursive;
            font-size: 1.5rem;
            color: var(--primary-dark);
            border-bottom: 1px solid var(--primary);
        }

        .signature-date {
            font-size: 0.8rem;
            color: var(--gray-500);
            margin-top: 0.25rem;
        }

        .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 1px solid var(--gray-200);
            text-align: center;
            font-size: 0.8rem;
            color: var(--gray-400);
        }

        .text-muted {
            color: var(--gray-500);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>ÉTAT DES LIEUX SIGNÉ</h1>
            <div class="reference">N° {{ str_pad($report->id, 6, '0', STR_PAD_LEFT) }}</div>
        </div>
        <div class="header-right">
            <div class="date">Édité le {{ now()->format('d/m/Y à H:i') }}</div>
            <div class="type-badge {{ $report->type }}">
                @if($report->type == 'entry')
                    🏠 ÉTAT DES LIEUX D'ENTRÉE
                @elseif($report->type == 'exit')
                    🚪 ÉTAT DES LIEUX DE SORTIE
                @else
                    📋 ÉTAT DES LIEUX INTERMÉDIAIRE
                @endif
            </div>
            @if($report->signed_at)
            <div class="signed-stamp">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Document signé le {{ \Carbon\Carbon::parse($report->signed_at)->format('d/m/Y') }}
            </div>
            @endif
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h2>Informations générales</h2>
        </div>
        <div class="card-body">
            <div class="grid-2">
                <div class="info-group">
                    <div class="info-label">Date de l'état des lieux</div>
                    <div class="info-value">{{ \Carbon\Carbon::parse($report->report_date)->format('d/m/Y') }}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Date de création</div>
                    <div class="info-value">{{ \Carbon\Carbon::parse($report->created_at)->format('d/m/Y') }}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Bien concerné</div>
                    <div class="info-value">{{ $report->property->name ?? 'Non spécifié' }}</div>
                    <div class="text-muted">{{ $report->property->address ?? '' }}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Bail associé</div>
                    <div class="info-value">#{{ str_pad($report->lease_id, 6, '0', STR_PAD_LEFT) }}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Locataire</div>
                    <div class="info-value">
                        {{ $report->lease->tenant->first_name ?? '' }} {{ $report->lease->tenant->last_name ?? 'Non spécifié' }}
                    </div>
                </div>
                <div class="info-group">
                    <div class="info-label">Créé par</div>
                    <div class="info-value">{{ $report->creator->name ?? 'Co-propriétaire' }}</div>
                </div>
            </div>

            @if($report->notes)
            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--gray-50); border-radius: 0.5rem;">
                <div class="info-label">Notes générales</div>
                <div>{{ $report->notes }}</div>
            </div>
            @endif
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <h2>Photos et constats ({{ $report->photos->count() }})</h2>
        </div>
        <div class="card-body">
            @if($report->photos->isEmpty())
                <p class="text-muted">Aucune photo n'a été ajoutée.</p>
            @else
                <table class="table">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Nom du fichier</th>
                            <th>État</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($report->photos as $index => $photo)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td>{{ $photo->original_filename }}</td>
                            <td>
                                <span class="badge {{ $photo->condition_status }}">
                                    @if($photo->condition_status == 'good') ✅ Bon
                                    @elseif($photo->condition_status == 'satisfactory') 📊 Correct
                                    @elseif($photo->condition_status == 'poor') ⚠️ Mauvais
                                    @else ❌ Abîmé @endif
                                </span>
                            </td>
                            <td>{{ $photo->condition_notes ?? '-' }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>

    <div class="signature-box">
        <h3>SIGNATURES</h3>

        <div class="signature-line">
            <div class="signature">
                <div class="signature-label">Le co-propriétaire</div>
                <div class="signature-field {{ $report->signed_at ? 'signed' : '' }}">
                    @if($report->signed_at)
                        Signé électroniquement
                    @else
                        _________________________
                    @endif
                </div>
                @if($report->signed_at)
                <div class="signature-date">
                    le {{ \Carbon\Carbon::parse($report->signed_at)->format('d/m/Y à H:i') }}
                </div>
                @endif
            </div>

            <div class="signature">
                <div class="signature-label">Le locataire</div>
                <div class="signature-field">
                    @if($report->lease->tenant_signature)
                        Signé électroniquement
                    @else
                        _________________________
                    @endif
                </div>
            </div>
        </div>

        <p style="margin-top: 2rem; font-size: 0.85rem; color: var(--gray-500);">
            La signature électronique de ce document engage les parties signataires.
        </p>
    </div>

    <div class="footer">
        <p>Document généré automatiquement par GestiLoc - {{ now()->format('d/m/Y H:i') }}</p>
        <p>Ce document fait foi entre les parties.</p>
    </div>
</body>
</html>
