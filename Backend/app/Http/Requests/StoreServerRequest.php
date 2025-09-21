<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServerRequest extends FormRequest
{
    public function authorize() { return true; }

    public function rules()
    {
        return [
            'name' => 'required|string|max:191|unique:servers,name',
            'url'  => 'required|string|max:255',
            'port' => 'nullable|integer',
            'path' => 'nullable|string|max:255',
            'headers' => 'nullable|array',
            'auth' => 'nullable|array',
            'notes' => 'nullable|string'
        ];
    }
}
