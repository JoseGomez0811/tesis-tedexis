<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LogsRequest;
use App\Models\Logs;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;

class LogsController extends Controller{
    public function index()
    {
        $logs = Logs::orderBy('created_at', 'desc')->get([
            'id_logs',
            'id_user',
            'id_server',
            'id_connection',
            'id_db',
            'id_simulation',
            'description',
            'created_at',
            'updated_at',
        ]);
        return response()->json($logs);
    }

    public function store(LogsRequest $request)
    {
        try {
            $validatedData = $request->validated();

            $log = Logs::create([
                'id_user' => $validatedData['id_user'],
                'id_server' => $validatedData['id_server'] ?? null,
                'id_connection' => $validatedData['id_connection'] ?? null,
                'id_db' => $validatedData['id_db'] ?? null,
                'id_simulation' => $validatedData['id_simulation'] ?? null,
                'description' => $validatedData['description'],
            ]);

            return response()->json([
                'message' => 'Log created successfully',
                'log' => $log
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
}