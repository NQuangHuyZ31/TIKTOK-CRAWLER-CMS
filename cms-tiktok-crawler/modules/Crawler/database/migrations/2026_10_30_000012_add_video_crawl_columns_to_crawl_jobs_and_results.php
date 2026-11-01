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
            if (!Schema::hasColumn('crawl_jobs', 'crawl_mode')) {
                $table->string('crawl_mode', 32)
                    ->default('account_with_videos')
                    ->after('source_type');
            }
            if (!Schema::hasColumn('crawl_jobs', 'max_videos_per_account')) {
                $table->unsignedInteger('max_videos_per_account')
                    ->default(20)
                    ->after('crawl_mode');
            }
            if (!Schema::hasColumn('crawl_jobs', 'total_videos_crawled')) {
                $table->unsignedInteger('total_videos_crawled')
                    ->default(0)
                    ->after('failed_count');
            }
        });

        Schema::table('crawl_results', function (Blueprint $table) {
            if (!Schema::hasColumn('crawl_results', 'videos_crawled_count')) {
                $table->unsignedInteger('videos_crawled_count')
                    ->default(0)
                    ->after('video_count');
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
                ['crawl_mode', 'max_videos_per_account', 'total_videos_crawled'],
                fn (string $col) => Schema::hasColumn('crawl_jobs', $col)
            );
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });

        Schema::table('crawl_results', function (Blueprint $table) {
            if (Schema::hasColumn('crawl_results', 'videos_crawled_count')) {
                $table->dropColumn('videos_crawled_count');
            }
        });
    }
};
