<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendSimulationRequest;
use App\Models\SendSimulation;
use Illuminate\Support\Facades\Http;

class SendSimulationController extends Controller
{
    public function index()
    {
        $simulation = SendSimulation::orderBy('id_simulation')->get([
        'id_simulation',
        'hostServer',
        'typeConnection',
        'nameQueue',
        'systemID',
        'password',
        'phoneNumber',
        'message',
        'number',
        'shortCode',
        'encoding',
    ]);
        return response()->json($simulation);
    }
    public function send(SendSimulationRequest $request)
    {
        // Obtener datos validados
        $datos = $request->validated();

        // (Opcional) Guardar en la base de datos local
        // SendSimulation::create($datos);

        // URL del web service en Java
        $url = 'https://ejemplo.com/api/recibir-datos'; // Reemplázala con la URL real

        // Enviar los datos en JSON
        $response = Http::post($url, $datos);

        if ($response->successful()) {
            return response()->json([
                'message' => 'Datos enviados correctamente al web service.',
                'respuesta_web_service' => $response->json()
            ], 200);
        }

        return response()->json([
            'message' => 'Error al enviar datos al web service.',
            'error' => $response->body()
        ], $response->status());
    }
}
