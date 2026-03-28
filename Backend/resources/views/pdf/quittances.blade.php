<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quittance de loyer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #70AE48;
            margin-bottom: 5px;
        }
        .info {
            margin-bottom: 20px;
        }
        .info div {
            margin-bottom: 5px;
        }
        .amount {
            font-size: 18px;
            font-weight: bold;
            color: #70AE48;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            text-align: right;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        td {
            padding: 8px;
        }
        .label {
            font-weight: bold;
            width: 150px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>QUITTANCE DE LOYER</h1>
        <p>N° {{ $numero }}</p>
    </div>

    <div class="info">
        <table>
            <tr>
                <td class="label">Locataire :</td>
                <td>{{ $tenant_name }}</td>
            </tr>
            <tr>
                <td class="label">Adresse :</td>
                <td>{{ $tenant_address }}</td>
            </tr>
            <tr>
                <td class="label">Bien loué :</td>
                <td>{{ $property_address }}</td>
            </tr>
            <tr>
                <td class="label">Période :</td>
                <td>{{ $period }}</td>
            </tr>
            <tr>
                <td class="label">Date d'émission :</td>
                <td>{{ $date }}</td>
            </tr>
        </table>
    </div>

    <div class="amount">
        Montant : {{ $amount }}
    </div>

    <p>Arrêté la présente quittance à la somme de : <strong>{{ $amount_letters }}</strong></p>

    <div class="footer">
        <p>Fait à _________________, le {{ $date }}</p>
        <br><br>
        <p>Signature du bailleur</p>
    </div>
</body>
</html>
