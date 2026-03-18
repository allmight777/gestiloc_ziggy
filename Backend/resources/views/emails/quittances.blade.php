<!DOCTYPE html>
<html>
<head>
    <title>Votre quittance de loyer</title>
</head>
<body>
    <h2>Bonjour {{ $data['tenant_name'] }},</h2>

    <p>Vous trouverez en pièce jointe votre quittance de loyer pour la période de {{ $data['period'] }}.</p>

    <p><strong>Montant :</strong> {{ $data['amount'] }}</p>
    <p><strong>Bien :</strong> {{ $data['property_address'] }}</p>

    <p>Cordialement,<br>Votre bailleur</p>
</body>
</html>
