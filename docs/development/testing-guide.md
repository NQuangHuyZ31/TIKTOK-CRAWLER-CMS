# Automated Testing Guide

This guide establishes testing conventions, best practices, and execution commands for both Backend and Frontend test suites.

---

## 1. Testing Infrastructure Overview

1. **Backend Testing (Pest PHP & PHPUnit)**:
   - Configured in `cms-tiktok-crawler/phpunit.xml` using an in-memory SQLite database (`:memory:`).
   - Fast, isolated, and requires zero external database dependencies.
   - Tests live under `cms-tiktok-crawler/tests/Feature/` and `tests/Unit/`.
   - Architectural invariants are guarded by `tests/Feature/CrawlerArchitectureTest.php`.
2. **Frontend Type Checking (TypeScript Compiler)**:
   - Evaluates all React components, Redux slices, hooks, and API actions using `tsc --noEmit`.
   - Gate command: `npm.cmd run check-types` in `cms-tiktok-crawler/`.
3. **Automated Workflow Verification**:
   - `scripts/verify-workflow.ps1` runs 35 automated checks covering branch naming, conventional commits, worktree roles, CI/CD gates, and type checks.

---

## 2. Writing Backend Feature Tests

Every new API endpoint or business logic rule must include a Pest feature test in `tests/Feature/`.

### Feature Test Template
```php
<?php

use Modules\User\Models\User;
use Modules\Permission\Models\Role;
use Modules\Permission\Models\Permission;

beforeEach(function () {
    // Set up test user with required permissions
    $this->user = User::factory()->create();
    $role = Role::create(['name' => 'Admin', 'slug' => 'admin']);
    $permission = Permission::create([
        'module' => 'crawler',
        'action' => 'view',
        'slug' => 'crawler.view',
    ]);
    $role->permissions()->attach($permission);
    $this->user->roles()->attach($role);
});

test('authenticated user with permission can view crawl jobs list', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/crawler/crawl-job');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'data',
            'meta' => ['current_page', 'per_page', 'total'],
        ]);
});

test('unauthorized user receives 403 forbidden', function () {
    $unprivilegedUser = User::factory()->create();

    $response = $this->actingAs($unprivilegedUser, 'sanctum')
        ->getJson('/crawler/crawl-job');

    $response->assertStatus(403);
});
```

---

## 3. Running Test Suites

Execute all tests from `cms-tiktok-crawler/`:

```powershell
# Targeted test execution (fastest for development)
php artisan test --filter CrawlerArchitectureTest
php artisan test --filter CrawlJobRetryTest

# Full backend test suite
php artisan test

# Frontend type checking
npm.cmd run check-types

# Full workflow verification suite
powershell -ExecutionPolicy Bypass -File ../scripts/verify-workflow.ps1
```
