<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Excluir rutas que no necesitan CSRF
    ];

    /**
     * Determine if the session and input CSRF tokens match.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function tokensMatch($request)
    {
        $sessionToken = $request->session()->token();
        
        // PRIORIDAD: Usar el token de la cookie directamente (Laravel lo desencripta automáticamente)
        // Esto es más confiable que intentar desencriptar el header manualmente
        $token = $request->cookie('XSRF-TOKEN');
        
        // Si no hay cookie, intentar obtener del header
        if (!$token) {
            $token = $this->getTokenFromRequest($request);
            
            // Si el token del header está encriptado, intentar desencriptarlo
            if ($token && $this->isEncrypted($token)) {
                try {
                    $decryptedToken = Crypt::decrypt($token, false);
                    // Si el token desencriptado tiene el formato correcto (40 caracteres), usarlo
                    if (strlen($decryptedToken) === 40) {
                        $token = $decryptedToken;
                    }
                } catch (\Exception $e) {
                    // Si falla, el token seguirá siendo el valor original
                    Log::warning('Failed to decrypt CSRF token from header', [
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        // Log para debug
        Log::info('CSRF Token Match Check', [
            'has_session_token' => !empty($sessionToken),
            'has_request_token' => !empty($token),
            'token_source' => $request->cookie('XSRF-TOKEN') ? 'cookie' : 'header',
            'session_token_preview' => $sessionToken ? substr($sessionToken, 0, 20) . '...' : 'NO',
            'request_token_preview' => $token ? substr($token, 0, 40) . '...' : 'NO',
            'session_token_length' => strlen($sessionToken ?? ''),
            'request_token_length' => strlen($token ?? ''),
        ]);

        $match = is_string($sessionToken) &&
               is_string($token) &&
               hash_equals($sessionToken, $token);

        Log::info('CSRF Token Match Result', [
            'match' => $match,
            'session_token' => $sessionToken,
            'request_token' => $token,
        ]);

        return $match;
    }

    /**
     * Get the CSRF token from the request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    protected function getTokenFromRequest($request)
    {
        // Laravel busca primero en X-XSRF-TOKEN, luego en X-CSRF-TOKEN
        $token = $request->header('X-XSRF-TOKEN') ?: $request->header('X-CSRF-TOKEN');

        return $token ?: $request->input('_token');
    }

    /**
     * Check if a string appears to be encrypted (Laravel encrypted format)
     *
     * @param  string  $value
     * @return bool
     */
    protected function isEncrypted($value)
    {
        // Laravel encrypted values are base64-encoded JSON objects with 'iv', 'value', 'mac', and 'tag' keys
        if (empty($value) || !is_string($value)) {
            return false;
        }
        
        // Verificar si comienza con caracteres típicos de base64
        if (!preg_match('/^[A-Za-z0-9+\/]+=*$/', $value)) {
            return false;
        }
        
        try {
            $decoded = json_decode(base64_decode($value, true), true);
            return is_array($decoded) && 
                   isset($decoded['iv']) && 
                   isset($decoded['value']) && 
                   isset($decoded['mac']);
        } catch (\Exception $e) {
            return false;
        }
    }
}

