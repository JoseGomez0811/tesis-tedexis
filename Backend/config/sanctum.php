<?php
// config/sanctum.php - Asegurar middleware
use Laravel\Sanctum\Sanctum;

return [
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),

    'guard' => ['web'],

    'expiration' => env('SANCTUM_EXPIRATION', 2),

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'TEDEXIS_'),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    ],
];