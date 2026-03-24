<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Avis d'échéance</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .header {
            background: #70AE48;
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .notice-details {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6c757d;
        }
        .detail-value {
            font-weight: 600;
            color: #212529;
        }
        .total {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #70AE48;
            font-size: 18px;
        }
        .total .detail-value {
            color: #70AE48;
            font-size: 22px;
        }
        .payment-button {
            display: inline-block;
            background: #70AE48;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: background 0.3s;
        }
        .payment-button:hover {
            background: #5a8f3a;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }
        .alert {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Avis d'échéance</h1>
            <p>Référence : {{ $reference }}</p>
        </div>

        <div class="content">
            <p>Bonjour <strong>{{ $tenant_name }}</strong>,</p>

            <div class="alert">
                <strong>⚠️ Prochain loyer à payer dans 10 jours</strong>
            </div>

            <p>Conformément à votre contrat de location, nous vous rappelons que le loyer du mois de <strong>{{ $month_year }}</strong> arrive à échéance.</p>

            <div class="notice-details">
                <div class="detail-row">
                    <span class="detail-label">Bien</span>
                    <span class="detail-value">{{ $property_name }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Adresse</span>
                    <span class="detail-value">{{ $property_address }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date d'échéance</span>
                    <span class="detail-value">{{ $due_date }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Loyer mensuel</span>
                    <span class="detail-value">{{ $rent_amount }}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Charges mensuelles</span>
                    <span class="detail-value">{{ $charges_amount }}</span>
                </div>
                <div class="detail-row total">
                    <span class="detail-label">Total à payer</span>
                    <span class="detail-value">{{ $total_amount }}</span>
                </div>
            </div>

            <p>Pour régler votre loyer, cliquez sur le bouton ci-dessous :</p>

            <div style="text-align: center;">
                <a href="{{ $payment_link }}" class="payment-button">
                    💳 Payer mon loyer
                </a>
            </div>

            <p style="font-size: 12px; color: #6c757d; margin-top: 20px;">
                Ce lien de paiement est valable 15 jours. Passé ce délai, veuillez contacter votre propriétaire.
            </p>
        </div>

        <div class="footer">
            <p>Cet email a été envoyé automatiquement par Gestiloc. Merci de ne pas y répondre.</p>
            <p>&copy; {{ date('Y') }} Gestiloc - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
