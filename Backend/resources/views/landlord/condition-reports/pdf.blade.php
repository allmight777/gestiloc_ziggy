<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>État des lieux #{{ $report->id }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 12px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #70AE48;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            background: #f3f4f6;
            padding: 8px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            padding: 8px;
            border: 1px solid #e5e7eb;
        }
        .label {
            font-weight: bold;
            width: 30%;
        }
        .photos-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .photo-item {
            border: 1px solid #e5e7eb;
            padding: 10px;
        }
        .photo-item img {
            max-width: 100%;
            height: auto;
        }
        .signature {
            margin-top: 30px;
            padding: 20px;
            border-top: 2px dashed #70AE48;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ÉTAT DES LIEUX</h1>
        <p>{{ strtoupper(str_replace('_', ' ', $report->type)) }}</p>
        <p>Réf: EDL-{{ $report->id }} | Date: {{ $report->report_date->format('d/m/Y') }}</p>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS GÉNÉRALES</div>
        <table>
            <tr>
                <td class="label">Bien</td>
                <td>{{ $report->property->name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Adresse</td>
                <td>{{ $report->property->address ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Locataire</td>
                <td>{{ $report->lease->tenant->first_name ?? '' }} {{ $report->lease->tenant->last_name ?? '' }}</td>
            </tr>
            <tr>
                <td class="label">Date de création</td>
                <td>{{ $report->created_at->format('d/m/Y H:i') }}</td>
            </tr>
            <tr>
                <td class="label">Notes</td>
                <td>{{ $report->notes ?? 'Aucune note' }}</td>
            </tr>
        </table>
    </div>

    @if($report->photos && count($report->photos) > 0)
    <div class="section">
        <div class="section-title">PHOTOS ET CONSTATS ({{ count($report->photos) }})</div>
        <div class="photos-grid">
            @foreach($report->photos as $photo)
            <div class="photo-item">
                <img src="{{ storage_path('app/public/' . $photo->path) }}" alt="Photo">
                <p><strong>État:</strong> {{ $photo->condition_status }}</p>
                @if($photo->condition_notes)
                <p><strong>Notes:</strong> {{ $photo->condition_notes }}</p>
                @endif
            </div>
            @endforeach
        </div>
    </div>
    @endif

    @if($report->signed_at)
    <div class="signature">
        <p><strong>Document signé électroniquement</strong></p>
        <p>Signé le: {{ $report->signed_at->format('d/m/Y H:i') }}</p>
    </div>
    @endif

    <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 10px;">
        Document généré automatiquement - {{ date('d/m/Y H:i') }}
    </div>
</body>
</html>
