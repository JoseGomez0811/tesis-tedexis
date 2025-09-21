<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Server extends Model
{
    protected $table = 'servers';
    protected $primaryKey = 'id_server';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'url',
        'port',
        'path',
        'headers',
        'auth',
        'notes'
    ];
}
