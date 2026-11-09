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
        if (!Schema::hasTable('crawl_run_account_snapshots')) {
            Schema::create('crawl_run_account_snapshots', function (Blueprint $table) {
                $table->id('snapshot_id');
                $table->string('crawl_run_id', 64)->index();
                $table->unsignedBigInteger('account_id')->index();
                $table->string('sec_uid', 191)->nullable();
                $table->string('username', 128);
                $table->unsignedBigInteger('follower_count')->nullable();
                $table->unsignedBigInteger('following_count')->nullable();
                $table->unsignedBigInteger('heart_count')->nullable();
                $table->unsignedInteger('video_count')->nullable();
                $table->dateTime('observed_at', 6);
                $table->string('source_event_id', 64)->unique();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['crawl_run_id', 'account_id'], 'idx_snap_run_account');
            });
        }

        if (!Schema::hasTable('crawl_run_video_snapshots')) {
            Schema::create('crawl_run_video_snapshots', function (Blueprint $table) {
                $table->id('snapshot_id');
                $table->string('crawl_run_id', 64)->index();
                $table->string('video_id', 64)->index();
                $table->unsignedBigInteger('account_id')->index();
                $table->unsignedBigInteger('play_count')->nullable();
                $table->unsignedBigInteger('like_count')->nullable();
                $table->unsignedBigInteger('comment_count')->nullable();
                $table->unsignedBigInteger('share_count')->nullable();
                $table->dateTime('observed_at', 6);
                $table->string('source_event_id', 64)->unique();
                $table->timestamp('created_at')->useCurrent();

                $table->index(['crawl_run_id', 'video_id'], 'idx_snap_run_video');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawl_run_video_snapshots');
        Schema::dropIfExists('crawl_run_account_snapshots');
    }
};
