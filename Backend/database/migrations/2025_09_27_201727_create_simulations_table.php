<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('simulations', function (Blueprint $table) {
            $table->id('id_simulation');

            // $table->unsignedBigInteger('id_user');

            // $table->foreign('id_user')
            //       ->references('id')
            //       ->on('users')
            //       ->onUpdate('cascade')
            //       ->onDelete('cascade');
            
            // $table->unsignedBigInteger('id_server');

            // $table->foreign('id_server')
            //       ->references('id_server')
            //       ->on('servers')
            //       ->onUpdate('cascade')
            //       ->onDelete('cascade');

            $table->unsignedBigInteger('id_connection');

            $table->foreign('id_connection')
                  ->references('id_connection')
                  ->on('connections')
                  ->onUpdate('cascade')
                  ->onDelete('cascade');

            $table->string('nameQueue')->nullable();
            $table->string('system_id');
            $table->string('password')->nullable();
            $table->string('phone_number', 50);
            $table->string('message');
            $table->integer('number');
            $table->integer('short_code');
            $table->string('encoding');

            $table->unsignedBigInteger('id_db')->nullable();

            $table->foreign('id_db')
                  ->references('id')
                  ->on('database_connections')
                  ->onUpdate('cascade')
                  ->onDelete('cascade');
           
            // $table->unsignedBigInteger('id_collection')->nullable();

            // $table->foreign('id_collection')
            //       ->references('id_collection')
            //       ->on('collections_db')
            //       ->onUpdate('cascade')
            //       ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulations');
    }
};
