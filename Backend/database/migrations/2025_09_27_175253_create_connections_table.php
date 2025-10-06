<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('connections', function (Blueprint $table) {

            $table->id('id_connection');
            $table->string('name');
            $table->string('type');
            $table->integer('port');
            $table->string('path')->nullable();

            $table->unsignedBigInteger('id_server');

            $table->foreign('id_server')
                  ->references('id_server')
                  ->on('servers')
                  ->onUpdate('cascade')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down()
    {

        Schema::dropIfExists('connections');
    }
};
