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
        Schema::table('crawl_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('crawl_jobs', 'target_date')) {
                $table->string('target_date', 32)
                    ->nullable()
                    ->after('max_videos_per_account');
            }
            if (!Schema::hasColumn('crawl_jobs', 'date_from')) {
                $table->timestamp('date_from')
                    ->nullable()
                    ->after('target_date');
            }
            if (!Schema::hasColumn('crawl_jobs', 'date_to')) {
                $table->timestamp('date_to')
                    ->nullable()
                    ->after('date_from');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crawl_jobs', function (Blueprint $table) {
            $columns = array_filter(
                ['target_date', 'date_from', 'date_to'],
                fn (string $col) => Schema::hasColumn('crawl_jobs', $col)
            );
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
