# Backend Engineering Rules (Laravel 13 + PHP 8.3+)

Scope: `cms-tiktok-crawler/modules/*/src/`, `database/`, and backend controllers. Read when editing backend code.
Detailed Architecture: [`docs/backend/architecture.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/architecture.md) | API Contracts: [`docs/api/routing-and-contracts.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/api/routing-and-contracts.md)

## 1. Strict 3-Layer Architecture (Controller -> Service -> Repository)
1. **Controller Layer** (`src/Http/Controllers/`):
   - Extends `Modules\Core\Http\Controllers\BaseController`.
   - Handles HTTP inputs, validation via FormRequest, response formatting (`respondSuccess`, `respondError`, `respondPaginated`, or an API Resource).
   - In custom actions, MUST ONLY invoke the **Service Layer**.
   - NEVER inject Repositories or execute Eloquent queries / business logic inside custom actions.
2. **Service Layer** (`src/Services/`):
   - Domain business logic, data mutations, transactions (`DB::transaction`), audit events (`Auditor`/`ActivityLogger`), and queue jobs.
   - Depends ONLY on **Repository Interfaces** via Dependency Injection.
   - **STRICTLY FORBIDDEN from direct Model queries or persistence** (never `Model::where()`, `Model::create()`, `$modelClass::...`, or `DB::table()`). Delegate 100% of data access to Repositories.
   - Importing Model classes strictly for type hints / parameter typing is allowed.
3. **Repository Layer** (`src/Repositories/`):
   - Encapsulates all Eloquent queries, relationships (`with`), dynamic filtering (`FilterSearchTrait`), pagination, and aggregations.
   - MUST extend `Modules\Core\Repositories\BaseRepository` and implement `<Model>RepositoryInterface` in `src/Repositories/Interfaces/`.
   - Bound in `<Module>ServiceProvider`: `$this->app->bind(<Model>RepositoryInterface::class, <Model>Repository::class)`.

## 2. Dynamic Routing & Method Safety
- Routes are resolved dynamically by `Modules\Core\Support\DynamicRouteResovle` matching `/{module}/{controller}/{id?}/{action?}` to `Modules\<Module>\Http\Controllers\<Studly>Controller`.
- **CRITICAL**: Every `public` controller method is an HTTP endpoint. Internal helpers MUST be `protected` or `private`.
- Permissions enforced automatically by `CheckModulePermission` middleware (403 on denial). `auth` module is exempt.
- Check `DynamicRouteResovle` before adding explicit routes to `routes/api.php` (crawler webhook in `modules/API/routes/api.php` is an exception).

## 3. Validation & Resources
- Validate all incoming data via dedicated `FormRequest` classes in `src/Http/Requests/`. Never validate inline in controllers.
- Return standardized JSON responses using `ApiResponseTrait` or explicit API Resources from `src/Resources/`.
- Never return raw Eloquent models containing hidden tokens, passwords, or internal database flags.

## 4. Background Jobs & Transactions
- Queue jobs (`src/Jobs/`) must be idempotent and safe to retry.
- Wrap multi-table database mutations in `DB::transaction()` inside the Service layer.
- External HTTP integrations must specify timeouts and retry backoffs.
