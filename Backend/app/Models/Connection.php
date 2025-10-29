<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Connection extends Model
{
    protected $table = 'connections';
    protected $primaryKey = 'id_connection';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'type',
        'port',
        'path',
        'id_server'
    ];

    // ✅ Relación con el servidor
    public function server()
    {
        return $this->belongsTo(Server::class, 'id_server', 'id_server');
    }
}
