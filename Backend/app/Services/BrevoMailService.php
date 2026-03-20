<?php

namespace App\Services;

use GuzzleHttp\Client;

class BrevoMailService
{
    private $apiKey;
    private $client;

    public function __construct()
    {
        $this->apiKey = config('services.brevo.api_key', env('BREVO_API_KEY'));
        $this->client = new Client();
    }

    public function send(string $to, string $toName, string $subject, string $htmlContent, string $from = null, string $fromName = null): bool
    {
        try {
            $from = $from ?? env('MAIL_FROM_ADDRESS', 'agoliganange15@gmail.com');
            $fromName = $fromName ?? env('MAIL_FROM_NAME', 'Gestiloc');

            $response = $this->client->post('https://api.brevo.com/v3/smtp/email', [
                'headers' => [
                    'accept' => 'application/json',
                    'api-key' => $this->apiKey,
                    'content-type' => 'application/json',
                ],
                'json' => [
                    'sender' => ['name' => $fromName, 'email' => $from],
                    'to' => [['email' => $to, 'name' => $toName]],
                    'subject' => $subject,
                    'htmlContent' => $htmlContent,
                ],
            ]);

            return $response->getStatusCode() === 201;
        } catch (\Exception $e) {
            \Log::error('Brevo API error: ' . $e->getMessage());
            return false;
        }
    }
}
