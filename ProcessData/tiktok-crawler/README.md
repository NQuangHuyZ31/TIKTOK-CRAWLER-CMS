Develop TikTok profile crawler.

Avatar được lấy từ trang profile và tải vào thư mục
`cms-tiktok-crawler/storage/app/public/tiktok-account/avatars`. Đường dẫn
public tương đối và URL gốc được gửi trong callback để backend lưu vào
database. Có thể ghi đè thư mục lưu avatar bằng biến môi trường `AVATAR_DIR`.

## Service API

Start the crawler service:

```

Sau khi cập nhật code, phải dừng process Python đang chạy và khởi động lại;
Uvicorn không tự reload vì service đang chạy với `reload=False`.bash
python app/main.py
```

The backend starts a crawl with `POST /api/crawl-jobs/start`:

```json
{
  "job_id": 12,
  "usernames": ["huyak"]
}
```

Mặc định crawler gửi callback về backend tại:

```text
http://localhost:8000/api/crawlers
```

Cấu hình nằm trong [app/config.py](app/config.py). Có thể ghi đè bằng biến
môi trường:

```powershell
$env:BACKEND_CALLBACK_URL = "http://localhost:8000/api/crawlers"
$env:CALLBACK_TOKEN = "your-token"
$env:CRAWLER_HOST = "0.0.0.0"
$env:CRAWLER_PORT = "8001"
```

Request vẫn có thể gửi `callback_url` và `callback_token` riêng cho từng job;
giá trị trong request sẽ được ưu tiên hơn cấu hình mặc định. Nếu gửi
`http://localhost/api/crawlers` không có port, service tự chuẩn hóa thành
`http://localhost:8000/api/crawlers`.

There are three separate crawl modes. Each request must use exactly one:

- `source_type: "usernames"` with `usernames`: crawl each username.
- `source_type: "urls"` with `urls`: crawl each profile URL.
- `source_type: "count"` with `total_accounts`: crawl that number of
  accounts from the TikTok feed.

`source_type` is optional for backward compatibility and is inferred from the
provided data, but sending it is recommended.
The service responds with `202` and runs the job in the background. For each
account it sends an `account` event to
`POST {callback_url}/crawl-jobs/{job_id}/events`. At the end it sends a
`completed` event containing the counters and final status.
	