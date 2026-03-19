<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*', '*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => [
        'https://gestiloc-front.vercel.app',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'X-XSRF-TOKEN',
    ],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
