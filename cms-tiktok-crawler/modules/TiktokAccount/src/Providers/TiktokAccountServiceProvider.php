<?php

namespace Modules\TiktokAccount\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\TiktokAccount\Models\TiktokAccount;
use Modules\TiktokAccount\Observers\TiktokAccountObserver;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokVideoRepositoryInterface;
use Modules\TiktokAccount\Repositories\TiktokAccountRepository;
use Modules\TiktokAccount\Repositories\TiktokVideoRepository;

class TiktokAccountServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'TiktokAccount';

    public function register(): void
    {
        $this->app->bind(TiktokAccountRepositoryInterface::class, TiktokAccountRepository::class);
        $this->app->bind(TiktokVideoRepositoryInterface::class, TiktokVideoRepository::class);
    }

    public function boot(): void
    {
        parent::boot();
        TiktokAccount::observe(TiktokAccountObserver::class);
    }
}
