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
            if (!Schema::hasColumn('crawl_jobs', 'started_by')) {
                $table->foreignId('started_by')
                    ->nullable()
                    ->after('created_by')
                    ->constrained('users')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crawl_jobs', function (Blueprint $table) {
            if (Schema::hasColumn('crawl_jobs', 'started_by')) {
                $table->dropConstrainedForeignId('started_by');
            }
        });
    }
};
