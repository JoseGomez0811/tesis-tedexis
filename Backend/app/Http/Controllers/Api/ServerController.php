<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServerRequest;
use App\Models\Server;   
use Illuminate\Http\Request;

class ServerController extends Controller
{
    // Listar servidores (para llenar el select en Angular)
    public function index()
    {
        $servers = Server::orderBy('name')->get(['id_server','name','url','port','path']);
        return response()->json($servers);
    }

    // Guardar nuevo servidor (addServer.component -> POST)
    public function store(StoreServerRequest $request)
    {
        $data = $request->validated();

        $data['headers'] = isset($data['headers']) ? json_encode($data['headers']) : null;
        $data['auth'] = isset($data['auth']) ? json_encode($data['auth']) : null;

        $server = Server::create($data);

        return response()->json([
            'message' => 'Servidor creado',
            'server' => $server
        ], 201);
    }

    public function show($id)
    {
        $server = Server::findOrFail($id);
        return response()->json($server);
    }
}
