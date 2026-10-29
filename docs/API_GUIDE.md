# API Development & Dynamic Routing Guide

This document provides complete instructions for designing, implementing, and consuming APIs within the `cms-tiktok-crawler` project following the **Ureka Modular Architecture**.

---

## 1. Dynamic Route Resolution Engine

The application leverages `DynamicRouteResovle` located at [`Modules\Core\Support\DynamicRouteResovle`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/src/Support/DynamicRouteResovle.php). You **do not** need to manually define static routes for standard CRUD and custom actions.

### 1.1. Standard URL Structure

All administrative API endpoints are routed under the admin API prefix (configured via `config('admin.admin_path')`, defaulting to `admin`):

$$\text{Base URI: } \texttt{/admin/api/\{module\}/\{controller\}/...}$$

### 1.2. The Four Supported Route Patterns

| Route Pattern | Example Endpoint | Resolved Controller Method |
| :--- | :--- | :--- |
| **RESTful Collection**<br>`/{module}/{controller}` | `GET /admin/api/crawler/crawl-job`<br>`POST /admin/api/crawler/crawl-job` | `index(Request $request)`<br>`store(Request $request)` |
| **RESTful Single Record**<br>`/{module}/{controller}/{id}` | `GET /admin/api/crawler/crawl-job/15`<br>`PUT /admin/api/crawler/crawl-job/15`<br>`DELETE /admin/api/crawler/crawl-job/15` | `show(int $id)`<br>`update(Request $request, int $id)`<br>`destroy(int $id)` |
| **Custom Action (Collection)**<br>`/{module}/{controller}/{action}` | `GET /admin/api/crawler/crawl-job/statistics-summary`<br>`GET /admin/api/user/user/export` | `statisticsSummary()`<br>`export()` |
| **Custom Action (Specific Record)**<br>`/{module}/{controller}/{id}/{action}` | `POST /admin/api/crawler/crawl-job/15/start`<br>`GET /admin/api/crawler/crawl-job/15/results` | `start(int $id)`<br>`results(int $id)` |

### 1.3. Slug to Class & Method Mapping
1. **Module & Controller**: Kebab-case segments are mapped to `StudlyCase`:
   - `crawler` $\rightarrow$ Module `Modules\Crawler`
   - `crawl-job` $\rightarrow$ Controller `CrawlJobController`
2. **Action Method**: Kebab-case action segment is converted to `camelCase`:
   - `statistics-summary` $\rightarrow$ Method `statisticsSummary()`
   - `export-excel` $\rightarrow$ Method `exportExcel()`

---

## 2. Controller Development (Extending `BaseController`)

All API controllers **must extend** [`Modules\Core\Http\Controllers\BaseController`](file:///E:/Urekamedia/TIKTOK-CRAWLER/cms-tiktok-crawler/modules/Core/src/Http/Controllers/BaseController.php).

### 2.1. Standard Controller Boilerplate

```php
<?php

namespace Modules\Crawler\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Core\Http\Controllers\BaseController;
use Modules\Crawler\Models\CrawlJob;
use Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface;
use Modules\Crawler\Http\Requests\StoreCrawlJobRequest;
use Modules\Crawler\Resources\CrawlJobResource;
use Modules\Crawler\Services\CrawlJobService;

class CrawlJobController extends BaseController
{
    // 1. Associated Eloquent Model class
    protected string $modelClass = CrawlJob::class;

    // 2. API Resource class for transforming response payload (optional)
    protected ?string $resourceClass = CrawlJobResource::class;

    // 3. Columns searchable via ?search= keyword query
    protected array $searchableColumns = ['source_type', 'status', 'error_message'];

    // 4. Columns filterable via exact query parameters (?status=pending)
    protected array $filterableColumns = ['status', 'source_type', 'started_at'];

    // 5. Default order: [column, direction]
    protected array $defaultSort = ['id', 'desc'];

    // 6. Public actions exempt from module permission checks (if any)
    public array $publicActions = [];

    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected CrawlJobService $crawlJobService
    ) {}

    /**
     * Override store to encapsulate business validation and creation
     */
    public function store(Request $request): JsonResponse
    {
        $validated = app(StoreCrawlJobRequest::class)->validated();
        $job = $this->crawlJobService->createNewJob($validated);

        return $this->respondSuccess(new CrawlJobResource($job), 'Crawl job created successfully.', 201);
    }

    /**
     * Custom Action: POST /admin/api/crawler/crawl-job/{id}/start
     */
    public function start(int|string $id): JsonResponse
    {
        $job = $this->crawlJobRepository->findById((int) $id);
        if (!$job) {
            return $this->respondError('Resource not found.', 404);
        }

        $this->crawlJobService->dispatchJob($job);

        return $this->respondSuccess(new CrawlJobResource($job), 'Job started successfully.');
    }
}
```

### 2.2. Standard JSON Response Helpers (`ApiResponseTrait`)

Never use arbitrary `response()->json(...)`. Use the unified methods inherited from `ApiResponseTrait`:

- **Success with Data**:
  ```php
  return $this->respondSuccess($data, 'Operation successful.', 200);
  ```
- **Paginated Collection**:
  ```php
  return $this->respondPaginated($paginator, 'Records retrieved successfully.');
  ```
- **Error Response**:
  ```php
  return $this->respondError('Validation failed.', 422, $errorsArray);
  ```

---

## 3. Request Validation (Form Request Layer)

Always isolate validation rules in `Modules\<ModuleName>\Http\Requests\<Name>Request.php`:

```php
<?php

namespace Modules\Crawler\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCrawlJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'source_type' => ['required', 'string', 'in:usernames,urls,database,count'],
            'data_crawl'  => ['required'],
            'priority'    => ['nullable', 'integer', 'min:1', 'max:10'],
        ];
    }
}
```

---

## 4. Repository & Service Layer

Maintain strict separation of concerns:
- **Repository**: Handles database interactions. Extends `Modules\Core\Repositories\BaseRepository`.
- **Service**: Handles complex domain logic, triggers queue jobs, interacts with external services.
- **Provider Binding**: Bind repository interfaces in `Modules\<ModuleName>\Providers\<Name>ServiceProvider.php`:

```php
public function register(): void
{
    $this->app->bind(
        \Modules\Crawler\Repositories\Interfaces\CrawlJobRepositoryInterface::class,
        \Modules\Crawler\Repositories\CrawlJobRepository::class
    );
}
```

---

## 5. Consuming APIs on Frontend (TypeScript)

Export typed API methods in `modules/<ModuleName>/resources/js/Action/<name>.ts` using `@core/Action/api`:

```typescript
import { api } from '@core/Action/api';

export interface CrawlJobPayload {
    source_type: 'usernames' | 'urls' | 'database' | 'count';
    data_crawl: string[] | string;
    priority?: number;
}

export const getCrawlJobs = (params: Record<string, any> = {}) =>
    api('/crawler/crawl-job', { params });

export const getCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}`);

export const createCrawlJob = (data: CrawlJobPayload) =>
    api('/crawler/crawl-job', { method: 'POST', data });

export const startCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}/start`, { method: 'POST' });

export const deleteCrawlJobByID = (id: string | number) =>
    api(`/crawler/crawl-job/${id}`, { method: 'DELETE' });
```

---

## 6. Pre-Implementation Quality Checklist

1. [ ] Check if `Core` already has an existing trait, utility, or repository method to reuse.
2. [ ] Controller inherits from `Modules\Core\Http\Controllers\BaseController`.
3. [ ] Define `$modelClass`, `$searchableColumns`, and `$filterableColumns`.
4. [ ] Input validation handled via a dedicated `FormRequest`.
5. [ ] Reponses use `respondSuccess`, `respondPaginated`, or `respondError`.
6. [ ] Repository bound to its interface in the module's ServiceProvider.
7. [ ] Feature tests written under `tests/Feature/` and verified passing.
8. [ ] All text, comments, and messages written strictly in English.
