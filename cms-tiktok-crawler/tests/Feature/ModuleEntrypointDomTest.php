<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Blade;
use Modules\Core\Support\ModuleRegistry;
use Tests\TestCase;

class ModuleEntrypointDomTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);
        $registry->resetDomCache();
    }

    public function test_entrypoints_manifest_can_be_read_and_cached(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);
        $entrypoints = $registry->getEntrypoints();

        $this->assertIsArray($entrypoints);
        $this->assertArrayHasKey('Core', $entrypoints);
        $this->assertArrayHasKey('Crawler', $entrypoints);
        $this->assertArrayHasKey('TiktokAccount', $entrypoints);
    }

    public function test_core_is_always_dommed_first_with_vendor_and_index(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);

        $jsHtml = $registry->renderJs('Crawler');

        // Core vendor.js must be loaded first
        $this->assertStringContainsString('/modules/Core/vendor.js', $jsHtml);
        $this->assertStringContainsString('/modules/Core/index.js', $jsHtml);
        $this->assertStringContainsString('/modules/Crawler/index.js', $jsHtml);

        // Core vendor must appear BEFORE Core index in the DOM output
        $vendorPos = strpos($jsHtml, '/modules/Core/vendor.js');
        $coreIndexPos = strpos($jsHtml, '/modules/Core/index.js');
        $crawlerPos = strpos($jsHtml, '/modules/Crawler/index.js');

        $this->assertTrue($vendorPos < $coreIndexPos, 'vendor.js must appear before Core index.js');
        $this->assertTrue($coreIndexPos < $crawlerPos, 'Core index.js must appear before Crawler index.js');
    }

    public function test_dom_cache_prevents_duplicate_rendering_of_same_files(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);

        // 1. First render for Crawler
        $firstJs = $registry->renderJs('Crawler');
        $this->assertNotEmpty($firstJs);
        $this->assertStringContainsString('/modules/Core/vendor.js', $firstJs);
        $this->assertStringContainsString('/modules/Crawler/index.js', $firstJs);

        // 2. Second render for Crawler in same request MUST return empty string (cached)
        $secondJs = $registry->renderJs('Crawler');
        $this->assertSame('', $secondJs, 'Calling renderJs again for Crawler must return empty string');

        // 3. Render CSS for Crawler
        $firstCss = $registry->renderCss('Crawler');
        $this->assertNotEmpty($firstCss);
        $this->assertStringContainsString('/modules/Core/app.css', $firstCss);

        // 4. Second render CSS for Crawler must return empty string
        $secondCss = $registry->renderCss('Crawler');
        $this->assertSame('', $secondCss, 'Calling renderCss again for Crawler must return empty string');
    }

    public function test_subsequent_module_dom_does_not_duplicate_core(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);

        // 1. Render Core first
        $coreJs = $registry->renderJs('Core');
        $this->assertStringContainsString('/modules/Core/vendor.js', $coreJs);
        $this->assertStringContainsString('/modules/Core/index.js', $coreJs);

        // 2. Render TiktokAccount next: Core must NOT be rendered again, only TiktokAccount
        $tiktokJs = $registry->renderJs('TiktokAccount');
        $this->assertStringNotContainsString('/modules/Core/vendor.js', $tiktokJs);
        $this->assertStringNotContainsString('/modules/Core/index.js', $tiktokJs);
        $this->assertStringContainsString('/modules/TiktokAccount/index.js', $tiktokJs);

        // 3. Render TiktokAccount again: must be empty
        $this->assertSame('', $registry->renderJs('TiktokAccount'));
    }

    public function test_blade_directives_render_dom_properly(): void
    {
        $rendered = Blade::render('@moduleCss("Crawler") @moduleJs("Crawler")');

        $this->assertStringContainsString('<link rel="stylesheet"', $rendered);
        $this->assertStringContainsString('/modules/Core/app.css', $rendered);
        $this->assertStringContainsString('<script src="', $rendered);
        $this->assertStringContainsString('/modules/Core/vendor.js', $rendered);
        $this->assertStringContainsString('/modules/Crawler/index.js', $rendered);

        // Calling directives again in same request does not duplicate
        $duplicate = Blade::render('@moduleCss("Crawler") @moduleJs("Crawler")');
        $this->assertSame('', trim($duplicate), 'Subsequent directive calls should render nothing due to DOM cache');
    }

    public function test_web_routes_serve_spa_with_auto_loaded_module_assets(): void
    {
        $adminPrefix = trim((string) config('admin.admin_path', config('admin.path', 'admin')), '/');

        // 1. Visit /admin (Dashboard) -> should load Core and all active modules automatically
        $response = $this->get('/' . $adminPrefix);
        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('/modules/Core/vendor.js', $content);
        $this->assertStringContainsString('/modules/Core/index.js', $content);
        $this->assertStringContainsString('/modules/Crawler/index.js', $content);
        $this->assertStringContainsString('/modules/TiktokAccount/index.js', $content);

        // 2. Visit /admin/crawler/crawl-job -> should also load Core AND module assets
        $responseCrawler = $this->get('/' . $adminPrefix . '/crawler/crawl-job');
        $responseCrawler->assertStatus(200);
        $contentCrawler = $responseCrawler->getContent();
        $this->assertStringContainsString('/modules/Core/vendor.js', $contentCrawler);
        $this->assertStringContainsString('/modules/Core/index.js', $contentCrawler);
        $this->assertStringContainsString('/modules/Crawler/index.js', $contentCrawler);
    }

    public function test_assets_render_with_cache_busting_version_query_from_manifest(): void
    {
        /** @var ModuleRegistry $registry */
        $registry = app(ModuleRegistry::class);

        $jsHtml = $registry->renderJs('Core');
        $cssHtml = $registry->renderCss('Core');

        $manifest = $registry->getMixManifest();
        if (isset($manifest['/modules/Core/vendor.js'])) {
            $expectedVendor = $manifest['/modules/Core/vendor.js'];
            $this->assertStringContainsString($expectedVendor, $jsHtml);
        }

        if (isset($manifest['/modules/Core/index.js'])) {
            $expectedIndex = $manifest['/modules/Core/index.js'];
            $this->assertStringContainsString($expectedIndex, $jsHtml);
        }

        if (isset($manifest['/modules/Core/app.css'])) {
            $expectedCss = $manifest['/modules/Core/app.css'];
            $this->assertStringContainsString($expectedCss, $cssHtml);
        }
    }
}
