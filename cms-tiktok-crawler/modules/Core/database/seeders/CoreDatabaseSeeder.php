<?php

namespace Modules\Core\Database\Seeders;

use Illuminate\Database\Seeder;

class CoreDatabaseSeeder extends Seeder
{
    /**
     * Seed the core module's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            UserSeeder::class,
        ]);
    }
}
