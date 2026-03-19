<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://gestiloc-front.vercel.app',
        'https://gestiloc-front.vercel.app',
        env('FRONTEND_URL', 'https://gestiloc.vercel.app'),
    ],
    'allowed_origins_patterns' => ['https://*.vercel.app'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
