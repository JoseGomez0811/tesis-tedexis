<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSimulationRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Cambia esto si necesitas lógica de autorización
    }

    public function rules()
    {
        return [
            'id_connection' => 'required|exists:connections,id_connection',
            'nameQueue' => 'nullable|string|max:255', 
            'system_id' => 'required|string|max:255',
            'password' => 'nullable|string|max:255', 
            'phone_number' => 'required|string|max:255',
            'message' => 'required|string|max:255',
            'number' => 'required|integer', 
            'short_code' => 'required|integer', 
            'encoding' => 'required|integer',
            // 'encoding' => 'required|string|max:255',
            'id_db'=> 'nullable|exists:database_connections,id',
        ];
    }
}
