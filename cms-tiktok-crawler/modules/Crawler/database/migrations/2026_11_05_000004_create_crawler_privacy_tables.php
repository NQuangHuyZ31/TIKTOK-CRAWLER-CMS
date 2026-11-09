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
        if (!Schema::hasTable('crawler_privacy_suppressions')) {
            Schema::create('crawler_privacy_suppressions', function (Blueprint $table) {
                $table->id();
                $table->string('entity_type', 32);
                $table->string('entity_key', 191);
                $table->string('reason', 255)->nullable();
                $table->timestamp('suppressed_at')->useCurrent();

                $table->unique(['entity_type', 'entity_key'], 'uq_privacy_suppression');
            });
        }

        if (!Schema::hasTable('crawler_privacy_purge_requests')) {
            Schema::create('crawler_privacy_purge_requests', function (Blueprint $table) {
                $table->string('purge_request_id', 64)->primary();
                $table->string('entity_type', 32);
                $table->string('entity_key', 191);
                $table->string('status', 32)->default('requested');
                $table->text('error_message')->nullable();
                $table->timestamp('requested_at')->useCurrent();
                $table->timestamp('completed_at')->nullable();

                $table->index(['status', 'requested_at'], 'idx_purge_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawler_privacy_purge_requests');
        Schema::dropIfExists('crawler_privacy_suppressions');
    }
};
