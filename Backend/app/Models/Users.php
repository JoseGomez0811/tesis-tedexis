<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Users extends Model{
    protected $table = "users";
    protected $primaryKey = "id";
    public $timestamps = true;
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'email_verified_at',
        'authorization_status',
        'role', // 👈 asegurarte de tenerlo aquí
    ];

}