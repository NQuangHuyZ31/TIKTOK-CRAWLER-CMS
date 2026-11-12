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
        $hasUnique = Schema::hasIndex('users', 'users_email_unique');
        $hasIndex = Schema::hasIndex('users', 'users_email_index');

        Schema::table('users', function (Blueprint $table) use ($hasUnique, $hasIndex) {
            if ($hasUnique) {
                $table->dropUnique('users_email_unique');
            }
            if (!$hasIndex) {
                $table->index('email', 'users_email_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $hasUnique = Schema::hasIndex('users', 'users_email_unique');
        $hasIndex = Schema::hasIndex('users', 'users_email_index');

        Schema::table('users', function (Blueprint $table) use ($hasUnique, $hasIndex) {
            if ($hasIndex) {
                $table->dropIndex('users_email_index');
            }
            if (!$hasUnique) {
                $table->unique('email', 'users_email_unique');
            }
        });
    }
};
