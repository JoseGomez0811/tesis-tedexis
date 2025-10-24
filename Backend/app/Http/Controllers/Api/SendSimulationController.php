<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendSimulationRequest;
// use App\Models\SendSimulation;
use App\Http\Requests\StoreSimulationRequest;
use App\Models\StoreSimulation;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Log;

class SendSimulationController extends Controller
{
    public function index()
    {
        $simulation = StoreSimulation::orderBy('id_simulation')->get([
        'id_simulation',
        'id_connection',
        'nameQueue',
        'system_id',
        'password',
        'phone_number',
        'message',
        'number',
        'short_code',
        'encoding',
        'id_db',
        'created_at',
    ]);
        return response()->json($simulation);
    }

    // public function send(SendSimulationRequest $request)
    // {
    //     // Obtener datos validados
    //     $datos = $request->validated();

    //     // (Opcional) Guardar en la base de datos local
    //     // SendSimulation::create($datos);

    //     // URL del web service en Java
    //     $url = 'https://localhost:9000/receive-data'; // Reemplázala con la URL real

    //     // Enviar los datos en JSON
    //     $response = Http::post($url, $datos);

    //     if ($response->successful()) {
    //         return response()->json([
    //             'message' => 'Datos enviados correctamente al web service.',
    //             'respuesta_web_service' => $response->json()
    //         ], 200);
    //     }

    //     return response()->json([
    //         'message' => 'Error al enviar datos al web service.',
    //         'error' => $response->body()
    //     ], $response->status());
    // }

    public function send(SendSimulationRequest $request)
    {
        try {
            $datos = $request->validated();

            Log::info("🎯 ENVÍO SÍNCRONO INICIADO", [
                'phone_number' => $datos['phoneNumber'] ?? 'N/A',
                'system_id' => $datos['systemID'] ?? 'N/A',
                'timestamp' => now()->format('H:i:s.v')
            ]);

            $java_host_name = 'host.docker.internal';
            $port = 9000;
            $url = "http://{$java_host_name}:{$port}/receive-data";

            // 🔥 Envío directo e inmediato - timeout corto para respuesta rápida
            $response = Http::timeout(15) // 15 segundos máximo
                            ->retry(2, 500) // 2 reintentos rápidos
                            ->post($url, $datos);

            if ($response->successful()) {
                Log::info("✅ ENVÍO SÍNCRONO EXITOSO", [
                    'phone_number' => $datos['phoneNumber'] ?? 'N/A',
                    'response_time' => now()->format('H:i:s.v'),
                    'web_service_status' => 'success'
                ]);

                return response()->json([
                    'message' => 'Simulación enviada y confirmada exitosamente al Web Service.',
                    'status' => 'success',
                    'web_service_response' => $response->json(),
                    'timestamp' => now()->toISOString()
                ], 200);

            } else {
                Log::warning("⚠️ ENVÍO SÍNCRONO - WEB SERVICE ERROR", [
                    'phone_number' => $datos['phoneNumber'] ?? 'N/A',
                    'status_code' => $response->status(),
                    'error_body' => substr($response->body(), 0, 200) // Solo primeros 200 chars
                ]);

                return response()->json([
                    'message' => 'El Web Service respondió con error.',
                    'status' => 'web_service_error',
                    'error' => 'HTTP ' . $response->status(),
                    'timestamp' => now()->toISOString()
                ], 502);
            }

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error("🔌 ERROR DE CONEXIÓN SÍNCRONO", [
                'phone_number' => $datos['phoneNumber'] ?? 'N/A',
                'error' => $e->getMessage(),
                'timestamp' => now()->format('H:i:s.v')
            ]);

            return response()->json([
                'message' => 'No se pudo conectar con el Web Service.',
                'status' => 'connection_error',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 503);

        } catch (\Throwable $e) {
            Log::error("💥 ERROR CRÍTICO SÍNCRONO", [
                'phone_number' => $datos['phoneNumber'] ?? 'N/A',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error interno del servidor.',
                'status' => 'internal_error',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    public function store(StoreSimulationRequest $request)
    {
        try {
            $data = $request->validated();

            // Agregamos la fecha de creación explícitamente (por claridad)
            $data['created_at'] = now();

            // Crear la simulación
            $simulation = StoreSimulation::create($data);

            return response()->json([
                'message' => 'Simulación creada exitosamente.',
                'success' => true,
                'data' => $simulation,
                'id_simulation' => $simulation->id_simulation
            ], 201);


        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
