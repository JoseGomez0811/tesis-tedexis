<?php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'google-auth/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['https://localhost'],

    'allowed_headers' => [
        'Content-Type', 
        'X-Requested-With', 
        'Accept', 
        'Authorization', 
        'X-XSRF-TOKEN',
        'X-CSRF-TOKEN'
    ],

    'exposed_headers' => ['Authorization'],

    'max_age' => 0,

    'supports_credentials' => true,
];