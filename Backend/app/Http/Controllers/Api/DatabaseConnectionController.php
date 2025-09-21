<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDBRequest;
use App\Models\DatabaseConnection;
use Illuminate\Http\Request;

class DatabaseConnectionController extends Controller
{
    // Listar conexiones
    public function index()
    {
        $db = DatabaseConnection::orderBy('name')->get(['id','name','host','port','user', 'bd_user', 'bd_mensaje', 'collection']);
        return response()->json($db);
    }

    // Guardar nueva conexión
    public function store(StoreDBRequest $request)
    {
        $data = $request->validated();
        $db = DatabaseConnection::create($data);

        return response()->json([
            'message' => 'Base de datos registrada',
            'database' => $db
        ], 201);
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
            'host'       => 'required|string|max:255',
            'port'     => 'required|integer',
            'user'    => 'required|string|max:255',
            'password' => 'required|string|max:255',
            'bd_user'    => 'required|string|max:255',
            'bd_mensaje' => 'required|string|max:255',
            'collection'  => 'required|string|max:255',
        ]);

        $connection->update($validated);
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
