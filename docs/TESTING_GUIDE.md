# Automated Testing Guide

This guide establishes testing conventions, best practices, and execution commands for both Backend and Frontend test suites in `cms-tiktok-crawler`.

---

## 1. Testing Infrastructure Overview

1. **Backend Testing (PHPUnit 12 & Pest)**:
   - Configured via `phpunit.xml` to execute against an in-memory SQLite database (`:memory:`).
   - `tests/Feature/`: Tests for API endpoints, dynamic route resolution, authentication, and RBAC permissions.
   - `tests/Unit/`: Isolated unit tests for utility and support classes.
2. **Frontend Type Checking (TypeScript Compiler)**:
   - Evaluates all React components, Redux slices, hooks, and API actions using `tsc --noEmit`.

---

## 2. Writing Backend Feature Tests

Every new API action or data modification **must be accompanied by a Feature Test** under `tests/Feature/`.

### 2.1. Feature Test Template

```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Modules\Crawler\Models\CrawlJob;
use Tests\TestCase;

class CrawlJobApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed default roles, permissions, and initial admin user
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Resolves the configured admin API URI
     */
    protected function apiUri(string $path): string
    {
        $adminPath = trim((string) config('admin.admin_path', 'admin'), '/');
        $prefix = $adminPath !== '' ? $adminPath : 'admin';

        return '/' . $prefix . '/api/' . ltrim($path, '/');
    }

    /**
     * Authenticates an admin user for test requests
     */
    protected function authenticateAdmin(): User
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user, ['*']);
        return $user;
    }

    public function test_can_list_crawl_jobs(): void
    {
        $this->authenticateAdmin();

        CrawlJob::create([
            'source_type' => 'usernames',
            'data_crawls' => json_encode(['@creator_test']),
            'total_accounts' => 1,
            'status' => 'pending',
        ]);

        $response = $this->getJson($this->apiUri('crawler/crawl-job'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => ['id', 'source_type', 'status', 'total_accounts']
                ]
            ]);
    }

    public function test_create_crawl_job_validates_required_fields(): void
    {
        $this->authenticateAdmin();

        $response = $this->postJson($this->apiUri('crawler/crawl-job'), []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['source_type', 'data_crawl']);
    }

    public function test_can_create_crawl_job_successfully(): void
    {
        $this->authenticateAdmin();

        $payload = [
            'source_type' => 'usernames',
            'data_crawl' => ['@creator1', '@creator2'],
        ];

        $response = $this->postJson($this->apiUri('crawler/crawl-job'), $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.total_accounts', 2)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('crawl_jobs', [
            'source_type' => 'usernames',
            'total_accounts' => 2,
            'status' => 'pending',
        ]);
    }
}
```

---

## 3. Running Test Suites

### 3.1. Backend Tests (PHPUnit)

- **Run all test suites**:
  ```powershell
  php artisan test
  ```

- **Run a specific test file**:
  ```powershell
  php artisan test tests/Feature/CrawlerArchitectureTest.php
  ```

- **Filter by test class or method name**:
  ```powershell
  php artisan test --filter CrawlJobApiTest
  php artisan test --filter test_can_create_crawl_job_successfully
  ```

### 3.2. Frontend Type Checking (TypeScript)

> [!IMPORTANT]
> On **Windows PowerShell**, always execute `npm.cmd` or `npx.cmd` to prevent PowerShell script execution policy errors:

```powershell
npm.cmd run check-types
```

### 3.3. Module Asset Compilation Test

Verify that a module's frontend compiles cleanly:
```powershell
npm.cmd run mix:crawler
```
Or build all modules:
```powershell
npm.cmd run mix:all
```

---

## 4. Best Practices for Test Implementation

1. **Always use `RefreshDatabase`**: Ensures tests run against a clean database state.
2. **Never hardcode paths**: Use the `$this->apiUri(...)` helper to adapt to changes in `config('admin.admin_path')`.
3. **Verify both positive and negative cases**:
   - Success scenarios (200 / 201).
   - Validation failures (422 with proper error keys).
   - Not found scenarios (404 with standard message).
   - Unauthorized / Forbidden scenarios (401 / 403).
4. **Mock External Networks**: Use `Http::fake()` to stub TikTok network requests or third-party webhooks.
5. **Write All Assertions & Messages in English**: Keep test method names and failure assertions clear and descriptive in English.
