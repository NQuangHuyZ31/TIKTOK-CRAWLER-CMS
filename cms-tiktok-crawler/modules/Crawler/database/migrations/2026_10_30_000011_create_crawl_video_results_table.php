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
        Schema::create('crawl_video_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crawl_job_id')
                ->constrained('crawl_jobs')
                ->cascadeOnDelete();
            $table->foreignId('crawl_result_id')
                ->nullable()
                ->constrained('crawl_results')
                ->cascadeOnDelete();
            $table->foreignId('tiktok_account_id')
                ->nullable()
                ->constrained('tiktok_accounts')
                ->nullOnDelete();
            $table->foreignId('tiktok_video_id')
                ->nullable()
                ->constrained('tiktok_videos')
                ->nullOnDelete();
            $table->string('video_id', 64);
            $table->string('username', 100)->index();
            $table->string('video_url', 500)->nullable();
            $table->text('description')->nullable();
            $table->json('hashtags')->nullable();
            $table->text('cover_url')->nullable();
            $table->unsignedInteger('duration')->default(0);
            $table->unsignedBigInteger('play_count')->default(0);
            $table->unsignedBigInteger('digg_count')->default(0);
            $table->unsignedBigInteger('comment_count')->default(0);
            $table->unsignedBigInteger('share_count')->default(0);
            $table->unsignedBigInteger('collect_count')->default(0);
            $table->bigInteger('play_count_delta')->default(0);
            $table->bigInteger('digg_count_delta')->default(0);
            $table->bigInteger('comment_count_delta')->default(0);
            $table->bigInteger('share_count_delta')->default(0);
            $table->bigInteger('collect_count_delta')->default(0);
            $table->dateTime('published_at')->nullable();
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->string('error_code', 32)->nullable();
            $table->text('error_message')->nullable();
            $table->dateTime('crawled_at')->nullable();
            $table->timestamps();

            $table->unique(['crawl_job_id', 'video_id'], 'uq_job_video');
            $table->index(['crawl_job_id', 'status']);
            $table->index(['tiktok_video_id', 'crawled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawl_video_results');
    }
};
