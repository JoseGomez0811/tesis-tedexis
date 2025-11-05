<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1️⃣ Verificar autenticación
        if (!$user) {
            Log::warning('Intento de acceso a ruta admin sin autenticación', [
                'ip' => $request->ip(),
                'route' => $request->path(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'No autenticado.',
            ], 401);
        }

        // 2️⃣ Verificar estado de autorización
        if ($user->authorization_status !== 'authorized') {
            Log::warning('Usuario no autorizado intentó acceder a ruta admin', [
                'user_id' => $user->id,
                'email' => $user->email,
                'status' => $user->authorization_status,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Usuario no autorizado.',
            ], 403);
        }

        // 3️⃣ Verificar rol de administrador
        if ($user->role !== 'admin') {
            Log::warning('Acceso denegado: usuario sin rol admin', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'ip' => $request->ip(),
                'route' => $request->path(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Acceso denegado. Se requieren privilegios de administrador.',
            ], 403);
        }

        // 4️⃣ Acceso permitido
        Log::info('Acceso admin autorizado', [
            'user_id' => $user->id,
            'email' => $user->email,
            'route' => $request->path(),
        ]);

        return $next($request);
    }
}
