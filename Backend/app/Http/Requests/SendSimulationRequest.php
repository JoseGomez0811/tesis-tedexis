<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendSimulationRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Cambia esto si necesitas lógica de autorización
    }

    public function rules()
    {
        return [
            'hostServer' => 'required|string|max:255',
            'portConnection' => 'required|integer', 
            'typeConnection' => 'required|string',
            'nameQueue' => 'nullable|string|max:255', 
            // 'id_connection' => 'required|exists:connections,id_connection',
            // 'id_db' => 'nullable|exists:database_connections,id',
            'systemID' => 'required|string|max:255',
            'password' => 'nullable|string|max:255', 
            'phoneNumber' => 'required|string|max:255',
            'message' => 'required|string|max:255',
            'number' => 'required|integer', 
            'shortCode' => 'required|integer', 
            'encoding' => 'required|string|max:255',
        ];
    }
}