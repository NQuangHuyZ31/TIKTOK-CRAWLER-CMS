<?php

namespace Modules\TiktokAccount\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\TiktokAccountRepository;

class TiktokAccountRepositoryProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            TiktokAccountRepositoryInterface::class,
            TiktokAccountRepository::class
        );
    }
}
