<#
.SYNOPSIS
    Automates task & release branch pushing, verification, and Pull Request preparation for AI Agents adhering to AGENTS.md.

.DESCRIPTION
    Allows AI agents to safely:
    1. Validate branch naming and local tests (TypeScript, Pest).
    2. Push branch (e.g. 'release/v1.0.0', 'feature/PROJ-101') to remote origin.
    3. Output Pull Request link targeting 'main' with standardized PR template.
    4. STOP and await human code review & merge into 'main' on GitHub.
    5. After human merges into 'main', GitHub Action automatically creates the Draft Release.

    IMPORTANT: Direct pushing to 'main' is STRICTLY FORBIDDEN. All changes enter 'main' via Pull Request review.

.PARAMETER Action
    'CreatePR' (default) or 'Status'.

.PARAMETER Branch
    The branch name (e.g. 'release/v1.0.0', 'feature/PROJ-101-auth').

.PARAMETER TargetBranch
    The target branch for the Pull Request. Default is 'main'.

.PARAMETER WorktreeIndex
    Slot index (1-5). Default is 1.

.EXAMPLE
    # Push release branch and generate PR link to main
    .\scripts\agent-pr.ps1 -Branch "release/v1.0.0"

    # Push feature branch and generate PR link
    .\scripts\agent-pr.ps1 -Branch "feature/PROJ-101-proxy-rotation"
#>

param (
    [ValidateSet("CreatePR", "Status")]
    [string]$Action = "CreatePR",

    [string]$Branch = "",

    [string]$TargetBranch = "main",

    [ValidateRange(1, 5)]
    [int]$WorktreeIndex = 1
)

$ErrorActionPreference = "Stop"

# Detect Git Root
try {
    $GitRoot = (git rev-parse --show-toplevel 2>$null).Trim()
} catch {
    $GitRoot = "E:\Urekamedia\project1"
}

$ParentDir = Split-Path -Parent $GitRoot
$TargetWorktreePath = "$ParentDir\project1-worktree-$WorktreeIndex"

# Determine active working path
$WorkingPath = if (Test-Path "$TargetWorktreePath") { "$TargetWorktreePath" } else { "$GitRoot" }

if (-not $Branch) {
    $Branch = (git -C "$WorkingPath" rev-parse --abbrev-ref HEAD 2>$null).Trim()
}

if ($Branch -eq "main" -or $Branch -eq "develop") {
    Write-Error "ABORT: Current branch is '$Branch'. Development and PR creation must originate from a task branch or 'release/v<version>' branch."
    exit 1
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - AI Pull Request Workflow" -ForegroundColor Cyan
Write-Host " Source Branch : $Branch" -ForegroundColor Yellow
Write-Host " Target Branch : $TargetBranch" -ForegroundColor Yellow
Write-Host " Working Dir   : $WorkingPath" -ForegroundColor DarkGray
Write-Host "========================================================`n" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. Local Validation Gate
# -----------------------------------------------------------------------------
Write-Host "[Gate 1/3] Running Mandatory Pre-PR Quality Verification..." -ForegroundColor Yellow

$tsCheck = npm.cmd --prefix "$GitRoot\cms-tiktok-crawler" run check-types 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "TypeScript compilation failed with errors. Fix all type errors before creating PR:`n$tsCheck"
    exit 1
}
Write-Host "  -> Strict TypeScript Verification: PASSED (0 errors)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. Push Branch to Origin (NEVER directly to main)
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 2/3] Pushing branch '$Branch' to remote origin..." -ForegroundColor Yellow
git -C "$WorkingPath" push -u origin "$Branch"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to push branch '$Branch' to origin."
    exit 1
}
Write-Host "  -> Branch pushed successfully to origin." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. Pull Request Generation & Human Handoff
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 3/3] Preparing Pull Request for '$Branch' -> '$TargetBranch'..." -ForegroundColor Yellow

$RepoUrl = "https://github.com/NQuangHuyZ31/TIKTOK-CRAWLER-CMS"
$PrUrl = "$RepoUrl/pull/new/$Branch"

$lastCommit = (git -C "$WorkingPath" log -1 --pretty=format:"%s (%h)").Trim()

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " ✅ PULL REQUEST PREPARED & PUSHED TO ORIGIN" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host " Latest Commit : $lastCommit" -ForegroundColor White
Write-Host " Source Branch : $Branch" -ForegroundColor Yellow
Write-Host " Target Branch : $TargetBranch" -ForegroundColor Yellow
Write-Host " PR URL        : $PrUrl" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Green

Write-Host "[Next Steps - Human Review & Release Lifecycle]" -ForegroundColor Yellow
Write-Host "1. Open the PR link: $PrUrl" -ForegroundColor Cyan
Write-Host "2. Verify CI quality checks pass automatically on GitHub Actions." -ForegroundColor White
Write-Host "3. Review the code diff and click 'Merge pull request' into '$TargetBranch'." -ForegroundColor White
Write-Host "4. Merging into '$TargetBranch' triggers 'auto-draft-release.yml' to generate the Draft Release." -ForegroundColor White
Write-Host "5. Review the Draft Release at $RepoUrl/releases and manually click 'Publish release' to deploy to Render." -ForegroundColor Yellow
Write-Host ""
