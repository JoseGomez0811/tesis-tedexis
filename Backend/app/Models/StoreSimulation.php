<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSimulation extends Model
{
    protected $table = 'simulations';
    protected $primaryKey = 'id_simulation';
    public $timestamps = true;
    protected $fillable = [
        'id_connection',
        'nameQueue',
        'system_id',
        'password',
        'phone_number',
        'message',
        'number',
        'short_code',
        'encoding',
        'id_db',
    ];
}
