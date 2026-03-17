<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $type === 'quittance' ? 'Quittance de loyer' : 'Avis d\'échéance' }} - {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #70AE48;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #70AE48;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header h2 {
            font-size: 18px;
            color: #666;
            font-weight: normal;
            margin-top: 0;
        }
        .invoice-info {
            margin-bottom: 30px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        .invoice-info table {
            width: 100%;
            border-collapse: collapse;
        }
        .invoice-info td {
            padding: 8px 5px;
            vertical-align: top;
        }
        .invoice-info .label {
            font-weight: bold;
            width: 150px;
            color: #555;
        }
        .invoice-info .value {
            color: #333;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
        }
        .details-table th {
            background: #70AE48;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 14px;
        }
        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .details-table tr:last-child td {
            border-bottom: none;
        }
        .total-row {
            font-weight: bold;
            background: #f0f0f0;
        }
        .total-row td {
            font-size: 14px;
        }
        .amount {
            text-align: right;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #999;
        }
        .payment-info {
            margin-top: 30px;
            padding: 15px;
            background: #f0f8ff;
            border-left: 4px solid #70AE48;
            border-radius: 0 5px 5px 0;
        }
        .payment-info h3 {
            color: #70AE48;
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-pending {
            background: #fff3cd;
            color: #856404;
        }
        .badge-paid {
            background: #d4edda;
            color: #155724;
        }
        .badge-overdue {
            background: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>GESTILOC</h1>
        <h2>{{ $type === 'quittance' ? 'QUITTANCE DE LOYER' : 'AVIS D\'ÉCHÉANCE' }}</h2>
        <p>N° {{ $invoice->invoice_number }}</p>
        @if($type === 'quittance')
            <span class="badge badge-paid">PAYÉE</span>
        @elseif($invoice->status === 'pending' && \Carbon\Carbon::parse($invoice->due_date)->isPast())
            <span class="badge badge-overdue">EN RETARD</span>
        @else
            <span class="badge badge-pending">EN ATTENTE</span>
        @endif
    </div>

    <div class="invoice-info">
        <table>
            <tr>
                <td class="label">Date d'émission :</td>
                <td class="value">{{ now()->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label">Date d'échéance :</td>
                <td class="value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td class="label">Période :</td>
                <td class="value">
                    @if($invoice->period_start && $invoice->period_end)
                        Du {{ \Carbon\Carbon::parse($invoice->period_start)->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($invoice->period_end)->format('d/m/Y') }}
                    @else
                        -
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <h3>Informations bailleur / propriétaire</h3>
    <div class="invoice-info">
        <table>
            <tr>
                <td class="label">Nom :</td>
                <td class="value">{{ $invoice->lease->property->landlord->user->name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Email :</td>
                <td class="value">{{ $invoice->lease->property->landlord->user->email ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <h3>Informations locataire</h3>
    <div class="invoice-info">
        <table>
            <tr>
                <td class="label">Nom :</td>
                <td class="value">{{ $invoice->lease->tenant->user->name ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Email :</td>
                <td class="value">{{ $invoice->lease->tenant->user->email ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Bien :</td>
                <td class="value">{{ $invoice->lease->property->name ?? 'N/A' }} - {{ $invoice->lease->property->address ?? '' }}</td>
            </tr>
        </table>
    </div>

    <h3>Détails de la facture</h3>
    <table class="details-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Type</th>
                <th class="amount">Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $invoice->description ?? 'Facture de ' . ucfirst($invoice->type) }}</td>
                <td>
                    @switch($invoice->type)
                        @case('rent') Loyer @break
                        @case('deposit') Dépôt de garantie @break
                        @case('charge') Charge @break
                        @case('repair') Réparation @break
                        @default {{ ucfirst($invoice->type) }}
                    @endswitch
                </td>
                <td class="amount">{{ number_format($invoice->amount_total, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr class="total-row">
                <td colspan="2" style="text-align: right;"><strong>TOTAL TTC</strong></td>
                <td class="amount"><strong>{{ number_format($invoice->amount_total, 0, ',', ' ') }} FCFA</strong></td>
            </tr>
        </tbody>
    </table>

    @if($invoice->payment_method)
    <div class="payment-info">
        <h3>Informations de paiement</h3>
        <p><strong>Moyen de paiement :</strong>
            @switch($invoice->payment_method)
                @case('virement') Virement bancaire @break
                @case('mobile_money') Mobile Money @break
                @case('card') Carte bancaire @break
                @case('cheque') Chèque @break
                @case('especes') Espèces @break
                @case('fedapay') Fedapay @break
                @default {{ $invoice->payment_method }}
            @endswitch
        </p>
        @if($invoice->payment_link_token)
        <p><strong>Lien de paiement :</strong> {{ config('app.frontend_url') }}/pay-link/{{ $invoice->payment_link_token }}</p>
        @endif
    </div>
    @endif

    <div class="footer">
        <p>Document généré automatiquement par Gestiloc - {{ now()->format('d/m/Y H:i') }}</p>
        <p>Ce document fait office de {{ $type === 'quittance' ? 'quittance de loyer' : 'avis d\'échéance' }}.</p>
    </div>
</body>
</html>
