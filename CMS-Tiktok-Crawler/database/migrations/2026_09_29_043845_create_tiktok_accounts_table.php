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
            $table->integer('followers_count')->default(0);
            $table->integer('following_count')->default(0);
            $table->integer('likes_count')->default(0);
            $table->string('profile_url')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->datetime('crawled_at')->nullable();
            $table->datetime('last_crawled_at')->nullable();
            $table->timestamps();
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
