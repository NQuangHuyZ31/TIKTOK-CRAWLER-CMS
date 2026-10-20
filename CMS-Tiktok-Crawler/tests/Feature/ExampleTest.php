<?php

test('the application returns a successful response on admin route', function () {
    $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
    $response = $this->get('/' . $adminPath);

    $response->assertStatus(200);
});

test('the application root redirects to admin path', function () {
    $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
    $response = $this->get('/');

    $response->assertRedirect('/' . $adminPath);
});
