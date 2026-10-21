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
            $table->foreignId('crawl_job_id')->constrained('crawl_jobs')->onDelete('cascade');
            $table->foreignId('tiktok_account_id')->nullable()->constrained('tiktok_accounts')->nullOnDelete();
            $table->string('username');
            $table->integer('followers_count')->default(0);
            $table->integer('following_count')->default(0);
            $table->integer('likes_count')->default(0);
            $table->string('profile_url')->nullable();
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->text('error_message')->nullable();
            $table->datetime('crawled_at')->nullable();
            $table->timestamps();
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
