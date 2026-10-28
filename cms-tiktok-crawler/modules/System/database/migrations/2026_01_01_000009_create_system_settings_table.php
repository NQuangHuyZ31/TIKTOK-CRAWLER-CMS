<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('group', 50)->default('worker')->index();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->string('type', 20)->default('string'); // string, integer, boolean, json
            $table->string('description', 255)->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            $table->index(['group', 'key']);
        });

        // Seed default worker & maintenance settings
        $now = now();
        $defaults = [
            [
                'group' => 'worker',
                'key' => 'auto_cleanup_enabled',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Enable automated background log pruning worker',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'cleanup_schedule_preset',
                'value' => 'daily_02_00',
                'type' => 'string',
                'description' => 'Predefined schedule preset for log pruning (daily_02_00, daily_00_00, weekly_sun, custom)',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'cleanup_schedule_cron',
                'value' => '0 2 * * *',
                'type' => 'string',
                'description' => 'Cron expression for scheduled log pruning',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'activity_log_retention_days',
                'value' => '30',
                'type' => 'integer',
                'description' => 'Number of days to retain activity audit logs (min: 7)',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'login_log_retention_days',
                'value' => '60',
                'type' => 'integer',
                'description' => 'Number of days to retain login history logs (min: 14)',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'cleanup_chunk_size',
                'value' => '500',
                'type' => 'integer',
                'description' => 'Number of records to delete per chunk batch to prevent table locking',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'cleanup_sleep_between_batches_ms',
                'value' => '100',
                'type' => 'integer',
                'description' => 'Micro-sleep in milliseconds between batch deletions to yield I/O',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'last_cleanup_at',
                'value' => null,
                'type' => 'string',
                'description' => 'Timestamp of the last completed log cleanup',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'last_cleanup_purged_count',
                'value' => '0',
                'type' => 'integer',
                'description' => 'Total records purged in the last cleanup execution',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'last_cleanup_duration_sec',
                'value' => '0',
                'type' => 'string',
                'description' => 'Duration in seconds of the last cleanup execution',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'last_cleanup_status',
                'value' => 'idle',
                'type' => 'string',
                'description' => 'Status of the last cleanup (idle, running, success, failed)',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'group' => 'worker',
                'key' => 'last_cleanup_history',
                'value' => '[]',
                'type' => 'json',
                'description' => 'JSON array containing the last 10 cleanup execution records',
                'is_public' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('system_settings')->insert($defaults);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
