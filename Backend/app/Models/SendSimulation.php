<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SendSimulation extends Model
{
    protected $table = 'simulations';
    protected $primaryKey = 'id_simulation';
    public $timestamps = true;
    protected $fillable = [
        'hostServer',
        'typeConnection',
        'nameQueue',
        'systemID',
        'password',
        'phoneNumber',
        'message',
        'number',
        'shortCode',
        'encoding',
    ];
}
