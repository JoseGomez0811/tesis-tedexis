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
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('servers');
    }

}
