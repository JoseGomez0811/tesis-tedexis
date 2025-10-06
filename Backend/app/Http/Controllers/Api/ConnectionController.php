<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConnectionRequest;
use App\Models\Connection;   
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    // Listar servidores (para llenar el select en Angular)
    public function index()
    {
        $connections = Connection::orderBy('name')->get(['id_connection','name', 'type','port','path', 'id_server']);
        return response()->json($connections);
    }

    // Guardar nuevo servidor (addServer.component -> POST)
    public function store(StoreConnectionRequest $request)
    {
        try {
            $data = $request->validated();
            $connection = Connection::create($data);
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
}
