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
        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement(
                "ALTER TABLE `crawl_jobs` MODIFY COLUMN `status` ENUM('pending', 'queued', 'running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending'"
            );
        }

        Schema::table('crawl_jobs', function (Blueprint $table) {
            if (!Schema::hasColumn('crawl_jobs', 'queued_at')) {
                $table->dateTime('queued_at')->nullable()->after('error_message');
            }
            if (!Schema::hasColumn('crawl_jobs', 'worker_id')) {
                $table->string('worker_id', 64)->nullable()->after('queued_at');
            }
            if (!Schema::hasColumn('crawl_jobs', 'resume_count')) {
                $table->unsignedInteger('resume_count')->default(0)->after('failed_count');
            }
        });

        Schema::table('crawl_results', function (Blueprint $table) {
            if (!Schema::hasColumn('crawl_results', 'error_code')) {
                $table->string('error_code', 32)->nullable()->after('status');
            }
            $table->unique(['crawl_job_id', 'username'], 'uq_crawl_results_job_username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crawl_results', function (Blueprint $table) {
            $table->dropUnique('uq_crawl_results_job_username');
            if (Schema::hasColumn('crawl_results', 'error_code')) {
                $table->dropColumn('error_code');
            }
        });

        Schema::table('crawl_jobs', function (Blueprint $table) {
            $columns = array_filter(
                ['queued_at', 'worker_id', 'resume_count'],
                fn (string $col) => Schema::hasColumn('crawl_jobs', $col)
            );
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
