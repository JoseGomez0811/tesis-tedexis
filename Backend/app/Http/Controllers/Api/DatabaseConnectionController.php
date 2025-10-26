<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDBRequest;
use App\Models\DatabaseConnection;
use App\Http\Requests\LogsRequest; 
use App\Models\Logs;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class DatabaseConnectionController extends Controller
{
    // Listar conexiones
    public function index()
    {
        $db = DatabaseConnection::orderBy('name')->get(['id','name','host','port','user', 'auth_db', 'name_db']);
        return response()->json($db);
    }

    // Guardar nueva conexión
    public function store(Request $request)
    {
        try {
            $data = $request->all();

            $storeData = [
                'name' => $data['name'] ?? null,
                'host' => $data['host'] ?? null,
                'port' => $data['port'] ?? null,
                'user' => $data['user'] ?? null,
                'password' => $data['password'] ?? null,
                'auth_db' => $data['auth_db'] ?? null,
                'name_db' => $data['name_db'] ?? null,
                'created_at' => now(),
            ];

            // ✅ Validar con las reglas del StoreSimulationRequest
            $storeRequest = new StoreDBRequest;
            $validator = Validator::make($storeData, $storeRequest->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al almacenar base de datos.',
                    'errors' => $validator->errors(),
                ], 422);
            }
            $db = DatabaseConnection::create($storeData);

            $logData = [
                'id_user' => $data['id_user'] ?? null,
                'id_simulation' => $simulation->id_simulation ?? null,
                'id_server' => $data['id_server'] ?? null,
                'id_connection' => $connection->id_connection ?? null,
                'id_db' => $db->id ?? null,
                'description' => "Se agregó una nueva base de datos: Nombre = {$data['name']}, Host = {$data['host']}, Puerto = {$data['port']}",
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
            'message' => 'Base de datos registrada',
            'database' => $db
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

    // Mostrar conexión por ID
    public function show($id)
    {
        $connection = DatabaseConnection::findOrFail($id);
        // Remover password de la respuesta
        $connection->makeHidden(['password']);
        return response()->json($connection, 200);
    }

    // Actualizar conexión
    public function update(Request $request, $id)
    {
        $connection = DatabaseConnection::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'host'     => 'required|string|max:255',
            'port'     => 'required|integer',
            'user'     => 'required|string|max:255',
            // password será opcional en actualización; solo validar si viene
            'password' => 'sometimes|nullable|string|max:255',
            'auth_db'  => 'required|string|max:255',
            'name_db'  => 'required|string|max:255',
        ]);

        // Solo actualizamos password si fue enviada
        if (array_key_exists('password', $validated) && $validated['password'] !== null) {
            $connection->password = $validated['password'];
        }

        // Actualizamos el resto de campos
        $connection->name = $validated['name'];
        $connection->host = $validated['host'];
        $connection->port = $validated['port'];
        $connection->user = $validated['user'];
        $connection->auth_db = $validated['auth_db'];
        $connection->name_db = $validated['name_db'];

        $connection->save();

        // Remover password de la respuesta
        $connection->makeHidden(['password']);

        return response()->json($connection, 200);
    }

    // Eliminar conexión
    public function destroy($id)
    {
        $connection = DatabaseConnection::findOrFail($id);
        $connection->delete();

        return response()->json(['message' => 'Database connection deleted'], 200);
    }
}
