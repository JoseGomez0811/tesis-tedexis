<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConnectionRequest extends FormRequest
{
    public function authorize() { return true; }

    public function rules()
    {
        return [
            'name' => 'required|string|max:191|unique:connections,name',
            'type' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'path' => 'nullable|string|max:255',
            'id_server' => 'required|exists:servers,id_server',
        ];
    }
}
