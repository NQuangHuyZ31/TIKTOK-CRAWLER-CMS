# TikTok Crawler Service Architecture

The **TikTok Crawler Service** (`tiktok-crawler-service`) is an independent asynchronous Python microservice (built with FastAPI and AsyncIO) responsible for extracting TikTok profile and video data via lightweight HTTP JSON rehydration protocols, managing a persistent queue via SQLite WAL, and streaming results to the Laravel CMS.

---

## 1. System Architecture & Component Responsibilities

```text
┌────────────────────────────────────────────────────────┐
│                   FastAPI HTTP Server                  │
│       POST /crawler/jobs · POST /crawler/stop          │
└───────────────────────────┬────────────────────────────┘
                            │ Push job to queue
                            ▼
┌────────────────────────────────────────────────────────┐
│               QueueManager (SQLite WAL)                │
│    - data/queue.db (jobs table & done_accounts table)  │
│    - FIFO queue buffer + Crash Recovery engine         │
└───────────────────────────┬────────────────────────────┘
                            │ Distributes to pool
                            ▼
┌────────────────────────────────────────────────────────┐
│              Fixed Worker Pool (5 Workers)             │
│    - Concurrent job runners (max 5 parallel jobs)      │
│    - Per-account timeout (90s) & supervisor respawn   │
└─────────────┬────────────────────────────┬─────────────┘
              │ Extract HTML/JSON          │ Webhook Stream
              ▼                            ▼
┌───────────────────────────┐┌───────────────────────────┐
│     TikTok Client         ││      Laravel CMS          │
│ - Rate Limiter (Jitter)   ││ POST /api/crawler/results │
│ - Circuit Breaker         ││ (event = "account")       │
│ - SSR Rehydration Parser  ││ (event = "done")          │
└───────────────────────────┘└───────────────────────────┘
```

---

## 2. Key Capabilities & Invariants

1. **Headless HTTP JSON Engine (No Browser Overhead)**:
   - Uses `httpx.AsyncClient` combined with `BeautifulSoup4` to download TikTok web profile pages and extract embedded JSON (`__UNIVERSAL_DATA_FOR_REHYDRATION__` or `SIGI_STATE`).
   - Requires only ~50–80 MB of RAM (compared to multiple GBs required by Chromium/Playwright instances).
2. **Persistent Queue & High Concurrency (`SQLite WAL`)**:
   - Handles concurrent requests by writing job specifications to `data/queue.db` before responding with `202 Accepted`.
3. **Fixed Worker Pool (`WORKER_COUNT = 5`)**:
   - Spawns exactly 5 worker tasks upon startup. Workers pull jobs sequentially to maintain bounded CPU and network load.
4. **Per-Account Real-Time Webhook Streaming**:
   - As each TikTok account is crawled, the worker streams an immediate webhook (`event = "account"`) back to the Laravel CMS. The CMS updates the UI and database incrementally rather than waiting for the entire batch to finish.
5. **Two-Tier Crash Recovery**:
   - **Tier 1 (Local SQLite)**: On process restart, interrupted `running` jobs are restored at the head of the queue, resuming only from unfinished accounts.
   - **Tier 2 (Container Redeployment)**: If SQLite storage is lost, queries `GET /crawler/jobs/unfinished` on Laravel to recover outstanding jobs.
6. **Anti-Blocking Defenses**:
   - Global adaptive rate limiter with randomized jitter delay.
   - Circuit breaker: Halts worker tasks when 5 consecutive `429 Too Many Requests` or captcha challenges are encountered.
