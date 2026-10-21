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
        Schema::create('tiktok_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('username')->unique();
            $table->string('sec_uid')->nullable()->index();
            $table->string('nickname')->nullable();
            $table->text('avatar_url')->nullable();
            $table->text('avatar_path')->nullable();
            $table->string('profile_url')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedBigInteger('followers_count')->default(0);
            $table->unsignedBigInteger('following_count')->default(0);
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedInteger('video_count')->default(0);
            $table->boolean('is_verified')->default(false);
            $table->enum('status', ['active', 'inactive', 'banned'])->default('active');
            $table->dateTime('crawled_at')->nullable();
            $table->dateTime('last_crawled_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'last_crawled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tiktok_accounts');
    }
};
