<?php

namespace Modules\Guideline\Providers;

use Modules\Core\Providers\ModuleServiceProvider;

class GuidelineServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Guideline';

    public function register(): void
    {
        // Standalone Guideline module without heavy persistence requirements
    }
}
