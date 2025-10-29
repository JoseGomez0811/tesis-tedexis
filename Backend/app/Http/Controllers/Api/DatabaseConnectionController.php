<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDBRequest;
use App\Http\Requests\LogsRequest;
use App\Models\DatabaseConnection;
use App\Models\Logs;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class DatabaseConnectionController extends Controller
{
    // 📋 Listar conexiones
    public function index()
    {
        $db = DatabaseConnection::orderBy('name')->get([
            'id', 'name', 'host', 'port', 'user', 'auth_db', 'name_db'
        ]);

        return response()->json($db);
    }

    // 💾 Guardar nueva conexión
    public function store(Request $request)
    {
        try {
            $data = $request->all();

            $storeData = [
                'name'      => $data['name'] ?? null,
                'host'      => $data['host'] ?? null,
                'port'      => $data['port'] ?? null,
                'user'      => $data['user'] ?? null,
                'password'  => $data['password'] ?? null,
                'auth_db'   => $data['auth_db'] ?? null,
                'name_db'   => $data['name_db'] ?? null,
                'created_at'=> now(),
            ];

            // ✅ Validar con las reglas del StoreDBRequest
            $validator = Validator::make($storeData, (new StoreDBRequest())->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al almacenar base de datos.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Crear registro de la base de datos
            $db = DatabaseConnection::create($storeData);

            /**
             * 🧾 Registrar Log
             * Solo si se proporciona id_user
             */
            if ($data['id_user']) {
                $logData = [
                    'id_user'     => $data['id_user'] ?? null,
                    'id_db'       => $db->id ?? null, // Usamos el ID real del servidor
                    'description' => "Se agregó una nueva base de datos: Nombre = {$db->name}, Host = {$db->host}, Puerto = {$db->port}",
                    'created_at'  => now(),
                ];

                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    Logs::create($logData);
                }
            }

            return response()->json([
                'message'  => 'Base de datos registrada exitosamente.',
                'database' => $db
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno del servidor.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    // 🔍 Mostrar conexión por ID
    public function show($id)
    {
        $connection = DatabaseConnection::findOrFail($id);
        $connection->makeHidden(['password']);

        return response()->json($connection, 200);
    }

    // ✏️ Actualizar conexión
    public function update(Request $request, $id)
    {
        $connection = DatabaseConnection::findOrFail($id);

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'host'     => 'required|string|max:255',
            'port'     => 'required|integer',
            'user'     => 'required|string|max:255',
            'password' => 'sometimes|nullable|string|max:255',
            'auth_db'  => 'required|string|max:255',
            'name_db'  => 'required|string|max:255',
        ]);

        // Solo actualizar el password si fue enviado
        if (!empty($validated['password'])) {
            $connection->password = $validated['password'];
        }

        // Actualizar los demás campos
        $connection->fill([
            'name'     => $validated['name'],
            'host'     => $validated['host'],
            'port'     => $validated['port'],
            'user'     => $validated['user'],
            'auth_db'  => $validated['auth_db'],
            'name_db'  => $validated['name_db'],
        ]);

        $connection->save();
        $connection->makeHidden(['password']);

        // Guardar datos para el log antes de eliminar
            $id_user = $request->input('id_user');

            if ($id_user) {
                $logData = [
                    'id_user'     => $id_user,
                    'id_db'   => $connection->id, // Usamos el ID real del servidor
                    'description' => "Se actualizó la base de datos: Nombre = {$connection->name}, Host = {$connection->host}, Puerto = {$connection->port}",
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
            'database' => $connection
        ], 200);
    }

    // 🗑️ Eliminar conexión
    // public function destroy($id)
    // {
    //     $connection = DatabaseConnection::findOrFail($id);
    //     $connection->delete();

    //     return response()->json([
    //         'message' => 'Conexión eliminada correctamente.'
    //     ], 200);
    // }

    public function destroy(Request $request, $id)
    {
        // Buscar el servidor
        $db = DatabaseConnection::findOrFail($id);

        // Guardar datos para el log antes de eliminar
        $id_user = $request->input('id_user');

            if ($id_user) {
                $logData = [
                    'id_user'     => $id_user,
                    'id_db'   => $db->id, // Usamos el ID real del servidor
                    'description' => "Se eliminó la base de datos: Nombre = {$db->name}, Host = {$db->host}, Puerto = {$db->port}",
                    'created_at'  => now(),
                ];

                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    Logs::create($logData);
                }
            }

        // Eliminar el servidor
        $db->delete();           

        return response()->json([
            'message' => 'Servidor eliminado correctamente.'
        ], 200);
    }
}
