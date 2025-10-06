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
        Schema::create('collections_db', function (Blueprint $table) {
            $table->id('id_collection');
            $table->string('name');

            $table->unsignedBigInteger('id_db');

            $table->foreign('id_db')
                  ->references('id')
                  ->on('database_connections')
                  ->onUpdate('cascade')
                  ->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collections_db');
    }
};
