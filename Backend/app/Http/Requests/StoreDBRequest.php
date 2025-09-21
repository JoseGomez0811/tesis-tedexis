<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDBRequest extends FormRequest
{
    public function authorize() { return true; }

    public function rules()
    {
        return [
            'name'       => 'required|string|max:255',
            'host'       => 'required|string|max:255',
            'port'       => 'required|integer',
            'user'       => 'required|string|max:255',
            'password'   => 'required|string|max:255',
            'bd_user'    => 'required|string|max:255',
            'bd_mensaje' => 'required|string|max:255',
            'collection' => 'required|string|max:255',
        ];
    }
}
