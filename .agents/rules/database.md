# Database & Data Integrity Rules (Laravel Migrations & Models)

Scope: `cms-tiktok-crawler/modules/*/database/migrations/` and `src/Models/`. Read when modifying schemas or models.
Detailed Schema: [`docs/database/schema-and-migrations.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/database/schema-and-migrations.md) | Audit Guide: [`docs/backend/audit-logging.md`](file:///E:/Urekamedia/TIKTOK-CRAWLER/docs/backend/audit-logging.md)

## 1. Migration Invariants
- **Additive & Backward Compatible**: Migrations MUST be additive (new nullable/defaulted columns, new indexes, new tables).
- **NEVER Edit Merged Migrations**: Never modify an existing, committed migration file. Always create a new timestamped migration.
- **Destructive Changes**: Dropping tables or renaming columns requires explicit human confirmation and rollback plans.
- **Test Database Isolation**: Automated tests execute against in-memory SQLite (`:memory:` in `phpunit.xml`). Migrations must remain compatible with SQLite syntax.
- **Zero Production Mutation**: Agents must NEVER delete or mutate production data in routine tasks.

## 2. Naming Conventions & Schema Standards
- **Tables**: Plural `snake_case` (e.g. `crawl_jobs`, `crawl_results`, `tiktok_accounts`).
- **Foreign Keys**: Plural parent model singularized with `_id`: `$table->foreignId('crawl_job_id')->constrained()->cascadeOnDelete()`.
- **Soft Deletes**: Use `$table->softDeletes()` when sibling tables in the domain use it.
- **Indexes**: Add explicit indexes on columns used in WHERE filters, JOINs, or ORDER BY sorts (e.g. `status`, `username`, `crawled_at`).
- **N+1 Prevention**: Repositories MUST eager-load relations via `with([...])`.

## 3. Eloquent Models
- **Mass Assignment**: Declare explicit `$fillable` arrays on all models. NEVER declare `$guarded = []`.
- **Audit Logging**: Attach `LogsActivity` trait on models where audit tracking is required.
- **Type Casting**: Declare explicit `$casts` for booleans, JSON columns, and dates (`datetime`).
