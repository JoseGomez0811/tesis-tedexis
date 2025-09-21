<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServersTable extends Migration
{
    public function up()
    {
        Schema::dropIfExists('servers');
        Schema::create('servers', function (Blueprint $table) {
            $table->id('id_server');
            $table->string('name');        // nombre amigable (ej: "Calidad")
            $table->string('url');                   // ip o dominio
            $table->integer('port')->nullable();     // puerto (ej: 8080)
            $table->string('path')->nullable();      // endpoint adicional (ej: /api/receive)
            $table->json('headers')->nullable();     // cabeceras por defecto (JSON)
            $table->json('auth')->nullable();        // datos de auth (guardar cifrados si lo deseas)
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('servers');
    }

}
