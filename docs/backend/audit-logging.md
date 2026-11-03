# Universal Audit Logging & Activity Tracking Architecture

This guide details the universal audit logging system built into the CMS application via the `System` module (`ActivityLogger`, `Auditor`, `LogsActivity`).

---

## 1. Architectural Overview

The auditing system tracks all administrative actions, data modifications, login sessions, and crawler lifecycle events.

```text
HTTP Request / Service Action
        │
        ├──► Automatic Model Mutation ──────► LogsActivity Trait ──► Auditor::recordModelChange()
        │                                                                  │
        └──► Explicit Service Action   ──────► ActivityLogger       ───────┘
                                                     │
                                                     ▼
                                        System Module Database Tables
                                      (activity_logs & login_logs)
```

---

## 2. Model Layer: CRUD Auditing (`LogsActivity` Trait)

To enable automatic auditing on Eloquent models, attach the `LogsActivity` trait:

```php
namespace Modules\Crawler\Models;

use Illuminate\Database\Eloquent\Model;
use Modules\System\Traits\LogsActivity;

class CrawlJob extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'status',
        'crawl_mode',
        'total_accounts',
    ];

    // Optional: Specify fields excluded from audit logging
    protected array $auditExclude = [
        'updated_at',
        'remember_token',
    ];
}
```

### What `LogsActivity` Tracks Automatically:
- **Created**: Logs new record attributes.
- **Updated**: Computes before/after diffs (`old` vs `new`) and records modified fields only.
- **Deleted**: Records the deletion event with previous state.
- Automatically associates the authenticated user (`user_id`) and IP address from the current request context.

---

## 3. Service Layer: Recording Business Actions

When an action represents a significant business workflow rather than a simple database column change, record it explicitly using `ActivityLogger`:

```php
use Modules\System\Services\ActivityLogger;

class CrawlJobService
{
    public function __construct(
        protected CrawlJobRepositoryInterface $crawlJobRepository,
        protected ActivityLogger $activityLogger
    ) {}

    public function stopJob(int|string $id): CrawlJob
    {
        $job = $this->crawlJobRepository->findById($id);
        
        // Business logic to halt worker
        $this->crawlJobRepository->update($id, ['status' => 'cancelled']);

        $this->activityLogger->log(
            action: 'stop_crawl_job',
            description: "Crawl job #{$id} ({$job->name}) was stopped by user.",
            module: 'crawler',
            entityType: CrawlJob::class,
            entityId: $id
        );

        return $job;
    }
}
```

---

## 4. Pruning & Retention

The `System` module provides scheduled pruning for expired logs:
- `PruneExpiredLogsJob`: Scheduled daily to purge activity and login logs exceeding the retention threshold configured in `system_settings` (default: 90 days).
