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
        'email_verified_at',
        'password',
        'remember_token',
        'created_at',
        'updated_at',
        'google_id',
        'avatar',
        'authorization_status',   
    ];
}