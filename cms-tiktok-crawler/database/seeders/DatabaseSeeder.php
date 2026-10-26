<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Crawler\Database\Seeders\CrawlJobSeeder;
use Modules\Permission\Database\Seeders\PermissionSeeder;
use Modules\Role\Database\Seeders\RoleSeeder;
use Modules\TiktokAccount\Database\Seeders\TiktokAccountSeeder;
use Modules\User\Database\Seeders\UserSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with modular seeders.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            UserSeeder::class,
            TiktokAccountSeeder::class,
            CrawlJobSeeder::class,
        ]);
    }
}
