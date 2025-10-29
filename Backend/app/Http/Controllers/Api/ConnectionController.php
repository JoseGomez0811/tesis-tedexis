<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConnectionRequest;
use App\Models\Connection;  
use App\Http\Requests\LogsRequest; 
use App\Models\Logs;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    // Listar servidores (para llenar el select en Angular)
    public function index()
    {
        // Obtener todas las conexiones junto con los datos del servidor asociado
        $connections = Connection::with('server')->orderBy('name')->get(['id_connection','name', 'type','port','path', 'id_server']);

        return response()->json($connections);
    }


    // Guardar nuevo servidor (addServer.component -> POST)
    public function store(Request $request)
    {
        try {
            $data = $request->all();

            $storeData = [
                'name' => $data['name'] ?? null,
                'type' => $data['type'] ?? null,
                'port' => $data['port'] ?? null,
                'path' => $data['path'] ?? null,
                'id_server' => $data['id_server'] ?? null,
                'created_at' => now(),
            ];

            // ✅ Validar con las reglas del StoreSimulationRequest
            $storeRequest = new StoreConnectionRequest();
            $validator = Validator::make($storeData, $storeRequest->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al almacenar conexión.',
                    'errors' => $validator->errors(),
                ], 422);
            }
            $connection = Connection::create($storeData);

            /**
             * 🧾 Registrar Log
             * Solo si se proporciona id_user
             */
            if ($data['id_user']) {
                $logData = [
                    'id_user'     => $data['id_user'] ?? null,
                    'id_connection' => $connection->id_connection ?? null,
                    'description' => "Se agregó una nueva conexión: Nombre = {$data['name']}, Tipo = {$data['type']}, Puerto = {$data['port']}",
                    'created_at'  => now(),
                ];

                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    Logs::create($logData);
                }
            }
            
            return response()->json([
                'message' => 'Conexión creada',
                'connection' => $connection
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
        $connection = Connection::findOrFail($id);
        return response()->json($connection);
    }

    public function update(Request $request, $id)
    {
        try {
            $connection = Connection::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:191',
                'type' => 'required|string|max:255',
                'port' => 'required|integer|min:1|max:65535',
                'path' => 'nullable|string|max:255',
                'id_server' => 'required|exists:servers,id_server',
            ]);

            // ✅ Actualizar el servidor
            $connection->name = $validated['name'];
            $connection->type  = $validated['type'];
            $connection->port  = $validated['port'];
            $connection->path  = $validated['path'];
            $connection->id_server  = $validated['id_server'];
            $connection->save();

            // Guardar datos para el log antes de eliminar
            $id_user = $request->input('id_user');

            if ($id_user) {
                $logData = [
                    'id_user'     => $id_user,
                    'id_connection'   => $connection->id_connection, // Usamos el ID real del servidor
                    'description' => "Se actualizó una nueva conexión: Nombre = {$connection->name}, Tipo = {$connection->type}, Puerto = {$connection->port}",
                    'created_at'  => now(),
                ];

                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    Logs::create($logData);
                }
            }

            return response()->json([
                'message' => 'Conexión actualizada correctamente.',
                'server'  => $connection
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación.',
                'errors'  => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno del servidor.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        // Buscar el servidor
        $connection = Connection::findOrFail($id);

        // Guardar datos para el log antes de eliminar
        $id_user = $request->input('id_user');

        if ($id_user) {
            $logData = [
                'id_user'     => $id_user,
                'id_connection'   => $connection->id_connection, // Usamos el ID real del servidor
                'description' => "Se eliminó una nueva conexión: Nombre = {$connection->name}, Tipo = {$connection->type}, Puerto = {$connection->port}",
                'created_at'  => now(),
            ];

            $logsRequest = new LogsRequest();
            $validatorLog = Validator::make($logData, $logsRequest->rules());

            if (!$validatorLog->fails()) {
                Logs::create($logData);
            }
        }

        // Eliminar la conexión
        $connection->delete();

        return response()->json([
            'message' => 'Conexión eliminada correctamente.'
        ], 200);
    }
}
