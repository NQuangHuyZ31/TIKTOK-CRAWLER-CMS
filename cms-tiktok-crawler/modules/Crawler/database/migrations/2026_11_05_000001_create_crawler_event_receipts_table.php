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
        if (!Schema::hasTable('crawler_event_receipts')) {
            Schema::create('crawler_event_receipts', function (Blueprint $table) {
                $table->string('event_id', 64)->primary();
                $table->string('logical_event_key', 191);
                $table->string('entity_type', 32);
                $table->string('entity_key', 128);
                $table->string('payload_hash', 64);
                $table->dateTime('observed_at', 6);
                $table->dateTime('acknowledged_at', 6)->useCurrent();

                $table->index(['logical_event_key', 'observed_at'], 'idx_receipts_logical');
                $table->index('acknowledged_at', 'idx_receipts_acknowledged');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawler_event_receipts');
    }
};
