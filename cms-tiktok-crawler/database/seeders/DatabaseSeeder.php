<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Core\Database\Seeders\CoreDatabaseSeeder;
use Modules\Crawler\Database\Seeders\CrawlJobSeeder;
use Modules\TiktokAccount\Database\Seeders\TiktokAccountSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with modular seeders.
     */
    public function run(): void
    {
        $this->call([
            CoreDatabaseSeeder::class,
            TiktokAccountSeeder::class,
            CrawlJobSeeder::class,
        ]);
    }
}
