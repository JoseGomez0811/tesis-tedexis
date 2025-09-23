<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;

// Rutas de Google OAuth (sin prefijo api/)
Route::get('/google-auth/redirect', [GoogleController::class, 'redirectToGoogle']);
Route::get('/google-auth/callback', [GoogleController::class, 'handleGoogleCallback']);
// Ruta raíz si la necesitas
Route::get('/', function () {
    return view('welcome');
});