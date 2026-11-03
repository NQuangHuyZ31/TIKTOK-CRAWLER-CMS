# Backend Architecture & 3-Layer DDD Pattern

This document details the backend architectural standards for the Laravel 13 CMS application, covering the Controller -> Service -> Repository pattern, Dynamic Routing, Form Requests, and API Resources.

---

## 1. The Strict 3-Layer Architecture

To maintain testability, maintainability, and clean separation of concerns, all modules enforce a strict one-way dependency chain:

```text
HTTP Request
     │
     ▼
┌──────────────────────────────────────────────┐
│               Controller Layer               │
│  - Extends BaseController                    │
│  - Validates input via FormRequest           │
│  - Formats responses via ApiResponseTrait    │
│  - Calls Service exclusively                 │
└──────────────────────┬───────────────────────┘
                       │ Calls Service methods
                       ▼
┌──────────────────────────────────────────────┐
│                Service Layer                 │
│  - Encapsulates domain business logic        │
│  - Coordinates transactions (DB::transaction)│
│  - Dispatches Jobs & triggers Audit events   │
│  - Depends ONLY on Repository Interfaces     │
│  - NO direct Model queries or persistence    │
└──────────────────────┬───────────────────────┘
                       │ Injects Repository Interface
                       ▼
┌──────────────────────────────────────────────┐
│               Repository Layer               │
│  - Extends BaseRepository                    │
│  - Implements <Model>RepositoryInterface     │
│  - Encapsulates Eloquent queries & filtering │
│  - Executes persistence & aggregations       │
└──────────────────────┬───────────────────────┘
                       │ Executes query builder
                       ▼
                Database / Models
```

---

## 2. Layer Responsibilities & Invariants

### 2.1. Controller Layer (`src/Http/Controllers/`)
- Every controller MUST extend `Modules\Core\Http\Controllers\BaseController`.
- Controllers are strictly HTTP adaptors:
  - Extract parameters and route IDs.
  - Validate payloads using dedicated FormRequests (e.g. `app(StoreCrawlJobRequest::class)->validated()`).
  - Call the corresponding Service method.
  - Serialize output using `respondSuccess()`, `respondError()`, `respondPaginated()`, or an API Resource.
- **NEVER** inject Repositories directly into custom action methods.
- **NEVER** write Eloquent queries or business logic directly inside controller action methods.

### 2.2. Service Layer (`src/Services/`)
- Services house 100% of domain business logic.
- Services manage transaction boundaries:
  ```php
  return DB::transaction(function () use ($data) {
      $job = $this->crawlJobRepository->create($data);
      // domain events, audit logs, queue dispatches
      return $job;
  });
  ```
- **STRICT PROHIBITION**: Services MUST NEVER use Eloquent Model static queries or query builders directly (`CrawlJob::where()`, `CrawlJob::find()`, `$modelClass::...`, `DB::table()`). All data access MUST be delegated to the Repository.
- Services depend strictly on Repository Interfaces (`CrawlJobRepositoryInterface`) injected via the constructor.

### 2.3. Repository Layer (`src/Repositories/`)
- Repositories encapsulate all Eloquent queries, relationships, dynamic filters (`FilterSearchTrait`), and sorting.
- Every repository MUST extend `Modules\Core\Repositories\BaseRepository` and implement `<Model>RepositoryInterface`.
- Interface definitions live in `src/Repositories/Interfaces/`.
- Every repository interface must be bound in the module's ServiceProvider:
  ```php
  $this->app->bind(CrawlJobRepositoryInterface::class, CrawlJobRepository::class);
  ```

---

## 3. Base Classes in `modules/Core`

### `BaseController` (`Modules\Core\Http\Controllers\BaseController`)
Provides standard RESTful CRUD handlers (`index`, `show`, `store`, `update`, `destroy`) using dynamic `$modelClass` queries.
- `buildIndexQuery()`: Applies filters and search parameters.
- `findModelRecord()`: Retrieves records by ID with 404 handling.
- `ApiResponseTrait`: Provides `respondSuccess()`, `respondError()`, and `respondPaginated()`.

> [!NOTE]
> `BaseController` contains legacy generic CRUD logic that directly queries `$modelClass::query()`. This is an accepted framework exception. Custom actions in feature controllers MUST follow the 3-layer architecture.

### `BaseRepository` (`Modules\Core\Repositories\BaseRepository`)
Provides standard Eloquent query helper methods:
- `query()`: Returns an Eloquent `Builder` instance.
- `all(array $columns)`: Returns collection of models.
- `paginate(int $perPage, array $columns)`: Returns `LengthAwarePaginator`.
- `findById(int|string $id)`: Returns model or null.
- `findOrFail(int|string $id)`: Returns model or throws ModelNotFoundException.
- `create(array $attributes)`: Persists new record.
- `update(int|string $id, array $attributes)`: Updates existing record.
- `delete(int|string $id)`: Deletes record.
- `updateOrCreate(array $attributes, array $values)`: Upserts single record.
