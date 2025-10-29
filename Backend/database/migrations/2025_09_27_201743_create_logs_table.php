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
        Schema::create('logs', function (Blueprint $table) {
            $table->id('id_logs');

            $table->unsignedBigInteger('id_user');

            $table->foreign('id_user')
                  ->references('id')
                  ->on('users')
                  ->onUpdate('cascade')
                  ->onDelete('set null');

            $table->unsignedBigInteger('id_server')->nullable();

            $table->foreign('id_server')
                  ->references('id_server')
                  ->on('servers')
                  ->onUpdate('cascade')
                  ->onDelete('set null');

            $table->unsignedBigInteger('id_connection')->nullable();

            $table->foreign('id_connection')
                  ->references('id_connection')
                  ->on('connections')
                  ->onUpdate('cascade')
                  ->onDelete('set null');

            $table->unsignedBigInteger('id_db')->nullable();

            $table->foreign('id_db')
                  ->references('id')
                  ->on('database_connections')
                  ->onUpdate('cascade')
                  ->onDelete('set null');

            $table->unsignedBigInteger('id_simulation')->nullable();

            $table->foreign('id_simulation')
                  ->references('id_simulation')
                  ->on('simulations')
                  ->onUpdate('cascade')
                  ->onDelete('set null');

            $table->string('description', 500);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};
