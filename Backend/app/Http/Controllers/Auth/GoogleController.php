<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

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

            // Crear o actualizar usuario
            $user = User::updateOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'password' => bcrypt(Str::random(16)),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => now(),
                ]
            );

            Auth::login($user);

            // Generar token Sanctum válido por 30 días
            $token = $user->createToken('google-login', ['*'], now()->addDays(30))->plainTextToken;

            Log::info('Token generado', [
                'user_id' => $user->id,
                'token_preview' => substr($token, 0, 10) . '...'
            ]);

            $userData = [
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'google_id' => $user->google_id,
                'email_verified_at' => $user->email_verified_at
            ];

            $redirectUrl = config('app.frontend_url') . '/app/perfil?token=' . urlencode($token) 
                        . '&user=' . urlencode(json_encode($userData));

            return redirect($redirectUrl);


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
}
