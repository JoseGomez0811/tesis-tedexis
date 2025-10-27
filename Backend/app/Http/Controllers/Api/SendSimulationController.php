<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendSimulationRequest;
use App\Http\Requests\StoreSimulationRequest;
use App\Http\Requests\LogsRequest;
use App\Models\StoreSimulation;
use App\Models\Logs;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator; // ✅ <-- ESTA ES LA LÍNEA FALTANTE

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

    public function send(Request $request)
    {
        // 1️⃣ Datos validados para envío al Web Service
        $datos = $request->all();

        $simData = [
                'hostServer' => $datos['hostServer'] ?? null,
                'portConnection' => $datos['portConnection'] ?? null,
                'typeConnection' => $datos['typeConnection'] ?? null,
                'nameQueue' => $datos['nameQueue'] ?? null,
                'systemID' => $datos['systemID'] ?? null,
                'password' => $datos['password'] ?? null,
                'phoneNumber' => $datos['phoneNumber'] ?? null,
                'message' => $datos['message'] ?? null,
                'number' => $datos['number'] ?? null,
                'shortCode' => $datos['shortCode'] ?? null,
                'encoding' => $datos['encoding'] ?? null,
                'created_at' => now(),
            ];

            // ✅ Validar con las reglas del StoreSimulationRequest
            $simRequest = new SendSimulationRequest();
            $validator = Validator::make($simData, $simRequest->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al enviar simulación.',
                    'errors' => $validator->errors(),
                ], 422);
            }

        // 2️⃣ URL del servicio Java (docker host)
        $java_host_name = 'host.docker.internal';
        $port = 9000;
        $url = "http://{$java_host_name}:{$port}/receive-data";

        try {
            // 3️⃣ Enviar datos al servicio Java
            $response = Http::timeout(30)
                ->retry(1, 1000, function ($exception, $request) {
                    return !($exception instanceof ConnectionException);
                })
                ->post($url, $simData);

            if (!$response->successful()) {
                return response()->json([
                    'message' => '❌ El Web Service Java respondió con error.',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ], $response->status());
            }

            // 4️⃣ Si el envío fue exitoso, almacenar simulación
            $storeData = [
                'id_connection' => $datos['id_connection'] ?? null,
                'nameQueue' => $datos['nameQueue'] ?? null,
                'system_id' => $datos['systemID'] ?? null,
                'password' => $datos['password'] ?? null,
                'phone_number' => $datos['phoneNumber'] ?? null,
                'message' => $datos['message'] ?? null,
                'number' => $datos['number'] ?? null,
                'short_code' => $datos['shortCode'] ?? null,
                'encoding' => $datos['encoding'] ?? null,
                'id_db' => $datos['id_db'] ?? null,
                'created_at' => now(),
            ];

            // ✅ Validar con las reglas del StoreSimulationRequest
            $storeRequest = new StoreSimulationRequest();
            $validator = Validator::make($storeData, $storeRequest->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al almacenar simulación.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Guardar en la base de datos
            $simulation = StoreSimulation::create($storeData);

            // 5️⃣ Si el envío fue exitoso, intentar crear un log asociado
            $logData = [
                'id_user' => $datos['id_user'] ?? null,
                'id_simulation' => $simulation->id_simulation ?? null,
                'id_server' => $datos['id_server'] ?? null,
                'id_connection' => $datos['id_connection'] ?? null,
                'id_db' => $datos['id_db'] ?? null,
                'description' => $datos['description'] ?? null,
                // 'description' => "El usuario ejecutó una simulación: Host = {$datos['hostServer']}, Puerto = {$datos['portConnection']}, Nombre Cola = {$datos['nameQueue']}, Número de Teléfono = {$datos['phoneNumber']}, Código Corto = {$datos['shortCode']}",
                'created_at' => now(),
            ];

            // Validar y crear log solo si se envió id_user
            if (!empty($logData['id_user'])) {
                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    // crear registro de log
                    Logs::create([
                        'id_user' => $logData['id_user'],
                        'id_server' => $logData['id_server'],
                        'id_connection' => $logData['id_connection'],
                        'id_db' => $logData['id_db'],
                        'id_simulation' => $logData['id_simulation'],
                        'description' => $logData['description'],
                    ]);
                }
                //Si falla la validación del log, no abortamos el flujo principal
            }

            // 6️⃣ Responder al frontend con éxito y el ID de simulación
            return response()->json([
                'message' => '✅ Simulación enviada y almacenada correctamente.',
                'success' => true,
                'service_url' => $url,
                'id_simulation' => $simulation->id_simulation,
                'data' => $simulation,
            ], 200);

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