# AUDIT_LOGGING_GUIDE.md - Universal Audit Logging & Activity Tracking Architecture

> [!IMPORTANT]
> **MANDATORY READING FOR ALL AI AGENTS & DEVELOPERS!**
> This document specifies the standard audit logging architecture across all modules in this repository.
> Always adhere to the 3-tier decoupling standards (Model, Service, Controller) to prevent code duplication and layer bloat.

---

## 1. Architectural Overview & Core Principles

The audit logging system is designed to be **event-driven, asynchronous, and non-intrusive**:

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                               3-TIER ARCHITECTURE                                │
 ├─────────────────────────┬───────────────────────────────┬────────────────────────┤
 │       CONTROLLER        │            SERVICE            │         MODEL          │
 │   (Zero-Audit Rule)     │       (Business Audits)       │     (CRUD & Sync)      │
 ├─────────────────────────┼───────────────────────────────┼────────────────────────┤
 │ • NEVER put audit calls │ • Audit::record()             │ • Trait LogsActivity   │
 │   in Controllers        │ • Audit::track()              │ • Method auditSync()   │
 │ • Pure HTTP handling    │ • Domain Events               │ • Transaction-safe     │
 │   and response return   │   (AuditableEvent)            │   (DB::afterCommit)    │
 └─────────────────────────┴───────────────┬───────────────┴───────────┬────────────┘
                                           │                           │
                                           ▼                           ▼
                        ┌────────────────────────────────────────────────────────┐
                        │     RecordActivityLogListener (ShouldQueue Worker)     │
                        │        Asynchronously writes to `activity_logs`        │
                        └────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Controllers are 100% Zero-Audit**: Controllers MUST NOT contain any audit logging code or event dispatches. Controllers only validate requests, invoke services/repositories, and return responses.
2. **Services Never Format Audit Schemas**: Services MUST NOT assemble 10-parameter generic audit dictionaries. Instead, use `Audit::record()`, `Audit::track()`, or Domain Events implementing `AuditableEvent`.
3. **Models Handle Relations via `auditSync()`**: Many-to-many relationship synchronizations (e.g. Roles, Permissions) MUST use `$this->auditSync(...)`.
4. **Transaction Safety**: All event dispatches are deferred until surrounding database transactions commit successfully (`DB::afterCommit`).

---

## 2. Model Layer: CRUD & Relationship Auditing

### 2.1. Attaching `LogsActivity` to Models
Add `Modules\System\Traits\LogsActivity` to any Eloquent model that requires lifecycle auditing:

```php
namespace Modules\TiktokAccount\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\System\Traits\LogsActivity;

class TiktokAccount extends Model
{
    use LogsActivity;

    // Optional: explicitly define module (auto-inferred from namespace if omitted)
    public string $activityModule = 'TIKTOK';
    public string $activityRecordType = 'TikTokAccount';
    public string $activityIdentifierField = 'username'; // Uses '@' . username
}
```

#### What `LogsActivity` handles automatically:
- **`created`**: Dispatches `CREATE` audit log with model attributes.
- **`updated`**: Dispatches `UPDATE` audit log with `$oldData` and `$newData`. Excludes ignored fields (`password`, `remember_token`, `updated_at`). Automatically guards against double logging if only ignored fields changed.
- **`deleted`**: Dispatches `DELETE` audit log with original attributes.

### 2.2. Auditing Many-to-Many Relations (`auditSync`)
When synchronizing pivot relationships (e.g. `User::roles`, `User::permissions`, `Role::permissions`, `Post::tags`), call `$this->auditSync()`:

```php
// In Modules\User\Models\User.php
public function syncRoles(array $roleIds): array
{
    return $this->auditSync('roles', $roleIds, identifierColumn: 'name', action: 'ROLE_CHANGE');
}

public function syncPermissions(array $permissionIds): array
{
    return $this->auditSync('permissions', $permissionIds, identifierColumn: 'slug', action: 'PERMISSION_CHANGE');
}
```

```php
// In Modules\Role\Models\Role.php
public function syncPermissions(array $permissionIds): array
{
    return $this->auditSync('permissions', $permissionIds, identifierColumn: 'slug', action: 'PERMISSION_CHANGE');
}
```

`auditSync` automatically:
1. Plucks the identifier column before and after syncing.
2. Compares old vs new arrays.
3. Dispatches the audit log only when real changes occur and the model was not freshly created.
4. Wraps dispatch in `DB::afterCommit`.

---

## 3. Service Layer: Recording Business Actions

When a Service executes business actions (such as resetting passwords, retrying crawl jobs, or executing batch synchronizations), use **one of the following two mechanisms**:

### Mechanism 3.1: `Audit::record()` (1-Liner for Instant Actions)
Use `Audit::record(...)` via the `Modules\System\Facades\Audit` facade:

```php
use Modules\System\Facades\Audit;

// In CrawlJobService.php
Audit::record(
    action: 'RETRY_CRAWL',
    target: 'job_crawl_' . $id,
    metadata: [
        'retry_count' => $crawlJob->retry_count ?? 1,
        'trigger_by' => 'manual',
    ],
    status: 'SUCCESS',
    module: 'TIKTOK',
    recordType: 'CrawlJob'
);
```

#### Auto-Resolution of Target:
If an Eloquent Model is passed to `target`, `Audit::record` automatically infers:
- `recordId`: From `$target->getKey()` or username/slug.
- `recordType`: From `class_basename($target)`.
- `module`: From model namespace (`Modules\User\...` $\rightarrow$ `USER_MANAGEMENT`, `Modules\Crawler\...` $\rightarrow$ `TIKTOK`).
- `user`: From `auth()->user()`.

```php
// Passing an Eloquent model:
Audit::record(
    action: 'VERIFY_ACCOUNT',
    target: $user,
    metadata: ['method' => 'email_otp']
);
```

### Mechanism 3.2: `Audit::track()` (Execution Boundary with Automatic Try-Catch)
When a business action contains logic that can throw exceptions, use `Audit::track(...)`. It automatically captures errors, logs `FAILED` status with the error message, and re-throws the exception:

```php
use Modules\System\Facades\Audit;

public function sendMailResetPassword(int|string $id): void
{
    $user = $this->userRepository->findById($id);

    Audit::track(
        action: 'REQUEST_RESET_PASSWORD',
        target: $user,
        execute: function () use ($user) {
            $token = Password::createToken($user);
            $resetUrl = config('app.url') . '/admin/auth/login?token=' . $token;
            PasswordResetNotification::dispatch($user->email, $resetUrl, $user->name);
        },
        metadata: ['target_email' => $user->email]
    );
}
```

- If `execute` succeeds: records `status: 'SUCCESS'` and returns the callback's result.
- If `execute` throws: records `status: 'FAILED'`, sets `error_message`, and **re-throws the exception** to preserve normal application exception handling.

---

## 4. Domain Events: `AuditableEvent` Interface

For large asynchronous workflows or domain-driven events, create an Event class implementing `Modules\System\Contracts\AuditableEvent`:

```php
namespace Modules\Crawler\Events;

use Modules\System\Contracts\AuditableEvent;

class CrawlJobCompleted implements AuditableEvent
{
    public function __construct(
        public int $jobId,
        public int $totalCrawled
    ) {}

    public function toActivityLog(): array
    {
        return [
            'action' => 'CRAWL_COMPLETED',
            'module' => 'TIKTOK',
            'record_id' => 'job_crawl_' . $this->jobId,
            'record_type' => 'CrawlJob',
            'metadata' => ['total_crawled' => $this->totalCrawled],
            'status' => 'SUCCESS',
        ];
    }
}
```

Dispatching the event:
```php
event(new CrawlJobCompleted($jobId, $count));
```
`RecordActivityLogListener` automatically catches any event implementing `AuditableEvent` and queues it for persistence.

---

## 5. Anti-Patterns & Rules (DO NOT DO)

> [!CAUTION]
> **NEVER DO THE FOLLOWING:**

| Anti-Pattern | Why it is Prohibited | What to do Instead |
| :--- | :--- | :--- |
| **Audit code in Controllers** | Violates Single Responsibility; clutters HTTP layer. | Let Models (`LogsActivity`) or Services (`Audit::record`) handle it. |
| **Direct DB inserts into `activity_logs`** | Bypasses queueing, transaction safety, and schema defaults. | Use `Audit::record()` or `LogsActivity`. |
| **Manual `try/catch` + duplicate dispatch** | Bloats services with 20+ lines of duplicate logging code. | Use `Audit::track()`. |
| **Manual relation diff in Model** | Duplicates 30 lines of array plucking and diffing. | Use `$this->auditSync()`. |
| **Hardcoding user actor without auth check** | Breaks under CLI commands or background workers. | Omit `user` or pass `auth()->user()`. |

---

## 6. Verification & Testing

When adding or refactoring audit logging:
1. Run PHP tests:
   ```powershell
   php artisan test --filter AuditorPipelineTest
   ```
2. Run strict TypeScript check:
   ```powershell
   npm.cmd run check-types
   ```
