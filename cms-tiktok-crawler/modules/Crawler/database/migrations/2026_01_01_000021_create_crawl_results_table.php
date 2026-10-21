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
        Schema::create('crawl_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crawl_job_id')->constrained('crawl_jobs')->cascadeOnDelete();
            $table->foreignId('tiktok_account_id')->nullable()->constrained('tiktok_accounts')->nullOnDelete();
            $table->string('username')->index();
            $table->string('nickname')->nullable();
            $table->text('avatar_url')->nullable();
            $table->text('avatar_path')->nullable();
            $table->string('profile_url')->nullable();
            $table->unsignedBigInteger('followers_count')->default(0);
            $table->unsignedBigInteger('following_count')->default(0);
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedInteger('video_count')->default(0);
            $table->text('bio')->nullable();
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->longText('raw_data')->nullable();
            $table->text('error_message')->nullable();
            $table->dateTime('crawled_at')->nullable();
            $table->timestamps();

            $table->index(['crawl_job_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawl_results');
    }
};
