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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            // Actor
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('user_email', 255)->index();
            $table->string('user_role', 50)->nullable()->index();

            // Action & Target
            $table->string('action', 50)->index();
            $table->string('module', 50)->index();
            $table->string('record_id', 100)->nullable()->index();
            $table->string('record_type', 100)->nullable()->index();

            // Data Snapshot & Changes
            $table->json('old_data')->nullable();
            $table->json('new_data')->nullable();
            $table->json('metadata')->nullable();

            // Status & Context
            $table->string('status', 20)->default('SUCCESS')->index();
            $table->text('error_message')->nullable();

            // Timestamp
            $table->timestamp('created_at')->useCurrent()->index();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
