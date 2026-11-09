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
        if (!Schema::hasTable('crawler_seed_sequence')) {
            Schema::create('crawler_seed_sequence', function (Blueprint $table) {
                $table->unsignedTinyInteger('id')->primary();
                $table->unsignedBigInteger('last_sequence')->default(0);
            });

            DB::table('crawler_seed_sequence')->insertOrIgnore([
                'id' => 1,
                'last_sequence' => 0,
            ]);
        }

        if (!Schema::hasTable('crawler_seed_changes')) {
            Schema::create('crawler_seed_changes', function (Blueprint $table) {
                $table->unsignedBigInteger('sequence_id')->primary();
                $table->unsignedBigInteger('account_id');
                $table->string('operation', 16);
                $table->json('payload_json')->nullable();
                $table->dateTime('changed_at', 6);

                $table->index(['account_id', 'sequence_id'], 'idx_seed_changes_account');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crawler_seed_changes');
        Schema::dropIfExists('crawler_seed_sequence');
    }
};
