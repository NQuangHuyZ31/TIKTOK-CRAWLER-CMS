import type { DocArticle } from '../types/docSchema';

export const FOLLOW_ARTICLES_VI: DocArticle[] = [
  {
    "id": "follow-quickstart",
    "slug": "quickstart",
    "pillar": "follow",
    "category": "Bắt đầu nhanh",
    "title": "Hướng dẫn Bắt đầu Nhanh 5 Phút",
    "subtitle": "Quy trình vận hành từng bước từ đầu đến cuối để thực thi tiến trình crawl đầu tiên và kiểm tra kết quả",
    "duration": "5 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "Bắt đầu nhanh"
      },
      {
        "label": "Bắt đầu Nhanh 5 Phút"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "Mục tiêu",
        "anchorId": "quickstart-objective"
      },
      {
        "type": "paragraph",
        "text": "Tài liệu này hướng dẫn bạn cách đăng nhập, thiết lập tài khoản mục tiêu, áp dụng bộ lọc ngày, khởi chạy tiến trình crawl và kiểm tra thông tin kênh TikTok cùng video vừa thu thập trong vòng 5 phút."
      },
      {
        "type": "procedure",
        "title": "Quy trình: Thực hiện Tiến trình Crawl Đầu tiên",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Đăng nhập vào Hệ thống CMS",
            "instruction": "Mở trình duyệt và truy cập /admin/auth/login. Nhập email và mật khẩu quản trị viên, sau đó nhấn 'Sign in'.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-login.png",
              "alt": "Màn hình Đăng nhập CMS",
              "caption": "Hình 1.1: Giao diện đăng nhập chuẩn với email, mật khẩu và tùy chọn ghi nhớ phiên",
              "location": "/admin/auth/login",
              "targetArea": "Form Đăng nhập",
              "captureInstruction": "Giao diện đăng nhập"
            },
            "fields": [
              {
                "name": "Email",
                "required": true,
                "description": "Email tài khoản đã đăng ký (ví dụ: admin@cms.com)"
              },
              {
                "name": "Mật khẩu",
                "required": true,
                "description": "Mật khẩu tài khoản (tối thiểu 6 ký tự)"
              },
              {
                "name": "Ghi nhớ phiên (Remember Me)",
                "required": false,
                "description": "Duy trì phiên đăng nhập sau khi đóng trình duyệt"
              }
            ],
            "expectedResult": "Đăng nhập thành công và tự động chuyển hướng đến /admin/dashboard."
          },
          {
            "stepNumber": 2,
            "title": "Điều hướng đến Danh sách Crawl Jobs",
            "instruction": "Tại menu thanh bên trái, chọn 'Crawl Jobs'. Sau đó nhấn nút màu xanh '+ Create Job' ở góc trên bên phải.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-table.png",
              "alt": "Danh mục Crawl Jobs",
              "caption": "Hình 1.2: Bảng danh sách Crawl Jobs với các thẻ trạng thái và nút tạo mới",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Bảng Crawl Jobs",
              "captureInstruction": "Bảng crawl jobs"
            },
            "actionUrl": "/admin/crawler/crawl-job/create",
            "actionLabel": "Mở Form Tạo Job",
            "expectedResult": "Màn hình tạo mới Crawl Job hiển thị với các tham số mặc định."
          },
          {
            "stepNumber": 3,
            "title": "Cấu hình Tài khoản Mục tiêu & Chế độ Crawl",
            "instruction": "Nhập danh sách handle TikTok vào ô Data Crawl. Chọn chế độ 'Account With Videos' để lấy cả profile lẫn video. Tại mục 'Date Filter', chọn 'Today' để chỉ lấy video đăng trong ngày hôm nay.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-create-filled.png",
              "alt": "Điền Thông tin Crawl Job",
              "caption": "Hình 1.3: Cấu hình danh sách creator (@vtv24news, @khaby.lame) và chế độ crawl kèm video",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Form Nhập liệu Crawl Job",
              "captureInstruction": "Form đã điền"
            },
            "fields": [
              {
                "name": "Loại nguồn (Source Type)",
                "required": true,
                "description": "Chọn 'Usernames' cho handle kênh hoặc 'URLs' cho đường dẫn profile"
              },
              {
                "name": "Dữ liệu Crawl (Data Crawl)",
                "required": true,
                "description": "Danh sách handle ngăn cách bằng dòng mới (@vtv24news, @khaby.lame, @tiktok)"
              },
              {
                "name": "Chế độ Crawl (Crawl Mode)",
                "required": true,
                "description": "Chọn 'Account With Videos' để lấy thông tin kênh kèm toàn bộ video"
              },
              {
                "name": "Bộ lọc Ngày (Date Filter)",
                "required": true,
                "description": "Chọn 'Today' để chỉ thu thập video đăng trong ngày hôm nay"
              }
            ],
            "expectedResult": "Form kiểm tra hợp lệ, hiển thị số lượng tài khoản đã phân tích sẵn sàng."
          },
          {
            "stepNumber": 4,
            "title": "Kiểm tra Múi giờ & Preset Ngày",
            "instruction": "Mở dropdown Date Filter kiểm tra preset đã chọn và xác nhận múi giờ vận hành là Asia/Ho_Chi_Minh (UTC+7).",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-date-filter.png",
              "alt": "Dropdown Chọn Bộ lọc Ngày và Múi giờ",
              "caption": "Hình 1.4: Bộ lọc ngày với preset Today và múi giờ Asia/Ho_Chi_Minh",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Component VideoDateFilterSelector",
              "captureInstruction": "Dropdown lọc ngày"
            },
            "expectedResult": "Khoảng thời gian hợp lệ được tính từ 00:00:00 đến 23:59:59 theo múi giờ chỉ định."
          },
          {
            "stepNumber": 5,
            "title": "Xác nhận và Bắt đầu Tiến trình Crawl",
            "instruction": "Nhấn nút 'Create & Start Crawl'. Hộp thoại popconfirm xuất hiện hỏi xác nhận, nhấn 'Yes' để điều phối job ngay tới Worker Engine.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-start-confirm.png",
              "alt": "Xác nhận Khởi chạy Job",
              "caption": "Hình 1.5: Hộp thoại xác nhận chạy ngay tiến trình crawl",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Popconfirm Xác nhận",
              "captureInstruction": "Popconfirm start job"
            },
            "expectedResult": "Trạng thái job chuyển sang màu xanh dương 'running' kèm thanh tiến độ hoạt động."
          },
          {
            "stepNumber": 6,
            "title": "Theo dõi Tiến độ Thực thi Chi tiết",
            "instruction": "Nhấn vào hàng của Job hoặc biểu tượng con mắt để xem màn hình chi tiết, thanh tiến độ, tỷ lệ thành công và số video đã bóc tách.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-detail-summary.png",
              "alt": "Chi tiết Tiến trình Crawl",
              "caption": "Hình 1.6: Màn hình chi tiết với thanh tiến độ, thống kê tài khoản và danh sách kết quả",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Trang Chi tiết Job",
              "captureInstruction": "Màn hình chi tiết"
            },
            "expectedResult": "Tiến độ đạt 100%, trạng thái đổi sang màu xanh lá 'completed'."
          },
          {
            "stepNumber": 7,
            "title": "Kiểm tra Dữ liệu Kênh & Video Đã Thu Thập",
            "instruction": "Truy cập 'TikTok Accounts' trên menu. Bấm vào tài khoản vừa crawl để mở drawer và chọn tab 'Videos' xem danh mục video.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-videos.png",
              "alt": "Showcase Video TikTok Đã Crawl",
              "caption": "Hình 1.7: Lưới video hiển thị thumbnail, lượt xem, thả tim và ngày đăng",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Tab Videos Chi tiết Tài khoản",
              "captureInstruction": "Lưới video"
            },
            "expectedResult": "Video hiển thị đầy đủ thông số tương tác và liên kết trực tiếp tới TikTok."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-auth-security-sop",
    "slug": "auth-security-sop",
    "pillar": "follow",
    "category": "Bắt đầu nhanh",
    "title": "SOP Xác thực, Đăng nhập Google & Bảo mật 2FA",
    "subtitle": "Quy trình vận hành tiêu chuẩn cho đăng nhập doanh nghiệp, Google OAuth, thiết lập 2FA, OTP và cấp lại mật khẩu",
    "duration": "7 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "Bắt đầu nhanh"
      },
      {
        "label": "Xác thực & Bảo mật SOP"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Đăng nhập Doanh nghiệp bằng Email & Mật khẩu",
        "anchorId": "auth-standard-login"
      },
      {
        "type": "paragraph",
        "text": "Mỗi nhân sự vận hành đăng nhập vào CMS bằng tài khoản email được cấp. Hệ thống cấp phát token JWT an toàn lưu trữ trên trình duyệt."
      },
      {
        "type": "procedure",
        "title": "Quy trình: Đăng nhập bằng Email & Mật khẩu",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Truy cập Giao diện Đăng nhập",
            "instruction": "Mở /admin/auth/login trên trình duyệt có bảo mật HTTPS.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-login.png",
              "alt": "Màn hình Đăng nhập CMS",
              "caption": "Hình 2.1: Giao diện đăng nhập với ô nhập email, mật khẩu và nút Google OAuth",
              "location": "/admin/auth/login",
              "targetArea": "Form Đăng nhập",
              "captureInstruction": "Giao diện đăng nhập"
            },
            "fields": [
              {
                "name": "Địa chỉ Email",
                "required": true,
                "description": "Email công ty (ví dụ: admin@cms.com). Tự động chuẩn hóa chữ thường."
              },
              {
                "name": "Mật khẩu",
                "required": true,
                "description": "Mật khẩu tài khoản (tối thiểu 6 ký tự)."
              },
              {
                "name": "Ghi nhớ phiên (Remember Me)",
                "required": false,
                "description": "Duy trì phiên đăng nhập sau khi đóng trình duyệt."
              }
            ],
            "expectedResult": "Nếu tài khoản chưa bật 2FA, chuyển hướng thẳng vào /admin/dashboard. Nếu đã bật 2FA, chuyển tiếp sang Bước 2."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "2. Đăng nhập Nhanh với Google OAuth2 (Single Sign-On)",
        "anchorId": "auth-google-oauth"
      },
      {
        "type": "paragraph",
        "text": "Người dùng có thể đăng nhập tức thì thông qua tài khoản Google Workspace thuộc domain nội bộ đã được cấp phép."
      },
      {
        "type": "procedure",
        "title": "Quy trình: Đăng nhập bằng Google",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Nhấn nút 'Continue with Google'",
            "instruction": "Trên giao diện đăng nhập, nhấn vào nút 'Continue with Google' màu trắng có logo Google.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-google-login.png",
              "alt": "Nút Đăng nhập Google",
              "caption": "Hình 2.2: Nút đăng nhập nhanh bằng Google OAuth2",
              "location": "/admin/auth/login",
              "targetArea": "Component GoogleLoginButton",
              "captureInstruction": "Nút Google"
            },
            "expectedResult": "Trình duyệt chuyển tiếp sang giao diện cấp quyền an toàn của Google."
          },
          {
            "stepNumber": 2,
            "title": "Xác nhận Tài khoản Google",
            "instruction": "Chọn tài khoản Google công ty. Google xác thực và gửi thông tin về endpoint callback của CMS.",
            "expectedResult": "Hệ thống đối chiếu hồ sơ, cấp quyền và chuyển hướng vào Dashboard."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "3. Hướng dẫn Bật Xác thực 2 Bước (2FA Setup)",
        "anchorId": "auth-enable-2fa"
      },
      {
        "type": "paragraph",
        "text": "Để bảo vệ các tài khoản quản trị, người dùng kích hoạt tính năng Xác thực 2 bước (TOTP) tương thích với ứng dụng Google Authenticator và Authy."
      },
      {
        "type": "procedure",
        "title": "Quy trình: Thiết lập Google Authenticator",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Quét Mã QR bằng Ứng dụng Authenticator",
            "instruction": "Khi màn hình thiết lập 2FA xuất hiện, mở ứng dụng Google Authenticator trên điện thoại, chọn dấu '+' và quét mã QR hiển thị trên màn hình. Nếu camera hỏng, sao chép chuỗi Secret Key thủ công.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-2fa-qrcode.png",
              "alt": "Màn hình Quét Mã QR 2FA",
              "caption": "Hình 2.3: Quét mã QR hoặc sao chép Secret Key vào ứng dụng Authenticator",
              "location": "/admin/auth/login?step=2fa",
              "targetArea": "Component TwoFactorVerifyStep",
              "captureInstruction": "Mã QR 2FA"
            },
            "fields": [
              {
                "name": "Secret Key",
                "required": true,
                "description": "Chuỗi ký tự Base32 để nhập thủ công vào ứng dụng."
              },
              {
                "name": "Mã xác thực 6 chữ số",
                "required": true,
                "description": "Mã OTP 6 số sinh ra từ ứng dụng Authenticator."
              }
            ],
            "expectedResult": "Ứng dụng điện thoại bắt đầu tạo mã số 6 chữ số thay đổi mỗi 30 giây."
          },
          {
            "stepNumber": 2,
            "title": "Nhập Mã 6 Số Xác nhận Kích hoạt",
            "instruction": "Nhập mã 6 chữ số đang hiển thị trên điện thoại và bấm 'Verify Code'.",
            "expectedResult": "Hệ thống ghi nhận google2fa_enabled = 1 và đăng nhập thành công."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "4. Xác thực 2FA khi Đăng nhập Định kỳ",
        "anchorId": "auth-verify-2fa"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Nhập Mã 2FA Đăng nhập",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Nhập Mã 6 Chữ số từ Điện thoại",
            "instruction": "Sau khi nhập email và mật khẩu, màn hình yêu cầu xác thực 2FA xuất hiện. Mở Google Authenticator lấy mã 6 chữ số nhập vào trước khi hết 30 giây.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-2fa-verify.png",
              "alt": "Màn hình Nhập Mã 2FA",
              "caption": "Hình 2.4: Nhập mã bảo mật 6 chữ số từ ứng dụng Authenticator",
              "location": "/admin/auth/login?step=2fa",
              "targetArea": "Hộp thoại Xác thực 2FA",
              "captureInstruction": "Nhập mã 2FA"
            },
            "expectedResult": "Hệ thống cấp token truy cập và tải Dashboard."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "5. Khôi phục Mật khẩu",
        "anchorId": "auth-email-otp-reset"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Quên Mật khẩu",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Yêu cầu Đặt lại Mật khẩu",
            "instruction": "Nhấn 'Forgot password?' trên trang login. Điền email và nhấn 'Send Reset Instructions'.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-forgot-password.png",
              "alt": "Form Quên Mật Khẩu",
              "caption": "Hình 2.5: Form yêu cầu gửi link đặt lại mật khẩu qua email",
              "location": "/admin/auth/login?reset-password=1",
              "targetArea": "Form ResetPasswordForm",
              "captureInstruction": "Quên mật khẩu"
            },
            "expectedResult": "Hệ thống gửi email chứa token khôi phục có hiệu lực 60 phút."
          },
          {
            "stepNumber": 2,
            "title": "Nhận link đặt lại mật khẩu từ email",
            "instruction": "Kiểm tra email và click vào link nhận được.",
            "screenshot": {
              "src": "/images/guideline/auth/figure-auth-email-otp.png",
              "alt": "Form Nhập OTP Email",
              "caption": "Hình 2.6: Nhập mật khẩu mới và xác nhận mật khẩu",
              "location": "/admin/auth/login?rest-password=1",
              "targetArea": "Form EmailOtpVerifyStep",
              "captureInstruction": "Reset password"
            },
            "expectedResult": "Mã xác thực được chấp thuận và cấp quyền truy cập."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "6. Quản trị viên Reset Mật khẩu & Reset 2FA",
        "anchorId": "auth-admin-resets"
      },
      {
        "type": "paragraph",
        "text": "Khi nhân sự làm mất điện thoại hoặc quên thông tin đăng nhập, Quản trị viên có thể hỗ trợ reset an toàn trực tiếp từ bảng Quản lý Người dùng."
      },
      {
        "type": "procedure",
        "title": "Quy trình: Thao tác Reset từ Quản trị viên",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Reset 2FA Authentication cho Nhân viên",
            "instruction": "Tại bảng Users (/admin/user), tìm dòng nhân sự và bấm biểu tượng Mở khóa ('Reset authentication'). Xác nhận popconfirm.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-authen.png",
              "alt": "Popconfirm Reset 2FA",
              "caption": "Hình 2.7: Xác nhận xóa secret 2FA để nhân viên quét lại mã QR mới",
              "location": "/admin/user",
              "targetArea": "Cột Thao tác Bảng User",
              "captureInstruction": "Reset 2FA popconfirm"
            },
            "expectedResult": "Hệ thống xóa google2fa_secret; người dùng sẽ được yêu cầu quét mã QR mới ở lần đăng nhập kế tiếp."
          },
          {
            "stepNumber": 2,
            "title": "Reset Mật khẩu cho Người dùng",
            "instruction": "Nhấn biểu tượng Chìa khóa ('Reset password') trên dòng nhân sự và bấm xác nhận.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-password.png",
              "alt": "Popconfirm Reset Mật khẩu",
              "caption": "Hình 2.8: Kích hoạt gửi email đặt lại mật khẩu trực tiếp từ bảng quản trị",
              "location": "/admin/user",
              "targetArea": "Cột Thao tác Bảng User",
              "captureInstruction": "Reset password popconfirm"
            },
            "expectedResult": "Thông báo xác nhận email reset mật khẩu đã được gửi thành công."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-dashboard-sop",
    "slug": "dashboard-sop",
    "pillar": "follow",
    "category": "SOP Vận hành Tác vụ",
    "title": "SOP Giám sát Dashboard & Tình trạng Hệ thống",
    "subtitle": "Quy trình vận hành tiêu chuẩn để theo dõi chỉ số hiệu năng, tình trạng worker và cảnh báo",
    "duration": "6 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "SOP Vận hành Tác vụ"
      },
      {
        "label": "SOP Giám sát Dashboard"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Theo dõi Chỉ số Hiệu năng (KPIs)",
        "anchorId": "dashboard-kpis"
      },
      {
        "type": "paragraph",
        "text": "Màn hình Dashboard đóng vai trò trung tâm điều phối và giám sát toàn bộ hoạt động của hệ thống: số kênh TikTok quản lý, video bóc tách, jobs đang chạy và dung lượng kho candidate."
      },
      {
        "type": "procedure",
        "title": "Quy trình: Kiểm tra Tình trạng Định kỳ",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Kiểm tra Thẻ Chỉ số KPI Đầu trang",
            "instruction": "Kiểm tra 4 thẻ chỉ số: Tổng số Tài khoản TikTok, Tổng số Video Thu thập, Crawl Jobs Đang chạy, và Kho Candidate Khám phá Mới.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-kpis.png",
              "alt": "Thẻ Chỉ số KPI Dashboard",
              "caption": "Hình 3.1: Các thẻ chỉ số cốt lõi hiển thị số lượng kênh, video và ứng viên mới",
              "location": "/admin/dashboard",
              "targetArea": "Lưới Thẻ KPI",
              "captureInstruction": "Thẻ KPI"
            },
            "expectedResult": "Kho Candidate Mới luôn duy trì mức đệm mục tiêu (~5000 accounts)."
          },
          {
            "stepNumber": 2,
            "title": "Giám sát Kết nối Python Worker Engine",
            "instruction": "Kiểm tra thẻ tình trạng Crawler Engine để đảm bảo trạng thái hiển thị màu xanh ('Online') và các tiến trình con hoạt động bình thường.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-engine-health.png",
              "alt": "Thẻ Trạng thái Worker Engine",
              "caption": "Hình 3.2: Thẻ hiển thị kết nối Crawler Engine và độ sâu hàng đợi",
              "location": "/admin/dashboard",
              "targetArea": "Thẻ Tình trạng Engine",
              "captureInstruction": "Tình trạng engine"
            },
            "expectedResult": "Kết nối thông suốt, không có lỗi timeout giao tiếp giữa Laravel và Python."
          },
          {
            "stepNumber": 3,
            "title": "Kiểm tra Hoạt động & Jobs Gần đây",
            "instruction": "Xem xét bảng Hoạt động gần đây và Danh sách Jobs mới nhất cuối trang để kiểm tra các tác vụ vừa hoàn tất.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-recent-activities.png",
              "alt": "Bảng Hoạt động Gần đây",
              "caption": "Hình 3.3: Nhật ký tiến trình crawl gần đây và các sự kiện bảo mật",
              "location": "/admin/dashboard",
              "targetArea": "Bảng Hoạt động",
              "captureInstruction": "Bảng hoạt động"
            },
            "expectedResult": "Các tiến trình hoàn thành có tỷ lệ bóc tách video hợp lệ."
          },
          {
            "stepNumber": 4,
            "title": "Toàn cảnh Giao diện Dashboard",
            "instruction": "Quan sát tổng quan toàn bộ giao diện dashboard.",
            "screenshot": {
              "src": "/images/guideline/dashboard/figure-dashboard-overview.png",
              "alt": "Tổng quan Dashboard",
              "caption": "Hình 3.4: Màn hình tổng quan với biểu đồ, số liệu thống kê và tiện ích theo dõi",
              "location": "/admin/dashboard",
              "targetArea": "Màn hình Dashboard",
              "captureInstruction": "Tổng quan dashboard"
            },
            "expectedResult": "Các thành phần hiển thị sắc nét, đầy đủ dữ liệu."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-crawler-operations-sop",
    "slug": "crawler-operations-sop",
    "pillar": "follow",
    "category": "SOP Vận hành Tác vụ",
    "title": "SOP Vận hành Tiến trình Crawl Dữ liệu",
    "subtitle": "Quy trình vận hành tiêu chuẩn để tạo, cấu hình, thực thi và giám sát tiến trình crawl dữ liệu tự động",
    "duration": "10 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "SOP Vận hành Tác vụ"
      },
      {
        "label": "SOP Vận hành Crawler"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Quản lý Danh mục & Vòng đời Crawl Jobs",
        "anchorId": "crawler-job-table"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Vận hành Tiến trình Crawl",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Bảng Danh mục Crawl Jobs",
            "instruction": "Truy cập /admin/crawler/crawl-job. Sử dụng ô tìm kiếm hoặc bộ lọc trạng thái (Pending, Running, Completed, Paused, Failed).",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-table.png",
              "alt": "Bảng Danh mục Crawl Jobs",
              "caption": "Hình 4.1: Bảng quản lý tiến trình crawl kèm các bộ lọc trạng thái và nút thao tác",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Bảng Crawl Jobs",
              "captureInstruction": "Bảng danh mục"
            },
            "expectedResult": "Danh sách hiển thị đầy đủ tiến trình, phần trăm hoàn thành và số lượng kênh."
          },
          {
            "stepNumber": 2,
            "title": "Mở Form Tạo Mới Tiến trình",
            "instruction": "Bấm nút '+ Create Job' tại góc trên bên phải.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-create-empty.png",
              "alt": "Form Tạo Crawl Job Khởi tạo",
              "caption": "Hình 4.2: Form tạo mới tiến trình crawl dữ liệu",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Form Tạo Job",
              "captureInstruction": "Form tạo mới"
            },
            "expectedResult": "Form khởi tạo với các thiết lập nguồn mặc định."
          },
          {
            "stepNumber": 3,
            "title": "Chọn Loại Nguồn Dữ liệu (Source Types)",
            "instruction": "Chọn tab nguồn phù hợp: 'Usernames' cho danh sách handle, 'URLs' cho đường dẫn trực tiếp, hoặc 'Account Count' để lấy mẫu từ kho candidate.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-source-types.png",
              "alt": "Tabs Chọn Nguồn Dữ liệu",
              "caption": "Hình 4.3: Các tab lựa chọn nguồn: Usernames, URLs và Lấy từ kho Candidate",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Tabs Loại Nguồn",
              "captureInstruction": "Tabs nguồn"
            },
            "expectedResult": "Giao diện chuyển đổi linh hoạt theo tab được chọn."
          },
          {
            "stepNumber": 4,
            "title": "Cấu hình Danh sách Kênh & Chế độ Crawl",
            "instruction": "Điền danh sách handle vào ô Data Crawl. Chọn 'Account With Videos' để lấy cả profile lẫn video, hoặc 'Account Only' nếu chỉ cần thống kê cơ bản.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-create-filled.png",
              "alt": "Form Đã Điền Tham số",
              "caption": "Hình 4.4: Điền tài khoản (@vtv24news, @khaby.lame) và chọn chế độ Account With Videos",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Ô Nhập Liệu Data Crawl",
              "captureInstruction": "Form đã điền"
            },
            "fields": [
              {
                "name": "Data Crawl",
                "required": true,
                "description": "Danh sách handle ngăn cách bằng dòng mới hoặc dấu phẩy. Ký tự '@' được tự động làm sạch."
              },
              {
                "name": "Chế độ Crawl",
                "required": true,
                "description": "Account With Videos (lấy kênh + video mới nhất) hoặc Account Only (chỉ thông tin kênh)."
              },
              {
                "name": "Độ ưu tiên",
                "required": false,
                "description": "Mức độ ưu tiên điều phối hàng đợi (High, Normal, Low)."
              }
            ],
            "expectedResult": "Hệ thống xác thực và đếm số lượng tài khoản hợp lệ."
          },
          {
            "stepNumber": 5,
            "title": "Cấu hình Bộ lọc Ngày Video & Múi giờ",
            "instruction": "Mở bộ chọn Date Filter. Chọn preset như 'Today', 'Past 7 Days' hoặc 'Custom Range'. Xác nhận múi giờ là Asia/Ho_Chi_Minh.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-date-filter.png",
              "alt": "Bộ lọc Ngày và Múi giờ",
              "caption": "Hình 4.5: Chọn khoảng ngày và múi giờ để giới hạn thu thập video",
              "location": "/admin/crawler/crawl-job/create",
              "targetArea": "Component VideoDateFilterSelector",
              "captureInstruction": "Lọc ngày và múi giờ"
            },
            "expectedResult": "Crawler sẽ dừng phân trang ngay khi gặp video đăng trước mốc thời gian đã chọn."
          },
          {
            "stepNumber": 6,
            "title": "Khởi chạy & Xác nhận Điều phối Job",
            "instruction": "Nhấn nút 'Create & Start Crawl'. Xác nhận popconfirm để bắt đầu chạy ngay.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-start-confirm.png",
              "alt": "Xác nhận Khởi chạy Job",
              "caption": "Hình 4.6: Popconfirm xác nhận đưa job vào hàng đợi thực thi ngay",
              "location": "/admin/crawler/crawl-job",
              "targetArea": "Popconfirm Start Job",
              "captureInstruction": "Xác nhận start job"
            },
            "expectedResult": "Tiến trình chuyển sang trạng thái running."
          },
          {
            "stepNumber": 7,
            "title": "Theo dõi Tiến độ Thực thi & Kết quả",
            "instruction": "Bấm vào Job ID để xem màn hình chi tiết, thanh tiến độ, số video bóc tách và trạng thái từng tài khoản.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-detail-summary.png",
              "alt": "Tổng quan Chi tiết Crawl Job",
              "caption": "Hình 4.7: Thanh tiến độ thực thi, số liệu tổng hợp và bảng trạng thái tài khoản",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Trang Chi tiết Job",
              "captureInstruction": "Chi tiết job"
            },
            "expectedResult": "Bảng tài khoản mục tiêu hiển thị số video thu thập và thời gian bóc tách."
          },
          {
            "stepNumber": 8,
            "title": "Thử lại Tài khoản Bị Lỗi (Retry Target)",
            "instruction": "Nếu có tài khoản bị lỗi timeout mạng, bấm nút 'Retry' trên dòng tài khoản đó để chạy lại riêng lẻ.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-retry.png",
              "alt": "Thử lại Tài khoản Lỗi",
              "caption": "Hình 4.8: Nút chạy lại riêng lẻ cho từng tài khoản gặp lỗi mạng tạm thời",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Cột Thao tác Bảng Tài khoản Mục tiêu",
              "captureInstruction": "Nút retry"
            },
            "expectedResult": "Worker chạy lại riêng tài khoản đó mà không cần thực thi lại toàn bộ job."
          },
          {
            "stepNumber": 9,
            "title": "Tạm dừng hoặc Hủy Tiến trình Đang chạy",
            "instruction": "Bấm nút 'Pause' hoặc 'Cancel' trên thanh tiêu đề và xác nhận popconfirm khi cần dừng tiến trình.",
            "screenshot": {
              "src": "/images/guideline/crawler/figure-crawl-job-stop-confirm.png",
              "alt": "Xác nhận Dừng Job",
              "caption": "Hình 4.9: Dừng tiến trình và giải phóng tài nguyên an toàn",
              "location": "/admin/crawler/crawl-job/1",
              "targetArea": "Thanh Tiêu đề Chi tiết Job",
              "captureInstruction": "Xác nhận dừng job"
            },
            "expectedResult": "Các worker hoàn tất lô đang xử lý và giải phóng khóa tài khoản an toàn."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-tiktok-account-sop",
    "slug": "tiktok-account-sop",
    "pillar": "follow",
    "category": "SOP Vận hành Tác vụ",
    "title": "SOP Khai thác Dữ liệu Tài khoản TikTok & Video",
    "subtitle": "Quy trình vận hành tiêu chuẩn để duyệt profile creator, chỉ số tương tác video, nhập thủ công và xuất file CSV",
    "duration": "8 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "SOP Vận hành Tác vụ"
      },
      {
        "label": "SOP Quản lý Kênh TikTok"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Khai thác Danh mục Kênh TikTok",
        "anchorId": "account-directory"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Duyệt Profile & Video Creator",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Bảng Danh mục Tài khoản TikTok",
            "instruction": "Truy cập /admin/tiktok-account. Tìm kiếm theo username, nickname và lọc theo trạng thái tích xanh verified.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-list.png",
              "alt": "Bảng Danh mục Tài khoản TikTok",
              "caption": "Hình 5.1: Danh mục kênh TikTok với avatar, số follower, lượt thích và ngày crawl",
              "location": "/admin/tiktok-account",
              "targetArea": "Bảng TikTok Accounts",
              "captureInstruction": "Bảng danh mục tài khoản"
            },
            "expectedResult": "Danh sách hiển thị avatar, số người theo dõi và thời gian crawl mới nhất."
          },
          {
            "stepNumber": 2,
            "title": "Mở Drawer Chi tiết Kênh",
            "instruction": "Nhấn biểu tượng con mắt hoặc click vào dòng tài khoản để mở drawer chi tiết.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-overview.png",
              "alt": "Tổng quan Profile Tài khoản",
              "caption": "Hình 5.2: Drawer thông tin profile với số follower, bio, quốc gia và ngôn ngữ",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Drawer Chi tiết Tài khoản",
              "captureInstruction": "Drawer chi tiết"
            },
            "expectedResult": "Hiển thị 4 thẻ chỉ số: Followers, Following, Likes, Videos cùng tiểu sử bio."
          },
          {
            "stepNumber": 3,
            "title": "Xem Lưới Video Showcase",
            "instruction": "Bấm vào tab 'Videos' trong drawer để xem danh mục toàn bộ video đã bóc tách.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-videos.png",
              "alt": "Lưới Showcase Video",
              "caption": "Hình 5.3: Thẻ video kèm thumbnail, lượt xem, thả tim, bình luận và ngày đăng",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Tab Videos Chi tiết Tài khoản",
              "captureInstruction": "Lưới video"
            },
            "expectedResult": "Mỗi thẻ video hiển thị ảnh đại diện, lượt xem, thả tim, bình luận và link tới TikTok."
          },
          {
            "stepNumber": 4,
            "title": "Xem Lịch sử Các Lần Crawl (Crawl History)",
            "instruction": "Bấm vào tab 'History' để xem các đợt crawl từng thực thi đối với kênh này.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-detail-history.png",
              "alt": "Lịch sử Crawl Kênh",
              "caption": "Hình 5.4: Nhật ký các đợt crawl kèm Job ID, thời gian và số video thu thập",
              "location": "/admin/tiktok-account/1",
              "targetArea": "Tab History",
              "captureInstruction": "Tab lịch sử crawl"
            },
            "expectedResult": "Bảng liệt kê thời gian crawl và số video lấy về qua từng đợt."
          },
          {
            "stepNumber": 5,
            "title": "Tạo Hồ sơ Kênh Thủ công",
            "instruction": "Bấm '+ Add Account' để đăng ký kênh mới trước khi tiến hành crawl.",
            "screenshot": {
              "src": "/images/guideline/tiktok-account/figure-account-form.png",
              "alt": "Form Đăng ký Tài khoản Mới",
              "caption": "Hình 5.6: Form đăng ký thông tin kênh với username, nickname và khu vực",
              "location": "/admin/tiktok-account/create",
              "targetArea": "Form TiktokAccountFormPage",
              "captureInstruction": "Form tài khoản"
            },
            "fields": [
              {
                "name": "Username",
                "required": true,
                "description": "Handle TikTok viết liền không dấu (ví dụ: vtv24news)"
              },
              {
                "name": "Nickname",
                "required": false,
                "description": "Tên hiển thị của creator (ví dụ: VTV24 Tin Tức)"
              },
              {
                "name": "Quốc gia (Region)",
                "required": false,
                "description": "Mã quốc gia ISO 2 chữ cái (VN, US)"
              },
              {
                "name": "Ngôn ngữ (Language)",
                "required": false,
                "description": "Mã ngôn ngữ chính (vi, en)"
              }
            ],
            "expectedResult": "Kênh mới được lưu vào danh mục quản lý."
          },
        ]
      }
    ]
  },
  {
    "id": "follow-user-management-sop",
    "slug": "user-management-sop",
    "pillar": "follow",
    "category": "SOP Vận hành Tác vụ",
    "title": "SOP Quản lý Người dùng & Phân quyền Nhân sự",
    "subtitle": "Quy trình vận hành tiêu chuẩn để cấp tài khoản, gán vai trò, cấp lại mật khẩu và khóa tài khoản",
    "duration": "8 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "SOP Vận hành Tác vụ"
      },
      {
        "label": "SOP Quản lý Người dùng"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Quản lý Danh mục & Nhân sự Vận hành",
        "anchorId": "user-directory"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Quản lý Nhân sự & Cấp phát Quyền",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Duyệt Bảng Người dùng & Chỉ số KPI",
            "instruction": "Truy cập /admin/user. Quan sát các thẻ thống kê nhân sự và danh sách tài khoản.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-table.png",
              "alt": "Bảng Danh mục Người dùng",
              "caption": "Hình 6.1: Bảng người dùng với thẻ thống kê, avatar, email, vai trò và công tắc trạng thái",
              "location": "/admin/user",
              "targetArea": "Bảng Users",
              "captureInstruction": "Bảng người dùng"
            },
            "expectedResult": "Hiển thị toàn bộ nhân sự, vai trò gán và công tắc trạng thái kích hoạt."
          },
          {
            "stepNumber": 2,
            "title": "Cấp Tài khoản Mới cho Nhân viên",
            "instruction": "Bấm '+ Add User' để mở form tạo người dùng tại /admin/user/create. Điền thông tin cá nhân và gán vai trò.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-create.png",
              "alt": "Form Tạo Người Dùng Mới",
              "caption": "Hình 6.2: Form tạo nhân sự với phần Profile, Bảo mật và Phân vai trò",
              "location": "/admin/user/create",
              "targetArea": "Trang UserFormPage",
              "captureInstruction": "Form tạo người dùng"
            },
            "fields": [
              {
                "name": "Họ và Tên",
                "required": true,
                "description": "Tên đầy đủ của nhân viên"
              },
              {
                "name": "Địa chỉ Email",
                "required": true,
                "description": "Email công ty dùng đăng nhập và nhận thông báo"
              },
              {
                "name": "Số điện thoại",
                "required": false,
                "description": "Số điện thoại liên hệ"
              },
              {
                "name": "Mật khẩu",
                "required": true,
                "description": "Mật khẩu tạm thời cho lần đăng nhập đầu (tối thiểu 6 ký tự)"
              },
              {
                "name": "Vai trò (Roles)",
                "required": true,
                "description": "Vai trò RBAC (Administrator, Operations Manager, Crawler Specialist, Guest Auditor)"
              },
              {
                "name": "Trạng thái",
                "required": true,
                "description": "Công tắc Bật (Active) hoặc Tắt (Inactive)"
              }
            ],
            "expectedResult": "Tài khoản được tạo, quyền hạn đồng bộ ngay vào hệ thống."
          },
          {
            "stepNumber": 3,
            "title": "Chỉnh sửa Thông tin & Vai trò",
            "instruction": "Bấm biểu tượng Edit để mở /admin/user/:id/edit. Cập nhật thông tin hoặc thay đổi vai trò được gán.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-edit.png",
              "alt": "Form Chỉnh sửa Người dùng",
              "caption": "Hình 6.3: Cập nhật thông tin liên hệ, vai trò và trạng thái nhân sự",
              "location": "/admin/user/2/edit",
              "targetArea": "Form Sửa User",
              "captureInstruction": "Form sửa user"
            },
            "expectedResult": "Dữ liệu cập nhật có hiệu lực ngay lập tức."
          },
          {
            "stepNumber": 4,
            "title": "Xem Hồ sơ Chi tiết & Đặc quyền User",
            "instruction": "Bấm biểu tượng con mắt để xem màn hình chi tiết người dùng và danh sách các quyền hạn được hưởng.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-detail.png",
              "alt": "Chi tiết Hồ sơ Người dùng",
              "caption": "Hình 6.4: Màn hình chi tiết hiển thị quyền hạn, vai trò và thông tin cá nhân",
              "location": "/admin/user/1",
              "targetArea": "Trang UserDetailPage",
              "captureInstruction": "Chi tiết user"
            },
            "expectedResult": "Hiển thị tổng hợp quyền hạn của tài khoản."
          },
          {
            "stepNumber": 5,
            "title": "Bật / Tắt Trạng thái Tài khoản",
            "instruction": "Nhấn vào công tắc tại cột 'Status' để tạm ngưng hoặc mở khóa tài khoản ngay lập tức.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-status-toggle.png",
              "alt": "Công tắc Chuyển Trạng thái",
              "caption": "Hình 6.5: Chuyển đổi trạng thái tài khoản giữa Active và Inactive",
              "location": "/admin/user",
              "targetArea": "Cột Status Bảng User",
              "captureInstruction": "Công tắc trạng thái"
            },
            "expectedResult": "Trạng thái đổi màu; tài khoản Inactive bị chặn đăng nhập ngay."
          },
          {
            "stepNumber": 6,
            "title": "Quản trị viên Cấp lại Mật khẩu (Reset Password)",
            "instruction": "Nhấn biểu tượng Chìa khóa ('Reset password') và xác nhận popconfirm để kích hoạt gửi email đặt lại mật khẩu.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-password.png",
              "alt": "Xác nhận Reset Mật khẩu",
              "caption": "Hình 6.6: Popconfirm xác nhận cấp lại mật khẩu cho nhân sự",
              "location": "/admin/user",
              "targetArea": "Cột Thao tác Bảng User",
              "captureInstruction": "Reset password popconfirm"
            },
            "expectedResult": "Hệ thống gửi email đặt lại mật khẩu thành công."
          },
          {
            "stepNumber": 7,
            "title": "Quản trị viên Đặt lại 2FA (Reset 2FA Authentication)",
            "instruction": "Nếu nhân viên làm mất ứng dụng Authenticator, bấm biểu tượng Mở khóa ('Reset authentication') và xác nhận.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-reset-authen.png",
              "alt": "Xác nhận Reset 2FA",
              "caption": "Hình 6.7: Xác nhận xóa khóa 2FA để nhân sự có thể quét mã QR mới",
              "location": "/admin/user",
              "targetArea": "Cột Thao tác Bảng User",
              "captureInstruction": "Reset 2FA popconfirm"
            },
            "expectedResult": "Secret 2FA bị xóa; nhân sự sẽ quét mã QR mới ở lần đăng nhập tiếp theo."
          },
          {
            "stepNumber": 8,
            "title": "Xóa Tài khoản Người dùng",
            "instruction": "Nhấn biểu tượng Thùng rác và xác nhận nút 'Delete' màu đỏ.",
            "screenshot": {
              "src": "/images/guideline/user/figure-user-delete.png",
              "alt": "Xác nhận Xóa Người dùng",
              "caption": "Hình 6.8: Popconfirm xác nhận xóa vĩnh viễn tài khoản nhân sự",
              "location": "/admin/user",
              "targetArea": "Cột Thao tác Bảng User",
              "captureInstruction": "Xóa user popconfirm"
            },
            "expectedResult": "Tài khoản bị xóa hoàn toàn khỏi hệ thống."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-roles-permissions-sop",
    "slug": "roles-permissions-sop",
    "pillar": "follow",
    "category": "SOP Vận hành Tác vụ",
    "title": "SOP Thiết lập Vai trò, Quyền & Quản lý Module",
    "subtitle": "Quy trình vận hành tiêu chuẩn để cấu hình vai trò RBAC, Ma trận Phân quyền, khai báo Module và quyền hạn",
    "duration": "9 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "SOP Vận hành Tác vụ"
      },
      {
        "label": "SOP Vai trò & Phân quyền"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Quản lý Vai trò (Roles) & Ma trận Phân quyền",
        "anchorId": "role-rbac-management"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Cấu hình Vai trò & Ma trận Quyền",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Bảng Danh mục Vai trò",
            "instruction": "Truy cập /admin/user/role. Xem danh sách các vai trò đã cấu hình, slug định danh và số lượng nhân sự trực thuộc.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-table.png",
              "alt": "Bảng Danh mục Vai trò",
              "caption": "Hình 7.1: Bảng vai trò hệ thống hiển thị slug, số lượng nhân sự và nút thao tác",
              "location": "/admin/user/role",
              "targetArea": "Bảng Roles",
              "captureInstruction": "Bảng vai trò"
            },
            "expectedResult": "Liệt kê các vai trò Admin, Manager, Editor, Viewer."
          },
          {
            "stepNumber": 2,
            "title": "Tạo Mới một Vai trò",
            "instruction": "Bấm 'Create Role' mở RoleFormModal. Nhập Tên Vai trò (slug tự động sinh) và Mô tả nhiệm vụ.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-create.png",
              "alt": "Modal Tạo Vai trò Mới",
              "caption": "Hình 7.2: Điền tên vai trò, tự động tạo slug và mô tả phạm vi",
              "location": "/admin/user/role",
              "targetArea": "Modal RoleFormModal",
              "captureInstruction": "Modal tạo role"
            },
            "fields": [
              {
                "name": "Tên Vai trò",
                "required": true,
                "description": "Tên hiển thị (ví dụ: Data Analyst Specialist)"
              },
              {
                "name": "Slug",
                "required": true,
                "description": "Định danh mã nguồn (ví dụ: data-analyst-specialist). Tự động tạo từ tên."
              },
              {
                "name": "Mô tả",
                "required": false,
                "description": "Phạm vi nhiệm vụ của vai trò này"
              }
            ],
            "expectedResult": "Slug được chuẩn hóa chữ thường gạch nối tự động."
          },
          {
            "stepNumber": 3,
            "title": "Cấu hình Ma trận Phân quyền (Permission Matrix)",
            "instruction": "Tại bảng ma trận quyền trong modal, tích chọn các quyền tương ứng theo từng module. Sử dụng checkbox 'Select All' trên thanh tiêu đề module để cấp toàn bộ quyền của module đó.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-permission-matrix.png",
              "alt": "Ma trận Phân quyền Chi tiết",
              "caption": "Hình 7.3: Ma trận phân quyền theo từng module với checkbox chọn tất cả",
              "location": "/admin/user/role",
              "targetArea": "Ma trận PermissionMatrix",
              "captureInstruction": "Ma trận quyền"
            },
            "fields": [
              {
                "name": "Checkboxes Quyền Module",
                "required": false,
                "description": "Tích chọn quyền cụ thể (view, create, edit, delete, export, start_crawl) cho từng module."
              },
              {
                "name": "Select All Module",
                "required": false,
                "description": "Bật/Tắt toàn bộ quyền của module chỉ với một cú click."
              }
            ],
            "expectedResult": "Danh sách ID quyền được lưu đồng bộ với vai trò."
          },
          {
            "stepNumber": 4,
            "title": "Chỉnh sửa Vai trò Hiện có",
            "instruction": "Bấm 'Edit' trên bất kỳ vai trò nào để cập nhật lại ma trận quyền.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-edit.png",
              "alt": "Modal Sửa Vai trò",
              "caption": "Hình 7.4: Chỉnh sửa các quyền hạn được cấp cho vai trò",
              "location": "/admin/user/role",
              "targetArea": "Modal Chỉnh sửa Role",
              "captureInstruction": "Modal sửa role"
            },
            "expectedResult": "Quyền hạn mới có hiệu lực ngay lập tức với người dùng thuộc vai trò đó."
          },
          {
            "stepNumber": 5,
            "title": "Xóa một Vai trò",
            "instruction": "Bấm 'Delete' và xác nhận popconfirm. Lưu ý: Vai trò Super Admin ('admin') là bất biến và không thể xóa.",
            "screenshot": {
              "src": "/images/guideline/role/figure-role-delete.png",
              "alt": "Xác nhận Xóa Vai trò",
              "caption": "Hình 7.5: Popconfirm xác nhận xóa vai trò khỏi hệ thống",
              "location": "/admin/user/role",
              "targetArea": "Cột Thao tác Bảng Role",
              "captureInstruction": "Xóa role popconfirm"
            },
            "expectedResult": "Vai trò bị xóa; người dùng trực thuộc sẽ không còn kế thừa các quyền này."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "2. Khai báo Module & Quyền Chi tiết (Permissions)",
        "anchorId": "permission-module-management"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Khai báo Module và Quyền Mới",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Bảng Danh mục Quyền Hệ thống",
            "instruction": "Truy cập /admin/user/permission. Sử dụng bộ lọc 'Filter by Module' và 'Filter by Action' để tra cứu.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-permission-table.png",
              "alt": "Bảng Danh mục Quyền",
              "caption": "Hình 7.6: Bảng quyền hệ thống với bộ lọc theo Module và theo Hành động",
              "location": "/admin/user/permission",
              "targetArea": "Bảng Permissions",
              "captureInstruction": "Bảng quyền"
            },
            "expectedResult": "Hiển thị danh sách quyền kèm mã slug, module và mô tả."
          },
          {
            "stepNumber": 2,
            "title": "Tạo Mới một Module Hệ thống",
            "instruction": "Bấm 'Create Module' tại thanh tiêu đề. Nhập Mã Module (snake_case) và Tên Hiển thị. Hệ thống tự động chọn sẵn 4 quyền CRUD cơ bản.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-module-create-modal.png",
              "alt": "Modal Tạo Module Mới",
              "caption": "Hình 7.7: Modal tạo module mới với tính năng tự động tạo bộ quyền CRUD và xem trước",
              "location": "/admin/user/permission",
              "targetArea": "Modal CreateModuleModal",
              "captureInstruction": "Modal tạo module"
            },
            "fields": [
              {
                "name": "Mã Module (Module Key)",
                "required": true,
                "description": "Chuỗi chữ thường snake_case (ví dụ: content_moderation). Ký tự đặc biệt được tự động lọc bỏ."
              },
              {
                "name": "Tên Hiển thị (Display Name)",
                "required": false,
                "description": "Tên thân thiện (ví dụ: Content Moderation Engine)"
              },
              {
                "name": "Danh sách Quyền Tạo Sẵn",
                "required": true,
                "description": "Các quyền cơ bản được sinh ra (View, Create, Edit, Delete)"
              }
            ],
            "expectedResult": "Hệ thống tự động sinh 4 quyền mới (module.view, module.create, module.edit, module.delete) và ghi nhận module mới."
          },
          {
            "stepNumber": 3,
            "title": "Tạo Mới một Quyền Riêng lẻ",
            "instruction": "Bấm 'Create Permission' tại thanh tiêu đề. Chọn module, điền tên hành động và quan sát khung xem trước slug tự động.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-permission-create-modal.png",
              "alt": "Modal Tạo Quyền Riêng Lẻ",
              "caption": "Hình 7.8: Tạo quyền chi tiết với khung xem trước slug (ví dụ: crawler.export_csv)",
              "location": "/admin/user/permission",
              "targetArea": "Modal CreatePermissionModal",
              "captureInstruction": "Modal tạo quyền"
            },
            "fields": [
              {
                "name": "Module",
                "required": true,
                "description": "Tên module chọn từ gợi ý autocomplete hoặc nhập mới"
              },
              {
                "name": "Hành động (Action)",
                "required": true,
                "description": "Động từ hành động (ví dụ: export_csv, start_crawl, purge_queue)"
              },
              {
                "name": "Xem trước Slug (Slug Preview)",
                "required": false,
                "description": "Định dạng tự động theo cú pháp {module}.{action}"
              },
              {
                "name": "Mô tả",
                "required": false,
                "description": "Giải thích năng lực quyền này mở khóa"
              }
            ],
            "expectedResult": "Quyền mới được lưu và xuất hiện ngay trong Ma trận Phân quyền của Role."
          },
          {
            "stepNumber": 4,
            "title": "Xóa một Quyền khỏi Hệ thống",
            "instruction": "Nhấn 'Delete' trên dòng quyền cần xóa và bấm xác nhận popconfirm.",
            "screenshot": {
              "src": "/images/guideline/permission/figure-permission-delete.png",
              "alt": "Xác nhận Xóa Quyền",
              "caption": "Hình 7.9: Popconfirm xác nhận xóa quyền khỏi hệ thống",
              "location": "/admin/user/permission",
              "targetArea": "Cột Thao tác Bảng Permission",
              "captureInstruction": "Xóa permission popconfirm"
            },
            "expectedResult": "Quyền bị gỡ bỏ khỏi toàn bộ các vai trò và không còn hiệu lực."
          }
        ]
      }
    ]
  },
  {
    "id": "follow-system-diagnostics-sop",
    "slug": "system-diagnostics-sop",
    "pillar": "follow",
    "category": "SOP Vận hành Tác vụ",
    "title": "SOP Cấu hình, Chẩn đoán & Nhật ký Hoạt động",
    "subtitle": "Quy trình vận hành tiêu chuẩn để chẩn đoán hạ tầng, cấu hình ngưỡng kho candidate, dọn hàng đợi và đối soát sai khác dữ liệu",
    "duration": "8 phút đọc",
    "breadcrumbs": [
      {
        "label": "Hướng dẫn",
        "url": "/guideline"
      },
      {
        "label": "Quy trình (Follow)"
      },
      {
        "label": "SOP Vận hành Tác vụ"
      },
      {
        "label": "SOP Cấu hình & Chẩn đoán"
      }
    ],
    "blocks": [
      {
        "type": "heading",
        "level": 2,
        "text": "1. Chẩn đoán Sức khỏe Hạ tầng Hệ thống",
        "anchorId": "system-diagnostics"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Kiểm tra Tình trạng Hạ tầng",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Màn hình Chẩn đoán Hệ thống",
            "instruction": "Truy cập /admin/system. Kiểm tra phiên bản PHP, Laravel, kết nối CSDL MySQL, bộ nhớ đệm Cache và dung lượng ổ cứng.",
            "screenshot": {
              "src": "/images/guideline/system/figure-system-diagnostics.png",
              "alt": "Màn hình Chẩn đoán Hạ tầng",
              "caption": "Hình 8.1: Tình trạng môi trường máy chủ hiển thị thông số PHP, Laravel, DB và Cache",
              "location": "/admin/system",
              "targetArea": "Trang SystemDiagnosticPage",
              "captureInstruction": "Màn hình chẩn đoán"
            },
            "expectedResult": "Tất cả các thẻ hiển thị màu xanh xác nhận kết nối ổn định."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "2. Cấu hình Tham số Engine & Quản lý Hàng đợi",
        "anchorId": "system-settings-queues"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Cấu hình Engine & Dọn Hàng đợi",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Form Cấu hình Hệ thống",
            "instruction": "Truy cập /admin/system/settings. Kiểm tra tab Crawler Settings.",
            "screenshot": {
              "src": "/images/guideline/system/figure-system-settings.png",
              "alt": "Form Cấu hình Hệ thống",
              "caption": "Hình 8.2: Thiết lập ngưỡng kho candidate mục tiêu (5000 accounts), kích thước lô 20 và worker",
              "location": "/admin/system/settings",
              "targetArea": "Trang SystemSettingsPage",
              "captureInstruction": "Form cấu hình"
            },
            "fields": [
              {
                "name": "Fresh Target Size",
                "required": true,
                "description": "Dung lượng kho candidate mới cần duy trì (mặc định: 5000 accounts)"
              },
              {
                "name": "Kích thước Lô (Batch Size)",
                "required": true,
                "description": "Số lượng tài khoản cấp phát mỗi lô (mặc định: 20 accounts)"
              },
              {
                "name": "Số Worker Song song",
                "required": true,
                "description": "Số phiên trình duyệt headless chạy đồng thời trong Python engine"
              },
              {
                "name": "Thời gian Chờ (Request Timeout)",
                "required": true,
                "description": "Thời gian chờ tối đa cho mỗi HTTP request tính bằng giây"
              }
            ],
            "expectedResult": "Cấu hình lưu thành công và áp dụng ngay vào Worker Engine."
          },
          {
            "stepNumber": 2,
            "title": "Dọn Sạch Hàng đợi Worker (Purge Queue)",
            "instruction": "Khi cần giải phóng các tác vụ bị kẹt, nhấn nút 'Purge Queue' trong tab Worker Settings và xác nhận popconfirm.",
            "screenshot": {
              "src": "/images/guideline/system/figure-system-purge-queue.png",
              "alt": "Xác nhận Dọn Hàng đợi",
              "caption": "Hình 8.3: Popconfirm xác nhận dọn sạch hàng đợi worker bị kẹt",
              "location": "/admin/system/settings",
              "targetArea": "Tab WorkerSettingsTab Popconfirm",
              "captureInstruction": "Purge queue popconfirm"
            },
            "expectedResult": "Các tác vụ cũ bị dọn sạch, tài khoản candidate được giải phóng về kho sẵn sàng."
          }
        ]
      },
      {
        "type": "heading",
        "level": 2,
        "text": "3. Nhật ký Hoạt động & Xem Sai khác Dữ liệu (Diff Modal)",
        "anchorId": "system-audit-logs"
      },
      {
        "type": "procedure",
        "title": "Quy trình: Đối soát Nhật ký & Sai khác Dữ liệu",
        "steps": [
          {
            "stepNumber": 1,
            "title": "Mở Bảng Nhật ký Hoạt động (Activity Logs)",
            "instruction": "Truy cập /admin/system/activity-logs. Lọc theo Người thực hiện, Module, Hành động hoặc Khoảng ngày.",
            "screenshot": {
              "src": "/images/guideline/system/figure-activity-logs.png",
              "alt": "Bảng Nhật ký Hoạt động",
              "caption": "Hình 8.4: Danh sách sự kiện thay đổi dữ liệu kèm định danh người thực hiện và mốc thời gian",
              "location": "/admin/system/activity-logs",
              "targetArea": "Bảng ActivityLogTable",
              "captureInstruction": "Bảng activity logs"
            },
            "expectedResult": "Liệt kê chi tiết mọi hành vi thêm, sửa, xóa dữ liệu trên hệ thống."
          },
          {
            "stepNumber": 2,
            "title": "Xem Lịch sử Các Phiên Đăng nhập",
            "instruction": "Truy cập /admin/system/login-logs để kiểm tra địa chỉ IP, User Agent trình duyệt và trạng thái đăng nhập.",
            "screenshot": {
              "src": "/images/guideline/system/figure-login-logs.png",
              "alt": "Bảng Lịch sử Đăng nhập",
              "caption": "Hình 8.6: Lịch sử đăng nhập hiển thị địa chỉ IP, thiết bị và thời gian truy cập",
              "location": "/admin/system/login-logs",
              "targetArea": "Bảng LoginLogsPage",
              "captureInstruction": "Bảng login logs"
            },
            "expectedResult": "Bảng hiển thị các phiên đăng nhập thành công và thất bại phục vụ bảo mật."
          }
        ]
      }
    ]
  }
];
