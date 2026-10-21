<?php

namespace Modules\TiktokAccount\Providers;

use Modules\Core\Providers\ModuleServiceProvider;
use Modules\TiktokAccount\Repositories\Interfaces\TiktokAccountRepositoryInterface;
use Modules\TiktokAccount\Repositories\TiktokAccountRepository;

class TiktokAccountServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'TiktokAccount';

    public function register(): void
    {
        $this->app->bind(TiktokAccountRepositoryInterface::class, TiktokAccountRepository::class);
    }
}
