<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ServerController;
use App\Http\Controllers\Api\ConnectionController;
use App\Http\Controllers\Api\SendSimulationController;
use App\Http\Controllers\Api\DatabaseConnectionController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Api\CollectionsDBController;
use App\Http\Controllers\Api\LogsController;
use App\Http\Controllers\Api\UsersController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // --- SERVERS ---
    Route::get('servers', [ServerController::class, 'index']);
    Route::post('servers', [ServerController::class, 'store']);
    Route::get('servers/{id}', [ServerController::class, 'show']);
    Route::put('servers/{id}', [ServerController::class, 'update']);
    Route::delete('servers/{id}', [ServerController::class, 'destroy']);

    // --- CONNECTIONS ---
    Route::get('connections', [ConnectionController::class, 'index']);
    Route::post('connections', [ConnectionController::class, 'store']);
    Route::get('connections/{id}', [ConnectionController::class, 'show']);
    Route::put('connections/{id}', [ConnectionController::class, 'update']);
    Route::delete('connections/{id}', [ConnectionController::class, 'destroy']);

    // --- DATABASE CONNECTIONS ---
    Route::get('databases', [DatabaseConnectionController::class, 'index']);
    Route::post('databases', [DatabaseConnectionController::class, 'store']);
    Route::get('databases/{id}', [DatabaseConnectionController::class, 'show']);
    Route::put('databases/{id}', [DatabaseConnectionController::class, 'update']);
    Route::delete('databases/{id}', [DatabaseConnectionController::class, 'destroy']);

    // --- COLLECTIONS MONGO BATABASE ---
    Route::get('/mongo/{id}/collections', [CollectionsDBController::class, 'getCollections']);
    Route::get('/mongo/{id}/collections/{collection}', [CollectionsDBController::class, 'getCollectionData']);
    Route::get('/mongo/{id}/collections/{collection}/{docId}', [CollectionsDBController::class, 'getDocument']);

    // --- SIMULATIONS ---
    Route::get('/get_simulation', [SendSimulationController::class, 'index']);
    Route::post('/store_data', [SendSimulationController::class, 'store']);
    Route::post('/send_data', [SendSimulationController::class, 'send']);
    //--------------------------------------------------------------------------------------------------------------------------------------
    Route::post('/simulation-status', [SendSimulationController::class, 'simulationStatus']);
    //-------------------------------------------------------------------------------------------------------------------------------------

    // --- LOGS ---
    Route::get('logs', [LogsController::class, 'index']);
    Route::post('store_logs', [LogsController::class, 'store']);

    // --- USERS ---
    Route::get('users', [UsersController::class, 'index']);
});

// Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
//     return response()->json($request->user());
// });

// Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
//     $user = $request->user();
//     return response()->json([
//         'id' => $user->id,
//         'name' => $user->name,
//         'email' => $user->email,
//         'authorization_status' => $user->authorization_status,
//         'role' => $user->role,
//         'avatar' => $user->avatar,
//     ]);
// });

// Debug endpoint (mantener con auth)
Route::middleware('auth:sanctum')->get('/debug/token', function (Request $request) {
    $user = $request->user();
    
    Log::info('Debug Token Request', [
        'user_id' => $user?->id,
        'user_email' => $user?->email,
        'token_preview' => substr($request->bearerToken() ?? 'NO_TOKEN', 0, 20),
        'headers' => $request->headers->all(),
    ]);
    
    return response()->json([
        'success' => true,
        'message' => 'Token válido',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'authorization_status' => $user->authorization_status,
        ],
        'token_info' => [
            'bearer_token_present' => !!$request->bearerToken(),
            'token_preview' => substr($request->bearerToken() ?? '', 0, 20) . '...',
        ]
    ]);
});

// Debug endpoint para CSRF
Route::middleware('auth:sanctum')->post('/debug/csrf', function (Request $request) {
    Log::info('Debug CSRF Request', [
        'headers' => $request->headers->all(),
        'csrf_token_header' => $request->header('X-CSRF-TOKEN'),
        'xsrf_token_header' => $request->header('X-XSRF-TOKEN'),
        'cookie_csrf' => $request->cookie('XSRF-TOKEN'),
        'all_cookies' => $request->cookies->all(),
    ]);
    
    return response()->json([
        'success' => true,
        'csrf_token_header' => $request->header('X-CSRF-TOKEN') ? substr($request->header('X-CSRF-TOKEN'), 0, 50) . '...' : 'NO',
        'xsrf_token_header' => $request->header('X-XSRF-TOKEN') ? substr($request->header('X-XSRF-TOKEN'), 0, 50) . '...' : 'NO',
        'cookie_csrf' => $request->cookie('XSRF-TOKEN') ? substr($request->cookie('XSRF-TOKEN'), 0, 50) . '...' : 'NO',
        'headers_received' => $request->headers->all(),
    ]);
});

// Rutas de administración - PROTEGIDAS con auth, admin y rate limiting
Route::middleware(['auth:sanctum', 'admin', 'throttle:60,1'])->prefix('admin')->group(function () {
    // Gestión de usuarios
    Route::get('users/pending', [GoogleController::class, 'getPendingUsers']);
    Route::get('users/all', [GoogleController::class, 'getAllUsers']);
    
    // Acciones sobre usuarios (más restrictivas: 30 peticiones por minuto)
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('users/{userId}/authorize', [GoogleController::class, 'authorizeUser']);
        Route::post('users/{userId}/reject', [GoogleController::class, 'rejectUser']);
        Route::post('users/{userId}/make-admin', [GoogleController::class, 'makeAdmin']);
        Route::post('users/{userId}/remove-admin', [GoogleController::class, 'removeAdmin']);
    });
});