# TikTok Crawler Service

A high-performance, container-ready Python microservice for crawling TikTok profile metadata, metrics, and avatars without official API keys or paid captcha services.

📖 **Detailed Documentation:** [docs/TIKTOK_CRAWLER_SERVICE.md](../../docs/TIKTOK_CRAWLER_SERVICE.md)

---

## ⚡ Quick Start

### 1. Requirements & Setup
```bash
cd ProcessData/tiktok-crawler
pip install -r requirements.txt
playwright install chromium
```

### 2. Start the Service
```bash
python app/main.py
```
The FastAPI server will be listening at `http://0.0.0.0:8001`.

### 3. Run Unit Tests
```bash
python -m unittest discover -s tests
```

---

## 🚀 Key Architectural Highlights

* **8-Step Lifecycle Workflow:** Clean separation of concerns between navigation, rendering, validation, extraction, and callback.
* **Anti-Bot Evasion Layer:** Automated Blink feature masking, `navigator.webdriver` removal, and standard desktop Chrome fingerprinting.
* **Smart Blocking:** Aborts video/audio media streams and external trackers to keep container RAM usage below 512MB on Render.
* **Dual-Tier Extraction:** Prioritizes exact integer Server-Side Rendered (SSR) JSON scripts (`__UNIVERSAL_DATA_FOR_REHYDRATION__` and `SIGI_STATE`) with fallback to DOM selectors.
* **Strict Evidence Verification:** Distinguishes between legitimate `0` metrics and missing fields, verifies candidate username against target to prevent cross-account contamination, and classifies private profiles explicitly.
* **Resilient Webhook Callbacks:** Automatic 3-attempt exponential backoff for Laravel CMS events (`account` and `completed`).

---

## 📡 API Overview

### Inbound: Start Crawl Job
* `POST /api/crawl-jobs/start` (Response: `202 Accepted`)
```json
{
  "job_id": 1,
  "source_type": "usernames",
  "usernames": ["khaby.lame"],
  "callback_url": "https://cms-tiktok-web.onrender.com/admin/api/public/crawler"
}
```

### Outbound: Webhook Events
* `POST {callback_url}/crawl-jobs/{job_id}/events`
  * Event `account`: Delivered per crawled profile (status: `success`, `private`, or `failed`).
  * Event `completed`: Delivered once all targets are processed with summary counts.
