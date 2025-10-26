<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Logs extends Model{
    protected $table = "logs";
    protected $primaryKey = "id_logs";
    public $timestamps = true;
    protected $fillable = [
        'id_user',
        'id_server',
        'id_connection',
        'id_db',
        'id_simulation',
        'description',   
    ];
}