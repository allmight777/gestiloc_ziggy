<?php

return [
    'env'             => env('FEDAPAY_ENV', 'sandbox'),
    'api_key'         => env('FEDAPAY_API_KEY', env('FEDAPAY_SECRET_KEY', '')),
    'public_key'      => env('FEDAPAY_PUBLIC_KEY', ''),
    'secret_key'      => env('FEDAPAY_SECRET_KEY', ''),
    'webhook_secret'  => env('FEDAPAY_WEBHOOK_SECRET', ''),
    'currency'        => env('FEDAPAY_CURRENCY', 'XOF'),
    'commission_rate' => env('FEDAPAY_COMMISSION_RATE', 0),
    'base_url'        => env('FEDAPAY_BASE_URL', 'https://api.fedapay.com/v1'),
    'back_url'        => env('FEDAPAY_BACK_URL', env('APP_URL', 'https://imona.app')),
];
