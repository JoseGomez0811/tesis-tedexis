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
                'collection',
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

                $payload = [
                    'simulations' => $datos['simulations'],
                    'total' => count($datos['simulations']),
                    'timestamp' => Carbon::now()->toISOString(),
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

    //------------------------------------------------------------------------------------------------------------------------
    public function simulationStatus(Request $request)
    {
        $data = $request->validate([
            'protocol' => 'required|string',
            'success' => 'required|boolean',
            'message' => 'required|string',
            'timestamp' => 'required|numeric',
        ]);

        // (Opcional) guardar log
        try {
            Logs::create([
                'id_user' => 1, // Usuario del sistema
                'id_server' => null,
                'id_connection' => null,
                'id_db' => null,
                'id_simulation' => null,
                'description' => sprintf(
                    'Simulation Status - Protocol: %s, Success: %s, Message: %s',
                    $data['protocol'],
                    $data['success'] ? 'Yes' : 'No',
                    $data['message']
                ),
            ]);
        } catch (\Exception $e) {
            // No fallar si el log no se puede guardar
        }

        // Emitir evento para frontend
        broadcast(new \App\Events\SimulationStatusEvent($data))->toOthers();

        return response()->json(['ok' => true]);
    }
    //------------------------------------------------------------------------------------------------------------------------------

}
