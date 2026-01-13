<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

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

    /**
     * Encriptar la contraseña antes de guardarla en la base de datos
     */
    public function setPasswordAttribute($value)
    {
        if (!empty($value)) {
            $this->attributes['password'] = Crypt::encryptString($value);
        }
    }

    /**
     * Desencriptar la contraseña al leerla de la base de datos
     */
    public function getPasswordAttribute($value)
    {
        if (!empty($value)) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                // Si falla la desencriptación (puede ser texto plano antiguo), retornar el valor original
                return $value;
            }
        }
        return $value;
    }
}
