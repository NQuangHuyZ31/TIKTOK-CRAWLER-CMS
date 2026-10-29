# CMS TikTok Crawler

> Enterprise platform for distributed TikTok account intelligence, batch profile aggregation, analytics, and administrative management.

Built with **Laravel 11/13 + React 19 SPA (Ant Design 5 & Tailwind CSS)** following the modular **Ureka Enterprise Architecture**, powered by an asynchronous **Python FastAPI + Playwright** crawler service.

---

## 🌟 Key Product Capabilities

- **Multi-Source Data Ingestion**:
  - Ingest profiles by list of TikTok usernames or direct profile URLs.
  - Periodic automated re-crawling of existing accounts in database.
  - Automated avatar downloading and local/cloud storage synchronization.
- **Asynchronous Crawl Execution**:
  - Non-blocking execution orchestrated via background job queues.
  - Real-time webhook callbacks reporting progress, success, and error diagnostics.
- **Enterprise Management Portal**:
  - Unified Single Page Application (SPA) with modern, responsive Ant Design 5 UI.
  - Role-Based Access Control (RBAC) with granular permission matrices (`viewer`, `editor`, `manager`, `admin`).
  - Interactive KPI dashboard showcasing growth metrics, interaction ratios, and job histories.
- **Modular Monorepo Architecture**:
  - Independent business modules (`Core`, `Crawler`, `TiktokAccount`, `User`, `Role`, `Permission`, `Auth`, `System`, `API`).
  - Scoped DOM dynamic asset resolution and API client decoupling.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies & Frameworks | Description |
| :--- | :--- | :--- |
| **Backend REST API** | Laravel 11/13, PHP 8.3, Composer | Modular Ureka design with thin controllers, repository patterns, and dynamic route registry. |
| **Frontend Portal** | React 19, TypeScript, Ant Design 5, Redux Toolkit, Tailwind CSS | Modular Scoped DOM Single Page Application with strict type safety. |
| **Crawler Engine** | Python 3.10+, FastAPI, Playwright, Uvicorn | Headless browser automation handling dynamic content, anti-bot bypass, and avatar extraction. |
| **Database & Cache** | MySQL 8.0 / SQLite, Redis, PDO | Relational data persistence, session management, and job queues. |
| **Deployment** | Docker, Nginx, PHP-FPM, Render.com | Multi-container architecture with production health probes (`/api/health`). |

---

## 📦 Modular Business Domains

The platform backend and frontend are organized into discrete Ureka modules:

- **`Core`**: Foundation infrastructure, dynamic route resolvers, Scoped DOM asset injectors, and shared UI components (`ListLayout`, `Table`, `CardKPI`, `ResourceForm`).
- **`Crawler`**: Job session management, execution triggers, batch status tracking, and crawl results inspection.
- **`TiktokAccount`**: TikTok account registry, profile stats (followers, following, likes), bio, verified status, and avatar storage.
- **`Auth`**: Authentication, token lifecycle, profile management, and password reset workflows.
- **`User`**: System account management, status toggle, and role/permission assignments.
- **`Role` & `Permission`**: Role hierarchies, granular ability gates, and permission matrix editor.
- **`System`**: Audit logging, system diagnostics, and configuration management.
- **`API`**: Public webhook endpoints for ingestion callbacks from external crawler workers.

---

## 🚀 Quick Start Guide

### Prerequisites
- **PHP** >= 8.3 with extensions (`pdo_mysql`, `mbstring`, `bcmath`, `zip`, `intl`, `pcntl`, `opcache`, `gd`, `redis`)
- **Composer** >= 2.6
- **Node.js** >= 20.x & **NPM**
- **Python** >= 3.10 (for crawler service)
- **Database**: MySQL 8.0+ or SQLite

### 1. Backend & Admin Setup
```bash
# Navigate to the CMS module
cd cms-tiktok-crawler

# Copy environment configuration
cp .env.example .env

# Install backend dependencies
composer install

# Generate application encryption key
php artisan key:generate

# Run database migrations and seed initial accounts
php artisan migrate --seed

# Install frontend dependencies
npm ci

# Start development servers
php artisan serve    # Backend listening on http://localhost:8000
npm run dev          # Frontend Vite HMR on http://localhost:5173
```

### 2. Python Crawler Setup
```bash
# Navigate to the crawler service
cd ProcessData/tiktok-crawler

# Install Python requirements
pip install -r requirements.txt

# Install Playwright browser binaries
playwright install chromium

# Launch the crawler service
python app/main.py   # Crawler listening on http://0.0.0.0:8001
```

### 3. Accessing the Platform
- **Admin Portal**: Open `http://localhost:8000/admin`
- **Default Administrator Credentials**:
  - **Email**: `admin@cms.com`
  - **Password**: `password`
- **Health Check Endpoint**: `http://localhost:8000/api/health`

---

## 🐳 Docker & Production Deployment

The platform is fully containerized and deployable via Docker:

- **Web Container (`docker/Dockerfile.web`)**: Packages Nginx, PHP-FPM 8.3, and pre-compiled React SPA assets.
- **Crawler Container (`docker/Dockerfile.crawler`)**: Packages Python FastAPI with Playwright headless Chromium.
- **Worker Container (`docker/Dockerfile.worker`)**: Runs background queues (`php artisan queue:work`) and scheduler.
- **Blueprint Specification (`render.yaml`)**: Cloud configuration ready for deployment on Render.com with automated `/api/health` checks.

---

## 📄 License & Maintenance
Proprietary software maintained for enterprise TikTok account monitoring operations.
