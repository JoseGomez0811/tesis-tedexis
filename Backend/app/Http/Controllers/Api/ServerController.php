<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServerRequest;
use App\Http\Requests\LogsRequest;
use App\Models\Server;
use App\Models\Logs;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class ServerController extends Controller
{
    /**
     * 📜 Listar servidores
     */
    public function index()
    {
        $servers = Server::orderBy('name')->get(['id_server', 'name', 'url']);
        return response()->json($servers);
    }

    /**
     * ➕ Registrar nuevo servidor
     */
    public function store(Request $request)
    {
        try {
            $data = $request->all();

            $storeData = [
                'name' => $data['name'] ?? null,
                'url' => $data['url'] ?? null,
                'created_at' => now(),
            ];

            // ✅ Validación con FormRequest
            $storeRequest = new StoreServerRequest();
            $validator = Validator::make($storeData, $storeRequest->rules());

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validación al registrar servidor.',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            // ✅ Crear el servidor
            $server = Server::create($storeData);

            /**
             * 🧾 Registrar Log
             * Solo si se proporciona id_user
             */
            if ($data['id_user']) {
                $logData = [
                    'id_user'     => $data['id_user'] ?? null,
                    'id_server'     => $server->id_server ?? null,
                    'description'   => "Se agregó un nuevo servidor: Nombre = {$data['name']}, Host = {$data['url']}",
                    'created_at'  => now(),
                ];

                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    Logs::create($logData);
                }
            }

            return response()->json([
                'message' => 'Servidor registrado con éxito.',
                'server'  => $server
            ], 201);

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

    /**
     * 🔍 Mostrar un servidor por ID
     */
    public function show($id)
    {
        $server = Server::findOrFail($id);
        return response()->json($server, 200);
    }

    /**
     * ✏️ Actualizar servidor
     */
    public function update(Request $request, $id)
    {
        try {
            $server = Server::findOrFail($id);

            $validated = $request->validate([
                // 'name' => [
                //     'required',
                //     'string',
                //     'max:191',
                //     Rule::unique('servers', 'name')->ignore($id, 'id_server') // 👈 clave aquí
                // ],
                'name' => 'required|string|max:191',
                'url'  => 'required|string|max:255',
            ]);

            // ✅ Actualizar el servidor
            $server->name = $validated['name'];
            $server->url  = $validated['url']; // 👈 debe ser 'url', no 'host'
            $server->save();

            // Guardar datos para el log antes de eliminar
            $id_user = $request->input('id_user');

            if ($id_user) {
                $logData = [
                    'id_user'     => $id_user,
                    'id_server'   => $server->id_server, // Usamos el ID real del servidor
                    'description' => "Se actualizó el servidor: Nombre = {$server->name}, Host = {$server->url}",
                    'created_at'  => now(),
                ];

                $logsRequest = new LogsRequest();
                $validatorLog = Validator::make($logData, $logsRequest->rules());

                if (!$validatorLog->fails()) {
                    Logs::create($logData);
                }
            }

            return response()->json([
                'message' => 'Servidor actualizado correctamente.',
                'server'  => $server
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


    /**
     * 🗑️ Eliminar servidor
     */
    // public function destroy($id)
    // {
    //     $server = Server::findOrFail($id);
    //     $server->delete();

    //     return response()->json([
    //         'message' => 'Servidor eliminado correctamente.'
    //     ], 200);
    // }

    public function destroy(Request $request, $id)
    {
        // Buscar el servidor
        $server = Server::findOrFail($id);

        // Guardar datos para el log antes de eliminar
        $id_user = $request->input('id_user');

        if ($id_user) {
            $logData = [
                'id_user'     => $id_user,
                'id_server'   => $server->id_server, // Usamos el ID real del servidor
                'description' => "Se eliminó el servidor: Nombre = {$server->name}, Host = {$server->url}",
                'created_at'  => now(),
            ];

            $logsRequest = new LogsRequest();
            $validatorLog = Validator::make($logData, $logsRequest->rules());

            if (!$validatorLog->fails()) {
                Logs::create($logData);
            }
        }

        // Eliminar el servidor
        $server->delete();

        return response()->json([
            'message' => 'Servidor eliminado correctamente.'
        ], 200);
    }

}
