<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('database_connections', function (Blueprint $table) {
            $table->id();
            $table->string('name');         // nombre descriptivo
            $table->string('host');           // host o IP
            $table->integer('port');        // puerto (ej. 5432, 3306)
            $table->string('user');        // usuario de conexión
            $table->string('password');     // password de conexión
            $table->string('bd_user');        // nombre de la base de datos del usuario
            $table->string('bd_mensaje');     // nombre de la base de datos de mensajes
            $table->string('collection');      // nombre de la colección (MongoDB) o tabla lógica
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('database_connections');
    }
};
