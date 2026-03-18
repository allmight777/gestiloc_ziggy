<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Lease;
use App\Models\Payment;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class FedapayPayments
{
    public function __construct(private FedapayClient $client) {}

    public function createCheckout(Payment $payment, Invoice $invoice, Lease $lease, array $customer): array
    {
        $currencyIso = strtoupper((string) config('fedapay.currency', 'XOF'));

        // 0% commission
        $fee = 0.0;
        $net = round((float) $invoice->amount_total, 2);

        $payment->update([
            'amount_total' => $invoice->amount_total,
            'fee_amount'   => $fee,
            'amount_net'   => $net,
            'currency'     => $currencyIso,
        ]);

        $rawPhone  = (string) Arr::get($customer, 'phone', '');
        $phoneE164 = $this->normalizeE164($rawPhone);

        $back = rtrim((string) config('fedapay.back_url', config('app.url')), '/');

        $payload = [
            "description"  => "Paiement loyer - " . ($invoice->invoice_number ?? "FACTURE"),
            "amount"       => (int) round((float) $invoice->amount_total),
            "currency"     => ["iso" => $currencyIso],
            "callback_url" => $back . "/api/fedapay/return?status=success&payment_id=" . $payment->id,
            "cancel_url"   => $back . "/api/fedapay/return?status=cancel&payment_id="  . $payment->id,
            "customer"     => [
                "firstname"    => Arr::get($customer, 'firstname'),
                "lastname"     => Arr::get($customer, 'lastname'),
                "email"        => Arr::get($customer, 'email'),
                "phone_number" => [
                    "number"  => $phoneE164,
                    "country" => "BJ",
                ],
            ],
            "metadata" => [
                "payment_id" => $payment->id,
                "invoice_id" => $invoice->id,
                "lease_id"   => $lease->id,
            ],
        ];

        Log::info("FedaPay createCheckout payload (safe)", [
            "invoice_id"     => $invoice->id,
            "amount"         => (float) $invoice->amount_total,
            "currency"       => $currencyIso,
            "back_url"       => $back,
            "phone_raw"      => $rawPhone,        // 🐛 pour debug
            "phone_e164"     => $phoneE164,        // 🐛 pour debug
            "has_phone"      => (bool) $phoneE164,
            "has_email"      => (bool) Arr::get($customer, 'email'),
        ]);

        $res = $this->client->post('/transactions', $payload);

        $tx = $res['response']['v1/transaction'] ?? $res['v1/transaction'] ?? $res['data'] ?? $res;
        if (isset($tx['response']['v1/transaction'])) {
            $tx = $tx['response']['v1/transaction'];
        }

        if (!is_array($tx) || empty($tx['id'])) {
            Log::error("FedaPay create transaction unexpected response", ['response' => $res]);
            throw new \RuntimeException("Transaction introuvable (réponse FedaPay inattendue).");
        }

        $txId        = (string) $tx['id'];
        $reference   = (string) ($tx['reference']     ?? '');
        $paymentToken= (string) ($tx['payment_token'] ?? '');
        $paymentUrl  = (string) ($tx['payment_url']   ?? '');
        $checkoutUrl = $paymentUrl ?: null;

        $payment->update([
            'fedapay_transaction_id' => $txId        ?: null,
            'fedapay_reference'      => $reference   ?: null,
            'checkout_token'         => $paymentToken?: null,
            'checkout_url'           => $checkoutUrl,
            'provider_payload'       => ['create_response' => $res],
        ]);

        return [
            'transaction_id' => $txId,
            'reference'      => $reference,
            'token'          => $paymentToken,
            'checkout_url'   => $checkoutUrl,
        ];
    }

    public function getTransaction(string $txId): array
    {
        return $this->client->get('/transactions/' . $txId);
    }

    /**
     * Normalise n'importe quel numéro vers E.164 Bénin (+229XXXXXXXX).
     *
     * Cas gérés :
     *  - "97808080"           → +22997808080   (8 chiffres locaux)
     *  - "22997808080"        → +22997808080   (indicatif sans +)
     *  - "+22997808080"       → +22997808080   (déjà bon)
     *  - "948499585899"       → +22985899  NON → on prend les 8 derniers → +22985899 (si 8 chiffres)
     *  - Numéro trop long     → on garde les 8 derniers chiffres + 229
     */
    private function normalizeE164(string $phone): ?string
    {
        if (trim($phone) === '') return null;

        // 1. Garder uniquement chiffres et +
        $p = preg_replace('/[^\d+]/', '', $phone);

        // 2. Retirer le + initial pour travailler sur les chiffres seuls
        $digits = ltrim($p, '+');

        // 3. Si commence par 229, retirer l'indicatif
        if (str_starts_with($digits, '229')) {
            $digits = substr($digits, 3);
        }

        // 4. Garder les 8 derniers chiffres (numéro local béninois)
        if (strlen($digits) > 8) {
            $digits = substr($digits, -8);
        }

        // 5. Doit faire exactement 8 chiffres
        if (strlen($digits) !== 8 || !ctype_digit($digits)) {
            Log::warning("FedaPay normalizeE164: numéro invalide ignoré", [
                'raw'    => $phone,
                'digits' => $digits,
            ]);
            return null;
        }

        return '+229' . $digits;
    }
}
