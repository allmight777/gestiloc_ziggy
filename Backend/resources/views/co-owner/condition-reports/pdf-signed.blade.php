<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>État des lieux signé #{{ $report->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #70AE48;
        }
        .header h1 {
            color: #70AE48;
            margin-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
        }
        .info-value {
            font-size: 14px;
        }
        .photos-section {
            margin-top: 30px;
        }
        .photo-item {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .photo-status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
        }
        .status-good { background: #d1fae5; color: #065f46; }
        .status-satisfactory { background: #fef3c7; color: #92400e; }
        .status-poor { background: #fee2e2; color: #b91c1c; }
        .signature-section {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px dashed #ccc;
        }
        .signature-box {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .signature {
            text-align: center;
        }
        .signature img {
            max-width: 200px;
            max-height: 80px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ÉTAT DES LIEUX {{ strtoupper($report->type) }}</h1>
        <p>Référence : EDL-{{ str_pad($report->id, 6, '0', STR_PAD_LEFT) }}</p>
    </div>

    <div class="info-grid">
        <div>
            <div class="info-item">
                <div class="info-label">Bien</div>
                <div class="info-value">{{ $report->property->name }}</div>
                <div class="info-value">{{ $report->property->address }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Locataire</div>
                <div class="info-value">{{ $report->lease->tenant->first_name }} {{ $report->lease->tenant->last_name }}</div>
            </div>
        </div>
        <div>
            <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($report->report_date)->format('d/m/Y') }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Créé par</div>
                <div class="info-value">{{ $report->creator->name ?? 'Co-propriétaire' }}</div>
            </div>
        </div>
    </div>

    @if($report->notes)
    <div class="info-item">
        <div class="info-label">Notes générales</div>
        <div class="info-value">{{ $report->notes }}</div>
    </div>
    @endif

    <div class="photos-section">
        <h3>Photos et constats</h3>
        @foreach($report->photos as $index => $photo)
        <div class="photo-item">
            <strong>Photo {{ $index + 1 }}</strong>
            <span class="photo-status status-{{ $photo->condition_status }}">
                @switch($photo->condition_status)
                    @case('good') ✅ Bon @break
                    @case('satisfactory') 📊 Correct @break
                    @case('poor') ⚠️ Mauvais @break
                    @case('damaged') ❌ Abîmé @break
                @endswitch
            </span>
            @if($photo->condition_notes)
            <p><em>{{ $photo->condition_notes }}</em></p>
            @endif
        </div>
        @endforeach
    </div>

    <div class="signature-section">
        <h3>Signature</h3>
        <div class="signature-box">
            <div class="signature">
                <p><strong>Signé par :</strong> Co-propriétaire</p>
                <p>Le {{ \Carbon\Carbon::parse($report->signed_at)->format('d/m/Y à H:i') }}</p>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Document généré automatiquement par GestiLoc - {{ date('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
