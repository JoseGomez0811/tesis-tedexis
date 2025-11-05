<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendSimulationRequest;
use App\Models\Logs;
use App\Models\StoreSimulation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SendSimulationController extends Controller
{
    public function index()
    {
        return response()->json(
            StoreSimulation::orderBy('id_simulation')->get([
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
            ])
        );
    }

    public function send(Request $request)
    {
        try {
            $datos = $request->all();

            // 🔄 Normalizar el formato (por si viene una sola simulación)
            if (isset($datos['hostServer'])) {
                $datos = ['simulations' => [$datos]];
            }

            if (!isset($datos['simulations']) || !is_array($datos['simulations']) || empty($datos['simulations'])) {
                return response()->json(['message' => 'No se encontraron simulaciones válidas.'], 400);
            }

            $results = [];

            // ✅ Validar todas las simulaciones antes del envío
            foreach ($datos['simulations'] as $sim) {
                $validator = Validator::make($sim, (new SendSimulationRequest())->rules());

                if ($validator->fails()) {
                    $results[] = [
                        'phoneNumber' => $sim['phoneNumber'] ?? 'N/A',
                        'status' => 'error',
                        'errors' => $validator->errors(),
                    ];
                    continue;
                }

                //FALTA ALMACENAR LA SIMULACIÓN Y REGISTRAR EL LOG

                $results[] = [
                    'phoneNumber' => $sim['phoneNumber'] ?? 'N/A',
                    'status' => 'ok',
                ];
            }

            // 🚀 Si al menos una simulación fue válida
            if (collect($results)->contains(fn($r) => $r['status'] === 'ok')) {

                $payload = [
                    'simulations' => $datos['simulations'],
                    'total' => count($datos['simulations']),
                    'timestamp' => Carbon::now()->toISOString(),
                ];

                $url = "http://host.docker.internal:9000/receive-data";

                // 📡 Enviar al Web Service Java
                $response = Http::timeout(60)
                    ->retry(1, 1000, fn($e) => !($e instanceof ConnectionException))
                    ->post($url, $payload);

                if (!$response->successful()) {
                    return response()->json([
                        'message' => '❌ El Web Service Java respondió con error.',
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ], $response->status());
                }

                return response()->json([
                    'message' => '✅ Simulaciones enviadas correctamente al Web Service Java.',
                    'count' => count($results),
                    'results' => $results,
                ]);
            }

            return response()->json(['message' => 'Ninguna simulación válida para enviar.'], 400);

        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Fallo de red al conectar con el Web Service Java.',
                'error' => $e->getMessage(),
            ], 503);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno al procesar la simulación.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
