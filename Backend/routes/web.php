<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Rutas de Google OAuth con rate limiting (10 intentos por minuto)
Route::middleware(['throttle:10,1'])->prefix('google-auth')->group(function () {
    Route::get('/redirect', [GoogleController::class, 'redirectToGoogle'])->name('google.redirect');
    Route::get('/callback', [GoogleController::class, 'handleGoogleCallback'])->name('google.callback');
});