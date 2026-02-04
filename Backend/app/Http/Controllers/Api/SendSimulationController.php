<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendSimulationRequest;
use App\Http\Requests\StoreSimulationRequest;
use App\Models\Logs;
use App\Models\StoreSimulation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SendSimulationController extends Controller
{
    public function index()
    {
        $simulations = StoreSimulation::orderBy('created_at', 'desc')->get([
            'id_simulation',
            'id_connection',
            'nameQueue',
            'system_id',
            'phone_number',
            'message',
            'number',
            'short_code',
            'encoding',
            'id_db',
            'collection',
            'result',
            'created_at',
        ]);
        
        // Asegurar que la contraseña no se muestre en las respuestas JSON
        $simulations->makeHidden(['password']);
        
        return response()->json($simulations);
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

                $simData = [
                    'hostServer' => $sim['hostServer'] ?? null,
                    'portConnection' => $sim['portConnection'] ?? null,
                    'typeConnection' => $sim['typeConnection'] ?? null,
                    'nameQueue' => $sim['nameQueue'] ?? null,
                    'systemID' => $sim['systemID'] ?? null,
                    'password' => $sim['password'] ?? null,
                    'phoneNumber' => $sim['phoneNumber'] ?? null,
                    'message' => $sim['message'] ?? null,
                    'number' => $sim['number'] ?? null,
                    'shortCode' => $sim['shortCode'] ?? null,
                    'encoding' => $sim['encoding'] ?? null,
                    'created_at' => now(),
                ];
                $validator = Validator::make($simData, (new SendSimulationRequest())->rules());

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

                $timestamp = Carbon::now()->toISOString();

                $payload = [
                    'simulations' => $datos['simulations'],
                    'total' => count($datos['simulations']),
                    'timestamp' => $timestamp,
                    'type' => $datos['type'] ?? 'desconocido',
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
                
                // ✅ Guardar en caché el estado inicial reportado por el Web Service (stage 1)
                $body = $response->json() ?? [];

                $statusData = [
                    'timestamp' => $timestamp,
                    'stage' => $body['stage'] ?? 1,
                    'status' => $body['status'] ?? 'received',
                    'message' => $body['message'] ?? 'Datos recibidos por el Web Service.',
                    'total_simulations' => $payload['total'],
                    'successful_simulations' => null,
                    'failed_simulations' => null,
                    'error_details' => [],
                    'updated_at' => Carbon::now()->toISOString(),
                ];

                Cache::put(
                    'simulation_status:' . $timestamp,
                    $statusData,
                    now()->addMinutes(10)
                );

                // $storeData = [
                //     'id_connection' => $datos['simulations']['id_connection'] ?? null,
                //     'nameQueue' => $datos['simulations']['nameQueue'] ?? null,
                //     'system_id' => $datos['simulations']['systemID'] ?? null,
                //     'password' => $datos['simulations']['password'] ?? null,
                //     'phone_number' => $datos['simulations']['phoneNumber'] ?? null,
                //     'message' => $datos['simulations']['message'] ?? null,
                //     'number' => $datos['simulations']['number'] ?? null,
                //     'short_code' => $datos['simulations']['shortCode'] ?? null,
                //     'encoding' => $datos['simulations']['encoding'] ?? null,
                //     'id_db' => $datos['simulations']['id_db'] ?? null,
                //     'created_at' => now(),
                // ];

                // StoreSimulationRequest::store($storeData);

                return response()->json([
                    'message' => '✅ Simulaciones enviadas correctamente al Web Service Java.',
                    'count' => count($results),
                    'results' => $results,
                    // ID de correlación para que el frontend pueda consultar el estado
                    'requestId' => $timestamp,
                    // Respuesta cruda del Web Service (stage 1)
                    'webservice' => $body,
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

    /**
     * Endpoint llamado por el Web Service Java con el resultado final (stage 2).
     */
    public function simulationStatus(Request $request)
    {
        $data = $request->all();
        $timestamp = $data['timestamp'] ?? null;

        if (!$timestamp) {
            return response()->json([
                'success' => false,
                'message' => 'El campo timestamp es obligatorio para correlacionar la simulación.',
            ], 422);
        }

        $statusData = [
            'timestamp' => $timestamp,
            'stage' => $data['stage'] ?? 2,
            'status' => $data['status'] ?? 'unknown',
            'message' => $data['message'] ?? null,
            'total_simulations' => $data['total_simulations'] ?? null,
            'successful_simulations' => $data['successful_simulations'] ?? null,
            'failed_simulations' => $data['failed_simulations'] ?? null,
            'error_details' => $data['error_details'] ?? [],
            'updated_at' => Carbon::now()->toISOString(),
        ];

        Cache::put(
            'simulation_status:' . $timestamp,
            $statusData,
            now()->addMinutes(10)
        );

        return response()->json([
            'success' => true,
            'message' => 'Estado de simulación recibido correctamente.',
        ]);
    }

    /**
     * Endpoint para que el frontend consulte el estado de una simulación
     * usando el requestId (timestamp) devuelto al iniciar el envío.
     */
    public function checkSimulationStatus(Request $request)
    {
        $requestId = $request->input('requestId');

        if (!$requestId) {
            return response()->json([
                'success' => false,
                'message' => 'El campo requestId es obligatorio.',
            ], 422);
        }

        $status = Cache::get('simulation_status:' . $requestId);

        if (!$status) {
            return response()->json([
                'success' => true,
                'exists' => false,
                'requestId' => $requestId,
            ]);
        }

        return response()->json([
            'success' => true,
            'exists' => true,
            'requestId' => $requestId,
            'data' => $status,
        ]);
    }

    /**
     * Alias simple por si se usa la ruta /simulation-results.
     */
    public function simulationResults(Request $request)
    {
        return $this->checkSimulationStatus($request);
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

    /**
     * Actualizar el resultado de una simulación
     */
    public function updateResult(Request $request, $id)
    {
        try {
            $request->validate([
                'result' => 'required|string|in:Simulación enviada con éxito,Error al enviar la simulación',
            ]);

            $simulation = StoreSimulation::find($id);

            if (!$simulation) {
                return response()->json([
                    'message' => 'Simulación no encontrada.',
                    'success' => false,
                ], 404);
            }

            $simulation->result = $request->result;
            $simulation->save();

            return response()->json([
                'message' => 'Resultado de simulación actualizado exitosamente.',
                'success' => true,
                'data' => $simulation,
            ], 200);

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