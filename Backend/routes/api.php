<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ServerController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\DatabaseConnectionController;
use App\Http\Controllers\Auth\GoogleController;
use Illuminate\Http\Request;

Route::prefix('v1')->group(function () {
    // --- SERVERS ---
    Route::get('servers', [ServerController::class, 'index']);
    Route::post('servers', [ServerController::class, 'store']);
    Route::get('servers/{id}', [ServerController::class, 'show']);

    // --- SIMULATIONS ---
    //Route::post('simulations/send', [SimulationController::class, 'send']);

    // --- DATABASE CONNECTIONS ---
    Route::get('databases', [DatabaseConnectionController::class, 'index']);
    Route::post('databases', [DatabaseConnectionController::class, 'store']);
    Route::get('databases/{id}', [DatabaseConnectionController::class, 'show']);
    Route::put('databases/{id}', [DatabaseConnectionController::class, 'update']);
    Route::delete('databases/{id}', [DatabaseConnectionController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return response()->json($request->user());
});

// Rutas para gestión de permisos de usuarios (API)
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('admin/users/pending', [GoogleController::class, 'getPendingUsers']);
    Route::get('admin/users/all', [GoogleController::class, 'getAllUsers']);
    Route::post('admin/users/{userId}/authorize', [GoogleController::class, 'authorizeUser']);
    Route::post('admin/users/{userId}/reject', [GoogleController::class, 'rejectUser']);
});