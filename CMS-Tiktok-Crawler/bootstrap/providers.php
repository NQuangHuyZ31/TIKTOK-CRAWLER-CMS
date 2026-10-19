<?php

return [
    App\Providers\AppServiceProvider::class,
    Modules\Core\Providers\CoreServiceProvider::class,
    Modules\Crawler\Providers\CrawlerRepositoryProvider::class,
    Modules\TiktokAccount\Providers\TiktokAccountRepositoryProvider::class,
];
