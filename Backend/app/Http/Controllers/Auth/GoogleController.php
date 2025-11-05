<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class GoogleController extends Controller
{
    /**
     * Redirige a Google OAuth
     */
    public function redirectToGoogle()
    {
        try {
            Log::info('Iniciando redirección a Google OAuth');
            /** @var \Laravel\Socialite\Two\GoogleProvider  */
            $driver = Socialite::driver('google');
            return $driver->stateless()->redirect();
        } catch (\Exception $e) {
            Log::error('Error en redirección a Google: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al iniciar sesión con Google',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Maneja el callback de Google OAuth
     */
    public function handleGoogleCallback()
    {
        try {
            Log::info('Procesando callback de Google OAuth');

            /** @var \Laravel\Socialite\Two\GoogleProvider  */
            $driver = Socialite::driver('google');
            $googleUser = $driver->stateless()->user();

            Log::info('Usuario de Google obtenido', [
                'email' => $googleUser->getEmail(),
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId()
            ]);

            // Validar dominio de email
            $emailDomain = substr(strrchr($googleUser->getEmail(), "@"), 1);
            $allowedDomains = ['tedexis.com', 'gmail.com', 'correo.unimet.edu.ve'];
            if (!in_array($emailDomain, $allowedDomains)) {
                Log::warning('Dominio no permitido', ['email' => $googleUser->getEmail(), 'domain' => $emailDomain]);
                return redirect(config('app.frontend_url') . '/login?error=domain_not_allowed&domain=' . urlencode($emailDomain));
            }


            // Buscar usuario existente
            $user = User::where('email', $googleUser->getEmail())->first();
            $isSpecial = $googleUser->getEmail() === config('auth.admin_email');
            if (!$user) {
                // Primera vez: crear usuario
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => bcrypt(Str::random(16)),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                    'authorization_status' => $isSpecial ? 'authorized' : 'pending',
                    'role' => $isSpecial ? 'admin' : 'user', // 👈 agrega este campo si manejas roles
                ]);
            } else if ($isSpecial && $user->authorization_status !== 'authorized') {
                // Si ya existe y es el especial, actualizar a autorizado
                $user->authorization_status = 'authorized';
                $user->save();
            }


            // Si no está autorizado, notificar y no permitir acceso
            if ($user->authorization_status !== 'authorized') {
                return redirect(config('app.frontend_url') . '/login?status=pending');
            }

            // Usuario autorizado: login y redirigir
            Auth::login($user);
            $token = $user->createToken('google-login', ['*'], now()->addMinutes(15))->plainTextToken;

            // Log::info('Token generado', [
            //     'user_id' => $user->id,
            //     'token_preview' => substr($token, 0, 10) . '...',
            //     'redirect_url' => config('app.frontend_url') . '/app/perfil'
            // ]);

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'google_id' => $user->google_id,
                'email_verified_at' => $user->email_verified_at,
                'authorization_status' => $user->authorization_status,
                'role' => $user->role ?? 'user'
            ];
                
            $frontendUrl = config('app.frontend_url') . '/auth-callback';
            $fragment = http_build_query([
                'token' => $token,
                'user' => urlencode(json_encode($userData))
            ]);

            return redirect($frontendUrl . '#' . $fragment);

        } catch (\Exception $e) {
            Log::error('Error en callback de Google', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect(
                config('app.frontend_url') . '/login?error=auth_failed&details=' . urlencode($e->getMessage())
            );
        }
    }

    /**
     * Obtiene lista de usuarios pendientes de autorización
     */
    public function getPendingUsers()
    {
        try {
            $pendingUsers = User::pending()
                ->select(['id', 'name', 'email', 'avatar', 'created_at', 'authorization_status', 'role']) // 👈 Agregado 'role'
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $pendingUsers
            ]);
        } catch (\Exception $e) {
            Log::error('Error obteniendo usuarios pendientes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener usuarios pendientes'
            ], 500);
        }
    }

    public function getAllUsers()
    {
        try {
            $users = User::select(['id', 'name', 'email', 'avatar', 'created_at', 'authorization_status', 'role']) // 👈 Agregado 'role'
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Error obteniendo todos los usuarios: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al obtener usuarios'
            ], 500);
        }
    }


    /**
     * Autoriza un usuario
     */
    public function authorizeUser($userId)
    {
        try {
            // Debug: Log CSRF token info
            Log::info('CSRF Debug - authorizeUser', [
                'csrf_token_header' => request()->header('X-CSRF-TOKEN') ? substr(request()->header('X-CSRF-TOKEN'), 0, 50) . '...' : 'NO',
                'xsrf_token_header' => request()->header('X-XSRF-TOKEN') ? substr(request()->header('X-XSRF-TOKEN'), 0, 50) . '...' : 'NO',
                'cookie_csrf' => request()->cookie('XSRF-TOKEN') ? substr(request()->cookie('XSRF-TOKEN'), 0, 50) . '...' : 'NO',
                'all_headers' => request()->headers->all(),
            ]);
            
            $user = User::findOrFail($userId);
            $user->authorize();

            Log::info('Usuario autorizado', [
                'user_id' => $userId,
                'user_email' => $user->email,
                'authorized_by' => Auth::user()?->email ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario autorizado exitosamente',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'authorization_status' => $user->authorization_status
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error autorizando usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al autorizar usuario'
            ], 500);
        }
    }

    /**
     * Rechaza un usuario
     */
    public function rejectUser($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->reject();

            Log::info('Usuario rechazado', [
                'user_id' => $userId,
                'user_email' => $user->email,
                'rejected_by' => Auth::user()?->email ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario rechazado exitosamente',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'authorization_status' => $user->authorization_status
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error rechazando usuario: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al rechazar usuario'
            ], 500);
        }
    }

    /**
     * Asigna el rol de administrador a un usuario
     */
    public function makeAdmin($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->role = 'admin';
            $user->save();

            Log::info('Usuario promovido a admin', [
                'user_id' => $userId,
                'user_email' => $user->email,
                'changed_by' => Auth::user()?->email ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario ahora es administrador',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al hacer admin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al asignar rol de administrador'
            ], 500);
        }
    }

    /**
     * Quita el rol de administrador a un usuario
     */
    public function removeAdmin($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $user->role = 'user';
            $user->save();

            Log::info('Rol de administrador eliminado', [
                'user_id' => $userId,
                'user_email' => $user->email,
                'changed_by' => Auth::user()?->email ?? 'system'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario ya no es administrador',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al quitar admin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error al quitar rol de administrador'
            ], 500);
        }
    }


}
