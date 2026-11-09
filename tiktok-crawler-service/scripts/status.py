#!/usr/bin/env python3
"""
TikTok Crawler Service - Realtime Status Dashboard
Usage:
    python scripts/status.py
    python scripts/status.py --watch      # Auto-refresh every 2 seconds
"""

import argparse
from pathlib import Path
import sqlite3
import sys
import time
import urllib.request
import json

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Setup paths
SCRIPT_DIR = Path(__file__).resolve().parent
SERVICE_ROOT = SCRIPT_DIR.parent
APP_DIR = SERVICE_ROOT / "app"

for p in (str(SERVICE_ROOT), str(APP_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.core import config
except ImportError:
    try:
        import core.config as config
    except ImportError:
        config = None

DB_PATH = getattr(config, "QUEUE_DB_PATH", SERVICE_ROOT / "data" / "queue.db")
TARGET_SIZE = getattr(config, "CRAWLER_CANDIDATE_POOL_TARGET_SIZE", 2000)
LOW_WATERMARK = getattr(config, "CRAWLER_CANDIDATE_POOL_LOW_WATERMARK", 500)
DISCOVERY_WORKERS = getattr(config, "DISCOVERY_WORKER_COUNT", 2)
TOTAL_PROFILE_WORKERS = getattr(config, "WORKER_COUNT", 5)
SERVICE_PORT = getattr(config, "SERVICE_PORT", 8001)
SERVICE_HOST = getattr(config, "SERVICE_HOST", "127.0.0.1")


def check_http_service(port: int = SERVICE_PORT) -> dict | None:
    """Probe the running FastAPI HTTP service."""
    url = f"http://127.0.0.1:{port}/health"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "StatusCLI/1.0"})
        with urllib.request.urlopen(req, timeout=0.8) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except Exception:
        pass
    return None


def get_sqlite_stats(db_path: Path) -> dict:
    """Read metrics directly from SQLite database."""
    stats = {
        "db_exists": db_path.exists(),
        "candidate_valid": 0,
        "candidate_verified": 0,
        "candidate_unresolved": 0,
        "frontier_pending": 0,
        "frontier_validated": 0,
        "frontier_invalid": 0,
        "seeds_total": 0,
        "seeds_unexhausted": 0,
        "jobs_running": 0,
        "jobs_pending": 0,
        "jobs_completed": 0,
        "chunks_running": 0,
        "chunks_pending": 0,
    }

    if not db_path.exists():
        return stats

    try:
        # Read with timeout
        conn = sqlite3.connect(f"file:{str(db_path)}?mode=ro", uri=True, timeout=2.0)
        cur = conn.cursor()

        # 1. Candidate Pool
        try:
            cur.execute("SELECT COUNT(*) FROM candidate_pool WHERE lifecycle_status = 'valid';")
            stats["candidate_valid"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM candidate_pool WHERE identity_state = 'verified';")
            stats["candidate_verified"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM candidate_pool WHERE identity_state = 'unresolved';")
            stats["candidate_unresolved"] = cur.fetchone()[0]
        except sqlite3.OperationalError:
            pass

        # 2. Discovery Frontier
        try:
            cur.execute("SELECT COUNT(*) FROM discovery_frontier WHERE status = 'pending';")
            stats["frontier_pending"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM discovery_frontier WHERE status = 'validated';")
            stats["frontier_validated"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM discovery_frontier WHERE status = 'invalid';")
            stats["frontier_invalid"] = cur.fetchone()[0]
        except sqlite3.OperationalError:
            pass

        # 3. Bootstrap Seeds
        try:
            cur.execute("SELECT COUNT(*) FROM bootstrap_seeds;")
            stats["seeds_total"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM bootstrap_seeds WHERE is_exhausted = 0;")
            stats["seeds_unexhausted"] = cur.fetchone()[0]
        except sqlite3.OperationalError:
            pass

        # 4. Jobs & Chunks
        try:
            cur.execute("SELECT COUNT(*) FROM crawl_jobs WHERE crawl_status = 'running';")
            stats["jobs_running"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM crawl_jobs WHERE crawl_status = 'admission_pending';")
            stats["jobs_pending"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM crawl_jobs WHERE crawl_status = 'completed';")
            stats["jobs_completed"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM job_chunks WHERE status = 'running';")
            stats["chunks_running"] = cur.fetchone()[0]

            cur.execute("SELECT COUNT(*) FROM job_chunks WHERE status = 'pending';")
            stats["chunks_pending"] = cur.fetchone()[0]
        except sqlite3.OperationalError:
            pass

        conn.close()
    except Exception as e:
        stats["error"] = str(e)

    return stats


def render_dashboard(db_path: Path, watch: bool = False):
    http_data = check_http_service()
    db_stats = get_sqlite_stats(db_path)

    # ANSI Colors
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"

    if watch:
        # Clear screen on refresh
        print("\033[H\033[J", end="")

    now_str = time.strftime("%Y-%m-%d %H:%M:%S")

    print(f"{CYAN}{BOLD}{'=' * 65}{RESET}")
    print(f"{CYAN}{BOLD} TIKTOK CRAWLER SERVICE - REALTIME STATUS DASHBOARD{RESET}")
    print(f"{DIM} Thời gian: {now_str} | Database: {db_path.name}{RESET}")
    print(f"{CYAN}{BOLD}{'=' * 65}{RESET}")

    # 1. Server HTTP Status
    if http_data:
        active_w = http_data.get("running_jobs", 0)
        total_w = http_data.get("worker_count", TOTAL_PROFILE_WORKERS)
        idle_w = max(0, total_w - active_w)
        queued_j = http_data.get("queued_jobs", 0)
        status_badge = f"{GREEN}ONLINE (Port {SERVICE_PORT}){RESET}"
    else:
        active_w = 0
        total_w = TOTAL_PROFILE_WORKERS
        idle_w = total_w
        queued_j = db_stats.get("jobs_pending", 0)
        status_badge = f"{YELLOW}OFFLINE / STANDALONE{RESET}"

    print(f"{BOLD}► Service Server Status:{RESET} {status_badge}")
    print()

    # 2. Profile Workers
    print(f"{BOLD}[1] Profile Workers (Tiến trình cào tài khoản & video){RESET}")
    print(f"    • Tổng số Worker      : {BOLD}{total_w}{RESET}")
    if active_w > 0:
        print(f"    • Đang làm việc (Busy): {GREEN}{BOLD}{active_w}{RESET} worker(s)")
    else:
        print(f"    • Đang làm việc (Busy): {DIM}0 worker (Đang rảnh){RESET}")
    print(f"    • Đang chờ (Idle)     : {idle_w} worker(s)")
    print(f"    • Hàng đợi công việc  : {queued_j} job(s) đang chờ")
    if db_stats.get("chunks_running", 0) > 0:
        print(f"    • Chunk đang chạy     : {GREEN}{db_stats['chunks_running']}{RESET} active chunk(s)")
    print()

    # 3. Discovery Workers & Candidate Pool
    pool_count = db_stats["candidate_valid"]
    if pool_count >= TARGET_SIZE:
        pool_status = f"{GREEN}Đầy đủ ({pool_count} >= {TARGET_SIZE}){RESET}"
    elif pool_count < LOW_WATERMARK:
        pool_status = f"{YELLOW}Dưới ngưỡng tối thiểu ({pool_count} < {LOW_WATERMARK}) -> Đang nạp gấp!{RESET}"
    else:
        pool_status = f"{CYAN}Đang nạp bổ sung ({pool_count} < {TARGET_SIZE}){RESET}"

    disco_badge = f"{GREEN}{DISCOVERY_WORKERS} workers (Active){RESET}" if http_data else f"{DIM}{DISCOVERY_WORKERS} workers (Sẵn sàng khi start){RESET}"

    print(f"{BOLD}[2] Discovery Workers (Tiến trình khám phá ứng viên mới){RESET}")
    print(f"    • Số Worker ngầm      : {disco_badge}")
    print(f"    • Kho ứng viên (Pool) : {BOLD}{pool_count} / {TARGET_SIZE}{RESET} tài khoản hợp lệ")
    print(f"      - Đã xác minh sec_uid: {db_stats['candidate_verified']}")
    print(f"      - Chưa phân giải uid : {db_stats['candidate_unresolved']}")
    print(f"      - Ngưỡng tối thiểu   : {LOW_WATERMARK}")
    print(f"      - Trạng thái kho     : {pool_status}")
    print(f"    • Hàng đợi Frontier   : {db_stats['frontier_pending']} ứng viên chờ duyệt (Đã duyệt: {db_stats['frontier_validated']})")
    print(f"    • Tài khoản hạt giống : {db_stats['seeds_unexhausted']} / {db_stats['seeds_total']} hạt giống chưa khai thác hết")
    print()

    # 4. Progress bar for Candidate Pool
    percent = min(100.0, (pool_count / TARGET_SIZE) * 100) if TARGET_SIZE > 0 else 0
    filled = int(percent / 4)  # 25 characters width
    bar = "█" * filled + "░" * (25 - filled)
    print(f"    Tiến độ kho: [{GREEN}{bar}{RESET}] {percent:.1f}% ({pool_count}/{TARGET_SIZE})")

    print(f"{CYAN}{BOLD}{'=' * 65}{RESET}")
    if watch:
        print(f"{DIM}Nhấn Ctrl + C để dừng theo dõi.{RESET}")


def main():
    parser = argparse.ArgumentParser(description="TikTok Crawler Status Dashboard")
    parser.add_argument("--watch", "-w", action="store_true", help="Auto-refresh every 2 seconds")
    parser.add_argument("--interval", "-i", type=float, default=2.0, help="Refresh interval in seconds (default: 2)")
    args = parser.parse_args()

    db_path = DB_PATH
    if not db_path.exists():
        # Fallback relative to current dir
        if Path("data/queue.db").exists():
            db_path = Path("data/queue.db")

    if args.watch:
        try:
            while True:
                render_dashboard(db_path, watch=True)
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nĐã dừng theo dõi trạng thái.")
    else:
        render_dashboard(db_path, watch=False)


if __name__ == "__main__":
    main()
