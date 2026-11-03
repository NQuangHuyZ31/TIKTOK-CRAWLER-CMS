# Database Schema & Migration Guidelines

This document details database conventions, table structures, index design, and model relationships across the CMS application.

---

## 1. Migration Invariants & Standards

- **Strictly Additive**: Migrations must be backward-compatible (new nullable columns, columns with defaults, new indexes, or new tables).
- **Never Modify Merged Migrations**: Do not edit committed migration files. Always create a new timestamped migration.
- **In-Memory Testing**: All automated tests run on an in-memory SQLite database (`:memory:` configured in `phpunit.xml`). Migrations must remain compatible with SQLite syntax.

---

## 2. Core Database Schema & Entities

### Crawling Subsystem (`modules/Crawler`)
- **`crawl_jobs`**: Represents a crawling batch session.
  - Columns: `id`, `name`, `status` (`queued`, `running`, `completed`, `failed`, `cancelled`), `crawl_mode` (`usernames`, `urls`, `count`), `source_type`, `source_value`, `total_accounts`, `crawled_accounts`, `failed_accounts`, `max_videos_per_account`, `started_by`, `error_message`, `started_at`, `completed_at`, `timestamps`, `softDeletes`.
- **`crawl_results`**: Historical record of an account crawled during a specific job.
  - Columns: `id`, `crawl_job_id` (FK), `username`, `status`, `avatar_path`, `followers_count`, `following_count`, `likes_count`, `videos_crawled_count`, `crawled_at`, `timestamps`.
- **`crawl_video_results`**: Historical snapshot of individual videos retrieved during a crawl job.
  - Columns: `id`, `crawl_job_id` (FK), `crawl_result_id` (FK), `video_id`, `username`, `play_count`, `digg_count`, `comment_count`, `share_count`, `published_at`, `play_count_delta`, `digg_count_delta`, `timestamps`.

### Account Intelligence Subsystem (`modules/TiktokAccount`)
- **`tiktok_accounts`**: Master directory of tracked TikTok profiles.
  - Columns: `id`, `username` (unique index), `nickname`, `avatar_path`, `followers_count`, `following_count`, `likes_count`, `total_videos`, `last_crawled_at`, `timestamps`, `softDeletes`.
- **`tiktok_videos`**: Master repository of discovered TikTok videos.
  - Columns: `id`, `tiktok_account_id` (FK), `video_id` (unique index), `description`, `cover_url`, `play_count`, `digg_count`, `comment_count`, `share_count`, `published_at`, `timestamps`.

### Access Control Subsystem (`modules/Permission`, `modules/Role`, `modules/User`)
- **`users`**: Administrative users.
  - Columns: `id`, `name`, `email` (unique index), `password`, `is_active`, `timestamps`, `softDeletes`.
- **`roles`**: User roles (e.g. `admin`, `operator`, `viewer`).
  - Columns: `id`, `name`, `slug` (unique), `description`, `timestamps`, `softDeletes`.
- **`permissions`**: Fine-grained module actions.
  - Columns: `id`, `module`, `action` (`view`, `create`, `edit`, `delete`), `slug` (unique: `module.action`), `timestamps`, `softDeletes`.
- **Pivot Tables**: `role_user`, `permission_role`.

### System Auditing (`modules/System`)
- **`activity_logs`**: Universal audit trail.
  - Columns: `id`, `user_id` (nullable FK), `action`, `module`, `entity_type`, `entity_id`, `changes` (JSON), `ip_address`, `user_agent`, `timestamps`.
- **`login_logs`**: User authentication history.
  - Columns: `id`, `user_id` (FK), `email`, `ip_address`, `user_agent`, `status` (`success`, `failed`), `timestamps`.
- **`system_settings`**: Key-value configuration store.
  - Columns: `id`, `key` (unique index), `value`, `group`, `type`, `timestamps`.

---

## 3. Foreign Keys & Indexing Rules

- Foreign key constraints must be defined explicitly:
  ```php
  $table->foreignId('crawl_job_id')->constrained()->cascadeOnDelete();
  ```
- Always add indexes on fields used for filtering, ordering, or lookups:
  ```php
  $table->index('status');
  $table->index('crawled_at');
  $table->unique(['crawl_job_id', 'username']);
  ```
