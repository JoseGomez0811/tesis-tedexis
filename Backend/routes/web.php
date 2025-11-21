<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Support\Facades\Mail;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Rutas de Google OAuth con rate limiting (10 intentos por minuto)
Route::middleware(['throttle:10,1'])->prefix('google-auth')->group(function () {
    Route::get('/redirect', [GoogleController::class, 'redirectToGoogle'])->name('google.redirect');
    Route::get('/callback', [GoogleController::class, 'handleGoogleCallback'])->name('google.callback');
});

Route::get('/test-mail', function () {
    try {
        $recipient = 'correoauxiliar459@gmail.com';
        $mailConfig = config('mail');
        
        // Validar configuración de correo
        $mailer = $mailConfig['default'] ?? 'log';
        $fromAddress = $mailConfig['from']['address'] ?? 'noreply@example.com';
        $fromName = $mailConfig['from']['name'] ?? 'Laravel';
        
        // Intentar enviar el correo
        Mail::raw('Esto es un correo de prueba desde Laravel 🚀', function ($message) use ($recipient, $fromAddress, $fromName) {
            $message->to($recipient)
                    ->from($fromAddress, $fromName)
                    ->subject('Correo de prueba - ' . now()->format('Y-m-d H:i:s'));
        });
        
        return response()->json([
            'success' => true,
            'message' => 'Correo enviado exitosamente ✅',
            'details' => [
                'recipient' => $recipient,
                'mailer' => $mailer,
                'from' => [
                    'address' => $fromAddress,
                    'name' => $fromName
                ],
                'sent_at' => now()->toDateTimeString()
            ]
        ], 200);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al enviar correo ❌',
            'error' => $e->getMessage(),
            'details' => [
                'mailer' => config('mail.default', 'unknown'),
                'trace' => config('app.debug') ? $e->getTraceAsString() : 'Habilitar APP_DEBUG para ver el trace'
            ]
        ], 500);
    }
});