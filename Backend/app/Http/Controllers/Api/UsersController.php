<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Users;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;

class UsersController extends Controller{
    public function index()
    {
        $user = Users::orderBy('id')->get([
            'id',
            'name',
            'email',
            'email_verified_at',
            'password',
            'remember_token',
            'created_at',
            'updated_at',
            'google_id',
            'avatar',
            'authorization_status',  
        ]);
        return response()->json($user);
    }
}