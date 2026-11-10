Add-Type -AssemblyName System.Drawing

$baseDir = "cms-tiktok-crawler/public/images/guideline"

# Ensure directories exist
$subdirs = @("dashboard", "crawler", "tiktok-account", "user", "role", "system", "troubleshooting", "follow/quickstart", "follow/crawler-operations-sop", "follow/tiktok-account-sop", "follow/user-management-sop", "follow/roles-permissions-sop", "follow/system-diagnostics-sop")
foreach ($sub in $subdirs) {
    $path = Join-Path $baseDir $sub
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
    }
}

# Drawing helper functions
function New-Canvas($w, $h) {
    $bmp = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#F8FAFC"))
    return @{ Bitmap = $bmp; Graphics = $g; Width = $w; Height = $h }
}

function Save-Canvas($canvas, $relPath) {
    $fullPath = Join-Path $baseDir $relPath
    $canvas.Bitmap.Save($fullPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Graphics.Dispose()
    $canvas.Bitmap.Dispose()
    Write-Host "Created: $relPath" -ForegroundColor Green
}

function Draw-TopBanner($g, $w, $title, $badgeText, $badgeColorHtml) {
    $brushWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.FillRectangle($brushWhite, 0, 0, $w, 54)
    $penBorder = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#E2E8F0"), 1)
    $g.DrawLine($penBorder, 0, 54, $w, 54)

    # App Icon & Title
    $brushBlue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#1677FF"))
    $g.FillRectangle($brushBlue, 20, 12, 30, 30)
    $fontIcon = [System.Drawing.Font]::new("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $brushIconText = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.DrawString("TC", $fontIcon, $brushIconText, 23, 16)

    $fontTitle = [System.Drawing.Font]::new("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
    $brushTitle = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0F172A"))
    $g.DrawString($title, $fontTitle, $brushTitle, 60, 16)

    # Badge
    if ($badgeText) {
        $badgeColor = [System.Drawing.ColorTranslator]::FromHtml($badgeColorHtml)
        $brushBadgeBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(35, $badgeColor.R, $badgeColor.G, $badgeColor.B))
        $g.FillRectangle($brushBadgeBg, $w - 180, 14, 160, 26)
        $penBadge = [System.Drawing.Pen]::new($badgeColor, 1)
        $g.DrawRectangle($penBadge, $w - 180, 14, 160, 26)

        $fontBadge = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
        $brushBadgeText = [System.Drawing.SolidBrush]::new($badgeColor)
        $g.DrawString($badgeText, $fontBadge, $brushBadgeText, $w - 170, 18)
    }
}

function Draw-Card($g, $x, $y, $w, $h, $title) {
    $brushCard = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $g.FillRectangle($brushCard, $x, $y, $w, $h)
    $penBorder = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#E2E8F0"), 1)
    $g.DrawRectangle($penBorder, $x, $y, $w, $h)

    if ($title) {
        $fontTitle = [System.Drawing.Font]::new("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
        $brushTitle = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#1E293B"))
        $g.DrawString($title, $fontTitle, $brushTitle, $x + 16, $y + 14)
        $g.DrawLine($penBorder, $x, $y + 42, $x + $w, $y + 42)
    }
}

function Draw-Badge($g, $x, $y, $text, $type) {
    $colorMap = @{
        "success" = @{ bg = "#F6FFED"; border = "#B7EB8F"; text = "#52C41A" }
        "processing" = @{ bg = "#E6F4FF"; border = "#91CAFF"; text = "#1677FF" }
        "warning" = @{ bg = "#FFFBE6"; border = "#FFE58F"; text = "#FAAD14" }
        "error" = @{ bg = "#FFF2F0"; border = "#FFCCC7"; text = "#FF4D4F" }
        "default" = @{ bg = "#F5F5F5"; border = "#D9D9D9"; text = "#595959" }
    }
    $cfg = $colorMap[$type]
    if (-not $cfg) { $cfg = $colorMap["default"] }

    $font = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
    $size = $g.MeasureString($text, $font)
    $w = [int]$size.Width + 14
    $h = 20

    $brushBg = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($cfg.bg))
    $penBorder = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($cfg.border), 1)
    $brushText = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($cfg.text))

    $g.FillRectangle($brushBg, $x, $y, $w, $h)
    $g.DrawRectangle($penBorder, $x, $y, $w, $h)
    $g.DrawString($text, $font, $brushText, $x + 7, $y + 3)
}

function Draw-Button($g, $x, $y, $w, $h, $text, $type) {
    $bg = if ($type -eq "primary") { "#1677FF" } elseif ($type -eq "danger") { "#FF4D4F" } else { "#FFFFFF" }
    $textColor = if ($type -eq "default") { "#1E293B" } else { "#FFFFFF" }
    $borderColor = if ($type -eq "default") { "#D9D9D9" } else { $bg }

    $brushBg = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($bg))
    $penBorder = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($borderColor), 1)
    $brushText = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($textColor))
    $font = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)

    $g.FillRectangle($brushBg, $x, $y, $w, $h)
    $g.DrawRectangle($penBorder, $x, $y, $w, $h)
    $size = $g.MeasureString($text, $font)
    $tx = $x + ($w - $size.Width) / 2
    $ty = $y + ($h - $size.Height) / 2
    $g.DrawString($text, $font, $brushText, $tx, $ty)
}

function Draw-StepMarker($g, $stepNum, $x, $y, $text) {
    # Blue circular step indicator
    $brushCircle = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#FA8C16"))
    $g.FillEllipse($brushCircle, $x, $y, 22, 22)
    $brushNum = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $fontNum = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("$stepNum", $fontNum, $brushNum, $x + 6, $y + 3)

    if ($text) {
        $fontDesc = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
        $brushDesc = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#D46B08"))
        $g.DrawString($text, $fontDesc, $brushDesc, $x + 28, $y + 4)
    }
}

# ========================================================
# 1. DASHBOARD IMAGES
# ========================================================

# 1.1 figure-dashboard-overview.png
$c = New-Canvas 900 500
Draw-TopBanner $c.Graphics 900 "Dashboard Overview" "SYSTEM HEALTHY" "#52C41A"
# Left Nav
Draw-Card $c.Graphics 20 70 180 410 "Navigation"
$fontNav = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$brushNavActive = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#1677FF"))
$brushNavNormal = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#475569"))
$c.Graphics.DrawString("[x] Dashboard", $fontNav, $brushNavActive, 35, 120)
$c.Graphics.DrawString("[ ] Crawl Jobs", $fontNav, $brushNavNormal, 35, 155)
$c.Graphics.DrawString("[ ] TikTok Accounts", $fontNav, $brushNavNormal, 35, 190)
$c.Graphics.DrawString("[ ] Users & Roles", $fontNav, $brushNavNormal, 35, 225)
$c.Graphics.DrawString("[ ] System Diagnostics", $fontNav, $brushNavNormal, 35, 260)
$c.Graphics.DrawString("[?] Guidelines & Docs", $fontNav, $brushNavNormal, 35, 295)

# KPI Row
$kpis = @(
    @{ title = "Total Crawled Accounts"; val = "1,428"; sub = "+12% this week"; color = "#1677FF" },
    @{ title = "Total Videos Scraped"; val = "84,920"; sub = "+3,150 today"; color = "#52C41A" },
    @{ title = "Success Rate"; val = "99.2%"; sub = "Healthy Proxy Pool"; color = "#13C2C2" },
    @{ title = "Active Crawler Workers"; val = "4 / 4 Online"; sub = "0 Backlogged Jobs"; color = "#722ED1" }
)
for ($i = 0; $i -lt 4; $i++) {
    $kx = 220 + ($i * 165)
    Draw-Card $c.Graphics $kx 70 155 100 ""
    $fKpiT = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
    $fKpiV = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $fKpiS = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Italic)
    $bDark = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0F172A"))
    $bGray = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#64748B"))
    $bClr = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($kpis[$i].color))
    $c.Graphics.DrawString($kpis[$i].title, $fKpiT, $bGray, $kx + 12, 82)
    $c.Graphics.DrawString($kpis[$i].val, $fKpiV, $bClr, $kx + 12, 102)
    $c.Graphics.DrawString($kpis[$i].sub, $fKpiS, $bGray, $kx + 12, 140)
}

# Realtime activity card
Draw-Card $c.Graphics 220 190 650 290 "Recent Crawl Activities & Live Engine Traces"
$fRow = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
$bRow = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#1E293B"))
$c.Graphics.DrawString("JOB ID", $fontNav, $bGray, 240, 240)
$c.Graphics.DrawString("CREATOR TARGET", $fontNav, $bGray, 330, 240)
$c.Graphics.DrawString("STATUS", $fontNav, $bGray, 510, 240)
$c.Graphics.DrawString("VIDEOS", $fontNav, $bGray, 620, 240)
$c.Graphics.DrawString("UPDATED", $fontNav, $bGray, 730, 240)

$rows = @(
    @{ id = "#1042"; creator = "@vtv24news"; status = "success"; stText = "COMPLETED"; v = "18 / 18"; t = "2 mins ago" },
    @{ id = "#1041"; creator = "@khaby.lame"; status = "processing"; stText = "RUNNING"; v = "42 / 50"; t = "Just now" },
    @{ id = "#1040"; creator = "@schannelvn"; status = "success"; stText = "COMPLETED"; v = "30 / 30"; t = "15 mins ago" },
    @{ id = "#1039"; creator = "@tiktok"; status = "success"; stText = "COMPLETED"; v = "25 / 25"; t = "1 hour ago" },
    @{ id = "#1038"; creator = "@urekamedia"; status = "success"; stText = "COMPLETED"; v = "12 / 12"; t = "2 hours ago" }
)
$ry = 270
foreach ($r in $rows) {
    $c.Graphics.DrawString($r.id, $fRow, $bDark, 240, $ry)
    $c.Graphics.DrawString($r.creator, $fRow, $bRow, 330, $ry)
    Draw-Badge $c.Graphics 510 $ry $r.stText $r.status
    $c.Graphics.DrawString($r.v, $fRow, $bRow, 620, $ry)
    $c.Graphics.DrawString($r.t, $fRow, $bGray, 730, $ry)
    $ry += 38
}
Save-Canvas $c "dashboard/figure-dashboard-overview.png"

# 1.2 figure-dashboard-kpis.png
$c = New-Canvas 800 240
Draw-TopBanner $c.Graphics 800 "System Health & Growth KPI Summary" "" ""
for ($i = 0; $i -lt 4; $i++) {
    $kx = 20 + ($i * 190)
    Draw-Card $c.Graphics $kx 75 180 140 ""
    $c.Graphics.DrawString($kpis[$i].title, $fKpiT, $bGray, $kx + 14, 90)
    $c.Graphics.DrawString($kpis[$i].val, $fKpiV, $bClr, $kx + 14, 115)
    $c.Graphics.DrawString($kpis[$i].sub, $fKpiS, $bGray, $kx + 14, 155)
    Draw-StepMarker $c.Graphics ($i + 1) ($kx + 140) 85 ""
}
Save-Canvas $c "dashboard/figure-dashboard-kpis.png"

# 1.3 figure-dashboard-engine-health.png
$c = New-Canvas 700 320
Draw-TopBanner $c.Graphics 700 "Crawler Engine Real-time Health Monitor" "FASTAPI ENGINE ONLINE" "#52C41A"
Draw-Card $c.Graphics 30 75 640 220 "Python Engine Metrics & Connection Health"
Draw-Badge $c.Graphics 50 125 "HTTP 200 OK" "success"
Draw-Badge $c.Graphics 160 125 "LATENCY: 0.8ms" "processing"
Draw-Badge $c.Graphics 280 125 "WORKER POOL: 4 THREADS" "success"

$fontDetail = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
$c.Graphics.DrawString("- Service Host: http://127.0.0.1:8000 (Internal Docker Bridge)", $fontDetail, $bRow, 50, 165)
$c.Graphics.DrawString("- Queue Manager: SQLite WAL Mode (Concurrency Safe)", $fontDetail, $bRow, 50, 195)
$c.Graphics.DrawString("- Scheduler & Outbox: Active (Poll interval 1.0s, Rate limiter 5 req/s)", $fontDetail, $bRow, 50, 225)
$c.Graphics.DrawString("- Proxies: 24 Residential Active | Slardar WAF Protection Bypassed", $fontDetail, $bRow, 50, 255)
Draw-StepMarker $c.Graphics 1 610 125 ""
Save-Canvas $c "dashboard/figure-dashboard-engine-health.png"

# 1.4 figure-dashboard-recent-activities.png
$c = New-Canvas 800 340
Draw-TopBanner $c.Graphics 800 "Recent Crawl Activities Stream" "" ""
Draw-Card $c.Graphics 30 75 740 240 "Live Extraction Ingestion Stream"
$ry = 125
foreach ($r in $rows) {
    $c.Graphics.DrawString($r.id, $fRow, $bDark, 50, $ry)
    $c.Graphics.DrawString($r.creator, $fRow, $bRow, 150, $ry)
    Draw-Badge $c.Graphics 310 $ry $r.stText $r.status
    $c.Graphics.DrawString("Extracted: " + $r.v + " videos", $fRow, $bRow, 440, $ry)
    $c.Graphics.DrawString($r.t, $fRow, $bGray, 630, $ry)
    $ry += 35
}
Save-Canvas $c "dashboard/figure-dashboard-recent-activities.png"

# ========================================================
# 2. CRAWLER MODULE IMAGES
# ========================================================

# 2.1 figure-crawl-job-date-filter.png (NEW & CRUCIAL)
$c = New-Canvas 800 420
Draw-TopBanner $c.Graphics 800 "Crawl Job - Date Filter Configuration" "DATE RESTRICTION" "#1677FF"
Draw-Card $c.Graphics 30 75 740 320 "Step 3: Target Date Range Selection"

$fLabel = [System.Drawing.Font]::new("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$c.Graphics.DrawString("Video Published Date Filter (target_date):", $fLabel, $bDark, 50, 120)

# Radio Buttons
$opts = @(
    @{ text = "All (No limit)"; checked = $false; x = 50 },
    @{ text = "Today (Hôm nay)"; checked = $true; x = 200 },
    @{ text = "Yesterday (Hôm qua)"; checked = $false; x = 380 },
    @{ text = "Custom Range (Tùy chọn)"; checked = $false; x = 560 }
)
foreach ($opt in $opts) {
    $penColor = if ($opt.checked) { "#1677FF" } else { "#D9D9D9" }
    $penR = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($penColor), 2)
    $c.Graphics.DrawEllipse($penR, $opt.x, 155, 16, 16)
    if ($opt.checked) {
        $brushDot = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#1677FF"))
        $c.Graphics.FillEllipse($brushDot, $opt.x + 4, 159, 8, 8)
    }
    $fStyle = if ($opt.checked) { [System.Drawing.FontStyle]::Bold } else { [System.Drawing.FontStyle]::Regular }
    $fOpt = [System.Drawing.Font]::new("Segoe UI", 9, $fStyle)
    $textColor = if ($opt.checked) { "#1677FF" } else { "#334155" }
    $bOpt = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($textColor))
    $c.Graphics.DrawString($opt.text, $fOpt, $bOpt, $opt.x + 22, 154)
}

# Callout explanation box
$brushInfo = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#EFF6FF"))
$penInfo = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#BFDBFE"), 1)
$c.Graphics.FillRectangle($brushInfo, 50, 195, 700, 140)
$c.Graphics.DrawRectangle($penInfo, 50, 195, 700, 140)

$fInfoH = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$fInfoP = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
$bBlue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#1D4ED8"))
$c.Graphics.DrawString("[i] How 'Today' Date Filtering & Early Break Works:", $fInfoH, $bBlue, 65, 205)
$c.Graphics.DrawString("1. CMS resolves 'today' to UTC bounds based on Asia/Ho_Chi_Minh (00:00:00 -> 23:59:59 +07:00).", $fInfoP, $bDark, 65, 230)
$c.Graphics.DrawString("2. Python Crawler inspects incoming video timestamps during pagination.", $fInfoP, $bDark, 65, 255)
$c.Graphics.DrawString("3. Strict Filter: Only videos published within today's window are saved to MySQL database.", $fInfoP, $bDark, 65, 280)
$c.Graphics.DrawString("4. Early Break: On the first video older than today (excluding pinned), crawler halts pagination instantly.", $fInfoP, $bDark, 65, 305)

Draw-StepMarker $c.Graphics 1 330 152 "SELECTED"
Save-Canvas $c "crawler/figure-crawl-job-date-filter.png"

# 2.2 figure-crawl-job-source-types.png
$c = New-Canvas 800 360
Draw-TopBanner $c.Graphics 800 "Crawl Job - Source Type Selection" "" ""
Draw-Card $c.Graphics 30 75 740 260 "Step 1: Choose Source Type"
$stypes = @(
    @{ title = "Usernames"; desc = "Input list of TikTok @handles (e.g. @tiktok, @khaby.lame)"; active = $true; x = 50 },
    @{ title = "Profile URLs"; desc = "Paste direct TikTok web URLs (https://www.tiktok.com/@...)"; active = $false; x = 220 },
    @{ title = "Database Accounts"; desc = "Select from previously crawled accounts stored in database"; active = $false; x = 390 },
    @{ title = "Discovery Count"; desc = "Auto-harvest N candidate accounts from discovery pool"; active = $false; x = 560 }
)
foreach ($st in $stypes) {
    $bg = if ($st.active) { "#EFF6FF" } else { "#FFFFFF" }
    $bdr = if ($st.active) { "#1677FF" } else { "#CBD5E1" }
    $penWidth = if ($st.active) { 2 } else { 1 }
    $titleColor = if ($st.active) { "#1677FF" } else { "#1E293B" }
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($bg))
    $pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($bdr), $penWidth)
    $c.Graphics.FillRectangle($brush, $st.x, 120, 155, 140)
    $c.Graphics.DrawRectangle($pen, $st.x, 120, 155, 140)

    $fT = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $fD = [System.Drawing.Font]::new("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
    $bT = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($titleColor))
    $c.Graphics.DrawString($st.title, $fT, $bT, $st.x + 12, 135)
    $rect = [System.Drawing.RectangleF]::new($st.x + 12, 165, 130, 85)
    $c.Graphics.DrawString($st.desc, $fD, $bGray, $rect)
    if ($st.active) {
        Draw-StepMarker $c.Graphics 1 ($st.x + 125) 125 ""
    }
}
Save-Canvas $c "crawler/figure-crawl-job-source-types.png"

# 2.3 figure-crawl-job-modes.png
$c = New-Canvas 800 320
Draw-TopBanner $c.Graphics 800 "Crawl Job - Crawl Mode Options" "" ""
Draw-Card $c.Graphics 30 75 740 220 "Step 2: Select Crawl Mode"
$modes = @(
    @{ title = "Account With Videos"; desc = "Scrapes creator profile metadata (bio, followers) AND latest videos."; badge = "RECOMMENDED"; color = "success"; x = 50 },
    @{ title = "Account Only"; desc = "Only extracts creator profile metadata. Fast discovery mode (0 videos)."; badge = "FAST"; color = "processing"; x = 280 },
    @{ title = "Video Only"; desc = "Refreshes video engagement metrics for an already-known creator."; badge = "REFRESH"; color = "warning"; x = 510 }
)
foreach ($m in $modes) {
    Draw-Card $c.Graphics $m.x 120 215 150 ""
    $fT = [System.Drawing.Font]::new("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
    $c.Graphics.DrawString($m.title, $fT, $bDark, $m.x + 14, 135)
    Draw-Badge $c.Graphics ($m.x + 14) 165 $m.badge $m.color
    $rect = [System.Drawing.RectangleF]::new($m.x + 14, 195, 185, 65)
    $c.Graphics.DrawString($m.desc, $fRow, $bGray, $rect)
}
Save-Canvas $c "crawler/figure-crawl-job-modes.png"

# 2.4 figure-crawl-job-start-confirm.png
$c = New-Canvas 700 320
Draw-TopBanner $c.Graphics 700 "Crawl Jobs - Start Confirmation Dialog" "" ""
Draw-Card $c.Graphics 30 75 640 220 "Action Column Popconfirm"
$c.Graphics.DrawString("Job #1042 - @vtv24news | Status: Pending | Target Date: Today", $fontNav, $bDark, 50, 120)

# Popconfirm box
$brushPop = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$penPop = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#1677FF"), 2)
$c.Graphics.FillRectangle($brushPop, 200, 150, 300, 110)
$c.Graphics.DrawRectangle($penPop, 200, 150, 300, 110)

$fPop = [System.Drawing.Font]::new("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$c.Graphics.DrawString("[?] Start this Crawl Job now?", $fPop, $bDark, 220, 165)
$c.Graphics.DrawString("This will dispatch the payload to Python worker.", $fRow, $bGray, 220, 190)

Draw-Button $c.Graphics 330 220 70 26 "Cancel" "default"
Draw-Button $c.Graphics 410 220 75 26 "Start" "primary"
Draw-StepMarker $c.Graphics 1 470 210 "CLICK START"
Save-Canvas $c "crawler/figure-crawl-job-start-confirm.png"

# 2.5 figure-crawl-job-results.png
$c = New-Canvas 800 380
Draw-TopBanner $c.Graphics 800 "Job Detail - Video Results Tab" "20 VIDEOS EXTRACTED" "#52C41A"
Draw-Card $c.Graphics 30 75 740 280 "Extracted Video Items (Target Date: Today)"
# Tabs
$c.Graphics.DrawString("Summary", $fontNav, $bGray, 50, 115)
$c.Graphics.DrawString("Account Results (1)", $fontNav, $bGray, 140, 115)
$c.Graphics.DrawString("[Video Results (20)]", $fontNav, $brushNavActive, 280, 115)
$penTab = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#1677FF"), 2)
$c.Graphics.DrawLine($penTab, 280, 135, 410, 135)

$vrows = @(
    @{ title = "Ban tin 24h toi nay: Xu huong kinh te va thi truong..."; views = "1.2M"; likes = "45.2K"; comments = "1,840"; date = "Today 14:20" },
    @{ title = "Diem tin buoi sang: Cap nhat thoi tiet va giao thong..."; views = "850K"; likes = "32.1K"; comments = "920"; date = "Today 08:15" },
    @{ title = "Phong su ngan: Doi song lao dong tren cac cong trinh..."; views = "620K"; likes = "28.4K"; comments = "640"; date = "Today 06:45" }
)
$vy = 160
foreach ($vr in $vrows) {
    # Thumbnail mockup
    $bThumb = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#0F172A"))
    $bWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $c.Graphics.FillRectangle($bThumb, 50, $vy, 45, 55)
    $c.Graphics.DrawString("[>]", $fInfoH, $bWhite, 62, $vy + 18)

    $c.Graphics.DrawString($vr.title, $fLabel, $bDark, 110, $vy + 5)
    $c.Graphics.DrawString("Views: " + $vr.views + " | Likes: " + $vr.likes + " | Comments: " + $vr.comments + " | Published: " + $vr.date, $fRow, $bGray, 110, $vy + 32)
    Draw-Badge $c.Graphics 660 ($vy + 15) "VERIFIED TODAY" "success"
    $vy += 65
}
Save-Canvas $c "crawler/figure-crawl-job-results.png"

# 2.6 figure-crawl-job-stop-confirm.png
$c = New-Canvas 700 320
Draw-TopBanner $c.Graphics 700 "Crawl Jobs - Stop / Cancel Running Job" "" ""
Draw-Card $c.Graphics 30 75 640 220 "Safe Cancellation Dialog"
$c.Graphics.DrawString("Job #1041 - @khaby.lame | Status: Running (42/50)", $fontNav, $bDark, 50, 120)

$c.Graphics.FillRectangle($brushPop, 200, 150, 320, 115)
$penRed = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#FF4D4F"), 2)
$c.Graphics.DrawRectangle($penRed, 200, 150, 320, 115)

$c.Graphics.DrawString("[!] Stop this running job?", $fPop, [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#FF4D4F")), 220, 165)
$c.Graphics.DrawString("Active background threads will terminate safely.", $fRow, $bGray, 220, 190)

Draw-Button $c.Graphics 340 220 70 26 "Cancel" "default"
Draw-Button $c.Graphics 420 220 80 26 "Stop Job" "danger"
Draw-StepMarker $c.Graphics 1 480 210 "CLICK STOP"
Save-Canvas $c "crawler/figure-crawl-job-stop-confirm.png"

# 2.7 figure-crawl-job-retry.png
$c = New-Canvas 700 320
Draw-TopBanner $c.Graphics 700 "Crawl Jobs - Smart Retry for Failed Jobs" "" ""
Draw-Card $c.Graphics 30 75 640 220 "Smart Proxy Rotation & Unfinished Targets"
$c.Graphics.DrawString("Job #1035 - Status: Failed | Error: Slardar WAF Challenge", $fontNav, $bDark, 50, 120)

$c.Graphics.FillRectangle($brushInfo, 50, 155, 600, 95)
$c.Graphics.DrawRectangle($penInfo, 50, 155, 600, 95)
$c.Graphics.DrawString("Smart Retry preserves all already-crawled videos and creates a clean recovery payload.", $fInfoH, $bBlue, 70, 170)
$c.Graphics.DrawString("Click the Retry icon (RedoOutlined) to allocate fresh residential proxies and resume.", $fRow, $bDark, 70, 200)

Draw-Button $c.Graphics 520 210 110 28 "Smart Retry" "primary"
Draw-StepMarker $c.Graphics 1 615 200 ""
Save-Canvas $c "crawler/figure-crawl-job-retry.png"

# ========================================================
# 3. TIKTOK ACCOUNT MODULE IMAGES
# ========================================================

# 3.1 figure-account-quick-recrawl.png
$c = New-Canvas 700 300
Draw-TopBanner $c.Graphics 700 "TikTok Account - Quick Re-Crawl" "" ""
Draw-Card $c.Graphics 30 75 640 200 "Single Creator Refresh Action"
$c.Graphics.DrawString("Creator: @khaby.lame | Followers: 162.8M | Last Scraped: 3 days ago", $fontNav, $bDark, 50, 120)
Draw-Button $c.Graphics 50 160 140 32 "Quick Re-crawl" "primary"
Draw-StepMarker $c.Graphics 1 175 150 "ONE-CLICK RE-CRAWL"
$c.Graphics.DrawString("Instantly enqueues an prioritized crawl job for this creator with latest videos.", $fRow, $bGray, 50, 210)
Save-Canvas $c "tiktok-account/figure-account-quick-recrawl.png"

# 3.2 figure-account-export.png
$c = New-Canvas 700 300
Draw-TopBanner $c.Graphics 700 "TikTok Account - Dataset Export" "" ""
Draw-Card $c.Graphics 30 75 640 200 "Export Creator & Video Analytics"
$c.Graphics.DrawString("Select dataset format to download comprehensive metrics:", $fontNav, $bDark, 50, 120)
Draw-Button $c.Graphics 50 160 130 32 "Export CSV" "default"
Draw-Button $c.Graphics 200 160 130 32 "Export Excel" "primary"
Draw-Button $c.Graphics 350 160 130 32 "Export JSON" "default"
Draw-StepMarker $c.Graphics 1 315 150 ""
Save-Canvas $c "tiktok-account/figure-account-export.png"

# ========================================================
# 4. USER & ROLE MODULE IMAGES
# ========================================================

# 4.1 figure-user-edit.png
$c = New-Canvas 700 340
Draw-TopBanner $c.Graphics 700 "User Management - Edit User Modal" "" ""
Draw-Card $c.Graphics 30 75 640 240 "Update User Credentials & Role Binding"
$c.Graphics.DrawString("Full Name: Nguyen Van A", $fontNav, $bDark, 50, 125)
$c.Graphics.DrawString("Email Address: admin@cms.com", $fontNav, $bDark, 50, 155)
$c.Graphics.DrawString("Assigned Role:", $fontNav, $bDark, 50, 185)
Draw-Badge $c.Graphics 170 185 "ADMINISTRATOR" "processing"
Draw-Badge $c.Graphics 290 185 "CRAWLER OPERATOR" "success"
Draw-Button $c.Graphics 420 240 100 30 "Cancel" "default"
Draw-Button $c.Graphics 530 240 120 30 "Save Changes" "primary"
Draw-StepMarker $c.Graphics 1 635 230 ""
Save-Canvas $c "user/figure-user-edit.png"

# 4.2 figure-user-delete.png
$c = New-Canvas 700 300
Draw-TopBanner $c.Graphics 700 "User Management - Delete Safeguard" "" ""
Draw-Card $c.Graphics 30 75 640 200 "Self-Deletion Prevention & Confirmation"
$c.Graphics.DrawString("[!] Cannot delete your own active administrator account.", $fPop, [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#FF4D4F")), 50, 125)
$c.Graphics.DrawString("Security policy prevents accidental lockout of current session.", $fRow, $bGray, 50, 155)
Draw-Button $c.Graphics 50 195 120 30 "Acknowledge" "default"
Save-Canvas $c "user/figure-user-delete.png"

# 4.3 figure-role-create.png
$c = New-Canvas 750 360
Draw-TopBanner $c.Graphics 750 "Roles & Permissions - Create Role" "" ""
Draw-Card $c.Graphics 30 75 690 260 "Role Definition & Permission Scope"
$c.Graphics.DrawString("Role Name: Media Analyst", $fontNav, $bDark, 50, 125)
$c.Graphics.DrawString("Role Slug: media_analyst", $fontNav, $bDark, 350, 125)
$c.Graphics.DrawString("Permission Matrix:", $fontNav, $bDark, 50, 160)

$mods = @("Crawler (View)", "TikTok Accounts (View, Edit)", "Users (None)", "System (View)")
$mx = 50
foreach ($mod in $mods) {
    Draw-Badge $c.Graphics $mx 190 $mod "processing"
    $mx += 155
}
Draw-Button $c.Graphics 550 270 140 32 "+ Create Role" "primary"
Draw-StepMarker $c.Graphics 1 670 260 ""
Save-Canvas $c "role/figure-role-create.png"

# ========================================================
# 5. TROUBLESHOOTING IMAGES
# ========================================================

# 5.1 figure-troubleshooting-rate-limit.png
$c = New-Canvas 750 320
Draw-TopBanner $c.Graphics 750 "Troubleshooting - Rate Limiting & Proxy Rotation" "HTTP 429 HANDLING" "#FA8C16"
Draw-Card $c.Graphics 30 75 690 220 "Automatic Exponential Backoff Workflow"
Draw-Badge $c.Graphics 50 125 "DETECT: HTTP 429 / SLARDAR WAF" "error"
Draw-Badge $c.Graphics 320 125 "ROTATE PROXY (RESIDENTIAL IP)" "processing"
Draw-Badge $c.Graphics 550 125 "RESUME TASK" "success"

$c.Graphics.DrawString("1. The crawler automatically retries up to 3 times with exponential backoff (2s -> 4s -> 8s).", $fRow, $bDark, 50, 170)
$c.Graphics.DrawString("2. If TikTok displays captcha challenge, worker marks proxy bad and requests new IP from candidate pool.", $fRow, $bDark, 50, 200)
$c.Graphics.DrawString("3. No manual operator intervention is required during routine rate limits.", $fRow, $bGray, 50, 230)
Save-Canvas $c "troubleshooting/figure-troubleshooting-rate-limit.png"

# 5.2 figure-troubleshooting-private-account.png
$c = New-Canvas 750 300
Draw-TopBanner $c.Graphics 750 "Troubleshooting - Private or Banned Accounts" "STATUS NOTIFICATION" "#FF4D4F"
Draw-Card $c.Graphics 30 75 690 200 "Handling Inaccessible TikTok Targets"
Draw-Badge $c.Graphics 50 125 "ERROR: ACCOUNT_PRIVATE_OR_BANNED" "error"
$c.Graphics.DrawString("Private accounts cannot be crawled via public API without creator authorization.", $fRow, $bDark, 50, 160)
$c.Graphics.DrawString("The job runner safely skips this creator, marks failed_count + 1, and continues remaining targets.", $fRow, $bGray, 50, 190)
Save-Canvas $c "troubleshooting/figure-troubleshooting-private-account.png"

# 5.3 figure-troubleshooting-engine-offline.png
$c = New-Canvas 750 300
Draw-TopBanner $c.Graphics 750 "Troubleshooting - Crawler Engine Reconnection" "OFFLINE SAFEGUARD" "#FAAD14"
Draw-Card $c.Graphics 30 75 690 200 "Autonomous Worker Recovery"
Draw-Badge $c.Graphics 50 125 "WARN: CRAWLER_SERVICE_OFFLINE" "warning"
$c.Graphics.DrawString("When FastAPI service restarts, CMS puts active jobs into safe waiting state.", $fRow, $bDark, 50, 160)
$c.Graphics.DrawString("Once service heartbeat returns, CMS automatically reconciles job status without data loss.", $fRow, $bGray, 50, 190)
Save-Canvas $c "troubleshooting/figure-troubleshooting-engine-offline.png"

# 5.4 figure-troubleshooting-empty-date.png
$c = New-Canvas 750 300
Draw-TopBanner $c.Graphics 750 "Troubleshooting - Zero Videos in Target Date" "DATE FILTER DIAGNOSIS" "#1677FF"
Draw-Card $c.Graphics 30 75 690 200 "Target Date Window Without New Uploads"
Draw-Badge $c.Graphics 50 125 "JOB STATUS: COMPLETED (0 VIDEOS)" "processing"
$c.Graphics.DrawString("If target_date = 'today' and creator did not publish any videos today, 0 videos is the correct result.", $fRow, $bDark, 50, 160)
$c.Graphics.DrawString("Creator profile metadata is still updated. To crawl older videos, select 'All' or expand custom date range.", $fRow, $bGray, 50, 190)
Save-Canvas $c "troubleshooting/figure-troubleshooting-empty-date.png"

# ========================================================
# Also ensure all referenced SOP figure paths exist in subfolders:
# ========================================================
$copylist = @(
    @{ src = "crawler/figure-crawl-job-date-filter.png"; dst = "follow/crawler-operations-sop/figure-2-1-date-filter.png" },
    @{ src = "crawler/figure-crawl-job-source-types.png"; dst = "follow/crawler-operations-sop/figure-2-2-source-types.png" },
    @{ src = "crawler/figure-crawl-job-modes.png"; dst = "follow/crawler-operations-sop/figure-2-3-crawl-modes.png" },
    @{ src = "crawler/figure-crawl-job-start-confirm.png"; dst = "follow/crawler-operations-sop/figure-2-4-start-confirm.png" },
    @{ src = "crawler/figure-crawl-job-results.png"; dst = "follow/crawler-operations-sop/figure-2-5-video-results.png" },
    @{ src = "crawler/figure-crawl-job-stop-confirm.png"; dst = "follow/crawler-operations-sop/figure-2-6-stop-confirm.png" },
    @{ src = "crawler/figure-crawl-job-retry.png"; dst = "follow/crawler-operations-sop/figure-2-7-smart-retry.png" },
    @{ src = "tiktok-account/figure-account-quick-recrawl.png"; dst = "follow/tiktok-account-sop/figure-3-4-quick-recrawl.png" },
    @{ src = "tiktok-account/figure-account-export.png"; dst = "follow/tiktok-account-sop/figure-3-5-export-modal.png" },
    @{ src = "user/figure-user-edit.png"; dst = "follow/user-management-sop/figure-4-2-edit-user.png" },
    @{ src = "user/figure-user-delete.png"; dst = "follow/user-management-sop/figure-4-3-delete-safeguard.png" },
    @{ src = "role/figure-role-create.png"; dst = "follow/roles-permissions-sop/figure-5-2-create-role.png" },
    @{ src = "system/figure-activity-logs.png"; dst = "follow/system-diagnostics-sop/figure-6-2-activity-logs.png" },
    @{ src = "system/figure-login-logs.png"; dst = "follow/system-diagnostics-sop/figure-6-3-login-logs.png" },
    @{ src = "system/figure-system-settings.png"; dst = "follow/system-diagnostics-sop/figure-6-4-system-settings.png" }
)
foreach ($cp in $copylist) {
    $srcFull = Join-Path $baseDir $cp.src
    $dstFull = Join-Path $baseDir $cp.dst
    if (Test-Path $srcFull) {
        Copy-Item -Path $srcFull -Destination $dstFull -Force
        Write-Host "Mirrored: $($cp.dst)" -ForegroundColor Cyan
    }
}

Write-Host "All guideline illustration images successfully generated!" -ForegroundColor Green
