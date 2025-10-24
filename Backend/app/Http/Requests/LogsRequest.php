<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LogsRequest extends FormRequest{
    public function authorize() { return true; }
    public function rules() 
    { 
        return [
            'id_user' => 'required|exists:users,id',
            'id_server' => 'nullable|exists:servers,id_server',
            'id_connection' => 'nullable|exists:connections,id_connection',
            'id_db' => 'nullable|exists:database_connections,id',
            'id_simulation' => 'nullable|exists:simulations,id_simulation',
            'description' => 'required|string|max:500',
        ]; 
    }
}