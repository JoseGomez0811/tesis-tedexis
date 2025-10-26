<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServerRequest;
use App\Models\Server;   
use App\Http\Requests\LogsRequest; 
use App\Models\Logs;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class ServerController extends Controller
{
    // Listar servidores (para llenar el select en Angular)
    public function index()
    {
        $servers = Server::orderBy('name')->get(['id_server','name','url']);
        return response()->json($servers);
    }

    // Guardar nuevo servidor (addServer.component -> POST)
    public function store(Request $request)
    {
        try {
            $data = $request->all();

            $storeData = [
                'name' => $data['name'] ?? null,
                'url' => $data['url'] ?? null,
                'created_at' => now(),
            ];

            // ✅ Validar con las reglas del StoreSimulationRequest
            $storeRequest = new StoreServerRequest();
            $validator = Validator::make($storeData, $storeRequest->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al almacenar servidor.',
                    'errors' => $validator->errors(),
                ], 422);
            }
            $server = Server::create($storeData);

            $logData = [
                'id_user' => $data['id_user'] ?? null,
                'id_simulation' => $simulation->id_simulation ?? null,
                'id_server' => $server->id_server ?? null,
                'id_connection' => $connection->id_connection ?? null,
                'id_db' => $data['id_db'] ?? null,
                'description' => "Se agregó un nuevo servidor: Nombre = {$data['name']}, Host = {$data['url']}",
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

            return response()->json([
            'message' => 'Servidor creado',
            'server' => $server
        ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $server = Server::findOrFail($id);
        return response()->json($server);
    }
}
