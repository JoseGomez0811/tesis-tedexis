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
            'typeConnection' => 'required|string|max:255',
            'nameQueue' => 'required|string|max:255',
            'systemID' => 'required|string|max:255',
            'password' => 'required|password|max:255',
            'phoneNumber' => 'required|string|max:255',
            'message' => 'required|string|max:255',
            'number' => 'required|string|max:255',
            'shortCode' => 'required|string|max:255',
            'encoding' => 'required|string|max:255',
        ];
    }
}
