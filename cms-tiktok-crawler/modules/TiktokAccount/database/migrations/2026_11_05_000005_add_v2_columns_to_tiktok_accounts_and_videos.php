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
        Schema::table('tiktok_accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('tiktok_accounts', 'last_observed_at')) {
                $table->dateTime('last_observed_at', 6)->nullable()->after('last_crawled_at');
            }
            if (!Schema::hasColumn('tiktok_accounts', 'last_entity_revision')) {
                $table->unsignedBigInteger('last_entity_revision')->default(0)->after('last_observed_at');
            }
        });

        Schema::table('tiktok_videos', function (Blueprint $table) {
            if (!Schema::hasColumn('tiktok_videos', 'observed_at')) {
                $table->dateTime('observed_at', 6)->nullable()->after('last_crawled_at');
            }
            if (!Schema::hasColumn('tiktok_videos', 'last_entity_revision')) {
                $table->unsignedBigInteger('last_entity_revision')->default(0)->after('observed_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tiktok_videos', function (Blueprint $table) {
            if (Schema::hasColumn('tiktok_videos', 'last_entity_revision')) {
                $table->dropColumn('last_entity_revision');
            }
            if (Schema::hasColumn('tiktok_videos', 'observed_at')) {
                $table->dropColumn('observed_at');
            }
        });

        Schema::table('tiktok_accounts', function (Blueprint $table) {
            if (Schema::hasColumn('tiktok_accounts', 'last_entity_revision')) {
                $table->dropColumn('last_entity_revision');
            }
            if (Schema::hasColumn('tiktok_accounts', 'last_observed_at')) {
                $table->dropColumn('last_observed_at');
            }
        });
    }
};
