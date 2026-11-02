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
        Schema::create('tiktok_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tiktok_account_id')
                ->nullable()
                ->constrained('tiktok_accounts')
                ->cascadeOnDelete();
            $table->string('video_id', 64)->unique();
            $table->string('username', 100)->index();
            $table->string('video_url', 500)->nullable();
            $table->text('description')->nullable();
            $table->json('hashtags')->nullable();
            $table->unsignedInteger('duration')->default(0);
            $table->unsignedSmallInteger('width')->default(0);
            $table->unsignedSmallInteger('height')->default(0);
            $table->string('definition', 32)->nullable();
            $table->text('cover_url')->nullable();
            $table->text('dynamic_cover_url')->nullable();
            $table->string('music_id', 64)->nullable();
            $table->string('music_title', 255)->nullable();
            $table->string('music_author', 255)->nullable();
            $table->boolean('is_original_sound')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_ad')->default(false);
            $table->unsignedBigInteger('play_count')->default(0)->index();
            $table->unsignedBigInteger('digg_count')->default(0)->index();
            $table->unsignedBigInteger('comment_count')->default(0);
            $table->unsignedBigInteger('share_count')->default(0);
            $table->unsignedBigInteger('collect_count')->default(0);
            $table->enum('status', ['active', 'deleted', 'private'])->default('active');
            $table->dateTime('published_at')->nullable()->index();
            $table->dateTime('crawled_at')->nullable();
            $table->dateTime('last_crawled_at')->nullable()->index();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['tiktok_account_id', 'published_at'], 'idx_account_published');
            $table->index(['tiktok_account_id', 'play_count'], 'idx_account_plays');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tiktok_videos');
    }
};
