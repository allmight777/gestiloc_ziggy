<?php

namespace App\Services;

class BrevoMailService
{
    private $apiKey;

    public function __construct()
    {
        $this->apiKey = env('BREVO_API_KEY');
    }

    public function send(string $to, string $toName, string $subject, string $htmlContent, string $from = null, string $fromName = null): bool
    {
        try {
            $from = $from ?? env('MAIL_FROM_ADDRESS', 'agoliganange15@gmail.com');
            $fromName = $fromName ?? env('MAIL_FROM_NAME', 'Gestiloc');

            $ch = curl_init('https://api.brevo.com/v3/smtp/email');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'accept: application/json',
                'api-key: ' . $this->apiKey,
                'content-type: application/json',
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'sender' => ['name' => $fromName, 'email' => $from],
                'to' => [['email' => $to, 'name' => $toName]],
                'subject' => $subject,
                'htmlContent' => $htmlContent,
            ]));

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            \Log::info('Brevo response: ' . $httpCode . ' - ' . $response);

            return $httpCode === 201;
        } catch (\Exception $e) {
            \Log::error('Brevo error: ' . $e->getMessage());
            return false;
        }
    }
}
