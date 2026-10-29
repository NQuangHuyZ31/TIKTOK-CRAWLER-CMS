<#
.SYNOPSIS
    Automates Pull Request creation and branch pushing for AI Agents adhering to AGENTS.md.

.DESCRIPTION
    1. Validates that current branch is a category branch (never 'main').
    2. Validates TypeScript types locally if node_modules exists.
    3. Pushes category branch to GitHub remote origin.
    4. Outputs GitHub Pull Request URL for human review.

.PARAMETER Action
    'CreatePR' or 'Status'. Default is 'CreatePR'.

.PARAMETER Branch
    The category branch to push (e.g. 'refactor', 'feature', 'fix'). If not provided, uses active git branch.

.PARAMETER TargetBranch
    The destination branch to merge into. Default is 'main'.

.EXAMPLE
    .\scripts\agent-pr.ps1 -Branch "refactor"
#>

param (
    [ValidateSet("CreatePR", "Status")]
    [string]$Action = "CreatePR",

    [string]$Branch = "",

    [string]$TargetBranch = "main"
)

$ErrorActionPreference = "Stop"

# Detect Git Root dynamically
try {
    $GitRoot = (git rev-parse --show-toplevel 2>$null).Trim()
} catch {
    $GitRoot = (Get-Location).Path
}

$WorkingPath = $GitRoot

if (-not $Branch) {
    $Branch = (git -C "$WorkingPath" rev-parse --abbrev-ref HEAD 2>$null).Trim()
}

$allowedBranches = @("feature", "fix", "refactor", "hotfix", "test", "chore")

if ($Branch -eq "main" -or $Branch -eq "develop") {
    Write-Error "ABORT: Direct push/PR from '$Branch' is strictly prohibited. You must work on a designated category branch: $($allowedBranches -join ', ')."
    exit 1
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - AI Pull Request Workflow" -ForegroundColor Cyan
Write-Host " Category Branch : $Branch" -ForegroundColor Yellow
Write-Host " Target Branch   : $TargetBranch" -ForegroundColor Yellow
Write-Host " Working Dir     : $WorkingPath" -ForegroundColor DarkGray
Write-Host "========================================================`n" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. Local Validation Gate
# -----------------------------------------------------------------------------
Write-Host "[Gate 1/3] Running Mandatory Pre-PR Quality Verification..." -ForegroundColor Yellow

$cmsDir = "$GitRoot\cms-tiktok-crawler"

if (Test-Path "$cmsDir\node_modules") {
    $tsCheck = npm.cmd --prefix "$cmsDir" run check-types 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript compilation failed with errors. Fix all type errors before creating PR:`n$tsCheck"
        exit 1
    }
    Write-Host "  -> Strict TypeScript Verification: PASSED (0 errors)" -ForegroundColor Green
} else {
    Write-Host "  -> Node modules not installed locally; TypeScript check will execute in GitHub Actions CI." -ForegroundColor DarkGray
}

# -----------------------------------------------------------------------------
# 2. Push Category Branch to Origin (NEVER to main)
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 2/3] Pushing branch '$Branch' to remote origin..." -ForegroundColor Yellow
git -C "$WorkingPath" push -u origin "$Branch"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push branch '$Branch' to origin."
    exit 1
}
Write-Host "  -> Branch '$Branch' pushed successfully to origin." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. Pull Request Generation & Human Handoff
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 3/3] Preparing Pull Request for '$Branch' -> '$TargetBranch'..." -ForegroundColor Yellow

$remoteUrl = (git -C "$WorkingPath" config --get remote.origin.url 2>$null)
if ($remoteUrl -match "github\.com[:/](.+?)(?:\.git)?$") {
    $repoSlug = $Matches[1]
    $RepoUrl = "https://github.com/$repoSlug"
} else {
    $RepoUrl = "https://github.com/NQuangHuyZ31/TIKTOK-CRAWLER-CMS"
}
$PrUrl = "$RepoUrl/pull/new/$Branch"

$lastCommit = (git -C "$WorkingPath" log -1 --pretty=format:"%s (%h)").Trim()

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " ✅ PULL REQUEST PREPARED & PUSHED TO ORIGIN" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host " Latest Commit   : $lastCommit" -ForegroundColor White
Write-Host " Category Branch : $Branch" -ForegroundColor Yellow
Write-Host " Target Branch   : $TargetBranch" -ForegroundColor Yellow
Write-Host " PR URL          : $PrUrl" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Green

Write-Host "[Next Steps - Human Review & Release Lifecycle]" -ForegroundColor Yellow
Write-Host "1. Open the PR link: $PrUrl" -ForegroundColor Cyan
Write-Host "2. Verify CI quality checks pass automatically on GitHub Actions." -ForegroundColor White
Write-Host "3. Review the code diff and click 'Merge pull request' into '$TargetBranch'." -ForegroundColor White
Write-Host "4. Merging into '$TargetBranch' triggers 'auto-draft-release.yml' to generate a Draft Release." -ForegroundColor White
Write-Host "5. [RELEASE GATE] Review Draft Release at $RepoUrl/releases and manually click 'Publish release' to deploy to Render." -ForegroundColor Yellow
Write-Host ""
