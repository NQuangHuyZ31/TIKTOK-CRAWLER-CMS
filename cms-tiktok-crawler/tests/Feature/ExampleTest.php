<?php

test('the application returns a successful response on admin route', function () {
    $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
    $response = $this->get('/' . $adminPath);

    $response->assertStatus(200);
});

test('the application root redirects to admin dashboard', function () {
    $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
    $response = $this->get('/');

    $response->assertRedirect('/' . $adminPath . '/dashboard');
});

test('non-admin route serves spa directly without redirect', function () {
    $response = $this->get('/login');
    $response->assertStatus(200);
});

test('admin dashboard returns 200', function () {
    $response = $this->get('/admin/dashboard');
    $response->assertStatus(200);
});

test('admin nested routes return 200', function () {
    $response = $this->get('/admin/crawler/crawl-job');
    $response->assertStatus(200);

    $responseDetail = $this->get('/admin/crawler/crawl-job/1');
    $responseDetail->assertStatus(200);

    $responseEdit = $this->get('/admin/crawler/crawl-job/1/edit');
    $responseEdit->assertStatus(200);

    $responseTiktok = $this->get('/admin/tiktok-account');
    $responseTiktok->assertStatus(200);

    $responseTiktokDetail = $this->get('/admin/tiktok-account/1');
    $responseTiktokDetail->assertStatus(200);

    $responseTiktokEdit = $this->get('/admin/tiktok-account/1/edit');
    $responseTiktokEdit->assertStatus(200);
});

test('script execution order matches entrypoints specification', function () {
    $response = $this->get('/admin/crawler/crawl-job');
    $response->assertStatus(200);

    $content = $response->getContent();
    $vendorPos = strpos($content, 'modules/Core/vendor.js');
    $crawlerPos = strpos($content, 'modules/Crawler/index.js');
    $corePos = strpos($content, 'modules/Core/index.js');

    expect($vendorPos)->toBeInt()->not->toBeFalse();
    expect($crawlerPos)->toBeInt()->not->toBeFalse();
    expect($corePos)->toBeInt()->not->toBeFalse();

    // Core vendor first, then Core index, then module scripts
    expect($vendorPos)->toBeLessThan($corePos);
    expect($corePos)->toBeLessThan($crawlerPos);
});
