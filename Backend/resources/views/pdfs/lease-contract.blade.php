<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Contrat de bail - {{ $lease->lease_number }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #70AE48;
            padding-bottom: 15px;
        }
        .header h1 {
            color: #70AE48;
            font-size: 24px;
            margin: 0 0 5px 0;
        }
        .header p {
            color: #666;
            font-size: 16px;
            margin: 0;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #f0f9e6;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            color: #2e6216;
            border-left: 5px solid #70AE48;
            margin-bottom: 15px;
        }
        .info-grid {
            display: table;
            width: 100%;
            border-collapse: collapse;
        }
        .info-row {
            display: table-row;
        }
        .info-label {
            display: table-cell;
            width: 30%;
            font-weight: bold;
            padding: 8px 10px;
            background: #f9f9f9;
            border: 1px solid #ddd;
        }
        .info-value {
            display: table-cell;
            width: 70%;
            padding: 8px 10px;
            border: 1px solid #ddd;
        }
        .signature-section {
            margin-top: 40px;
            display: table;
            width: 100%;
        }
        .signature-box {
            display: table-cell;
            width: 45%;
            text-align: center;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 5px;
        }
        .signature-box.left {
            margin-right: 5%;
        }
        .signature-box.right {
            margin-left: 5%;
        }
        .signature-line {
            margin-top: 50px;
            border-top: 1px solid #333;
            width: 80%;
            margin-left: auto;
            margin-right: auto;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
        .amount {
            font-weight: bold;
            color: #70AE48;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-active {
            background: #dcfce7;
            color: #166534;
        }
        .badge-pending {
            background: #fef3c7;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CONTRAT DE LOCATION</h1>
        <p>N° {{ $lease->lease_number }}</p>
        <p><span class="badge {{ $lease->status === 'active' ? 'badge-active' : 'badge-pending' }}">{{ strtoupper($lease->status) }}</span></p>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS GÉNÉRALES</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Type de bail</div>
                <div class="info-value">{{ $lease->type == 'nu' ? "BAIL D'HABITATION NU" : 'BAIL MEUBLÉ' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date de début</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($lease->start_date)->format('d/m/Y') }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date de fin</div>
                <div class="info-value">{{ $lease->end_date ? \Carbon\Carbon::parse($lease->end_date)->format('d/m/Y') : 'Non définie' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Durée</div>
                <div class="info-value">{{ $lease->duration_months ?? 'Non spécifiée' }} mois</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS FINANCIÈRES</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Loyer mensuel</div>
                <div class="info-value amount">{{ number_format($lease->rent_amount, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Charges</div>
                <div class="info-value">{{ number_format($lease->charges_amount ?? 0, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dépôt de garantie</div>
                <div class="info-value amount">{{ number_format($lease->guarantee_amount ?? $lease->rent_amount * 2, 0, ',', ' ') }} FCFA</div>
            </div>
            <div class="info-row">
                <div class="info-label">Jour de paiement</div>
                <div class="info-value">Le {{ $lease->billing_day ?? '5' }} de chaque mois</div>
            </div>
            <div class="info-row">
                <div class="info-label">Fréquence de paiement</div>
                <div class="info-value">{{ $lease->payment_frequency ?? 'mensuelle' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Mode de paiement</div>
                <div class="info-value">{{ $lease->terms['payment_mode'] ?? 'Espèce' }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS DU BIEN</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nom du bien</div>
                <div class="info-value">{{ $property->name ?? 'Non spécifié' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Adresse</div>
                <div class="info-value">{{ $property->address ?? '' }}, {{ $property->city ?? '' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Type</div>
                <div class="info-value">{{ $property->type ?? 'Non spécifié' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Surface</div>
                <div class="info-value">{{ $property->surface ?? 'Non spécifiée' }} m²</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS DU LOCATAIRE</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nom complet</div>
                <div class="info-value">{{ $tenant->first_name ?? '' }} {{ $tenant->last_name ?? '' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">{{ $tenant->email ?? '' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $tenant->phone ?? '' }}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">INFORMATIONS DU PROPRIÉTAIRE</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nom complet</div>
                <div class="info-value">{{ $landlord->first_name ?? '' }} {{ $landlord->last_name ?? '' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">{{ $landlord->email ?? '' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Téléphone</div>
                <div class="info-value">{{ $landlord->phone ?? '' }}</div>
            </div>
        </div>
    </div>

    @if(!empty($lease->terms['special_conditions']))
    <div class="section">
        <div class="section-title">CONDITIONS PARTICULIÈRES</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-value" style="width: 100%;">{{ $lease->terms['special_conditions'] }}</div>
            </div>
        </div>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-box left">
            <h3>Le propriétaire</h3>
            <p>{{ $landlord->first_name ?? '' }} {{ $landlord->last_name ?? '' }}</p>
            @if($lease->landlord_signature)
                <p style="color: #70AE48; margin-top: 20px;">✓ Signé le {{ \Carbon\Carbon::parse(json_decode($lease->landlord_signature, true)['signed_at'] ?? null)->format('d/m/Y') }}</p>
            @else
                <div class="signature-line"></div>
                <p style="margin-top: 10px; color: #999;">Signature</p>
            @endif
        </div>
        <div class="signature-box right">
            <h3>Le locataire</h3>
            <p>{{ $tenant->first_name ?? '' }} {{ $tenant->last_name ?? '' }}</p>
            @if($lease->tenant_signature)
                <p style="color: #70AE48; margin-top: 20px;">✓ Signé le {{ \Carbon\Carbon::parse(json_decode($lease->tenant_signature, true)['signed_at'] ?? null)->format('d/m/Y') }}</p>
            @else
                <div class="signature-line"></div>
                <p style="margin-top: 10px; color: #999;">Signature</p>
            @endif
        </div>
    </div>

    <div class="footer">
        <p>Document généré le {{ now()->format('d/m/Y à H:i') }}</p>
        <p>Ce document a valeur légale et engage les parties signataires.</p>
    </div>
</body>
</html>
