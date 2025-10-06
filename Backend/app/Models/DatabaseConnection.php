<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DatabaseConnection extends Model
{
    protected $table = 'database_connections';
    protected $primaryKey = 'id';
    public $timestamps = true;
    
    protected $fillable = [
        'name',
        'host',
        'port',
        'user',
        'password',
        'auth_db',
        'name_db',
        //'collection',
    ];

    protected $hidden = [
        'password',
    ];
}
