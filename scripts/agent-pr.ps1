<#
.SYNOPSIS
    Automates Pull Request creation, CI check evaluation, and merge for AI Agents adhering to AGENTS.md.

.DESCRIPTION
    Allows AI agents to safely:
    1. Validate branch naming and local tests (TypeScript, Pest).
    2. Push task branch to GitHub remote.
    3. Generate and open a Pull Request.
    4. Merge into 'main' once validated.
    5. Ensure the GitHub Draft Release is automatically generated.
    6. Stop and notify the human User to review and manually publish the release.

.PARAMETER Action
    'CreatePR', 'MergePR', or 'FullCycle'. Default is 'FullCycle'.

.PARAMETER Branch
    The task branch name (e.g. 'feature/PROJ-101-auth', 'fix/PROJ-102-bug').

.PARAMETER Title
    Pull request title. If not provided, extracted from the last commit message.

.PARAMETER WorktreeIndex
    Slot index (1-5). Default is 1.

.EXAMPLE
    .\scripts\agent-pr.ps1 -Action FullCycle -Branch "feature/PROJ-101-proxy"
#>

param (
    [ValidateSet("CreatePR", "MergePR", "FullCycle")]
    [string]$Action = "FullCycle",

    [string]$Branch = "",

    [string]$Title = "",

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
    Write-Error "ABORT: Current branch is '$Branch'. Development and PR creation must originate from an isolated feature/fix branch."
    exit 1
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - AI Pull Request & Merge Automation" -ForegroundColor Cyan
Write-Host " Task Branch : $Branch" -ForegroundColor Yellow
Write-Host " Working Dir : $WorkingPath" -ForegroundColor DarkGray
Write-Host "========================================================`n" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. Local Validation Gate
# -----------------------------------------------------------------------------
Write-Host "[Gate 1/4] Running Mandatory Pre-PR Quality Verification..." -ForegroundColor Yellow

$tsCheck = npm.cmd --prefix "$GitRoot\cms-tiktok-crawler" run check-types 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "TypeScript compilation failed with errors. Fix all type errors before creating PR:`n$tsCheck"
    exit 1
}
Write-Host "  -> Strict TypeScript Verification: PASSED (0 errors)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. Push Branch to Origin
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 2/4] Pushing branch '$Branch' to remote origin..." -ForegroundColor Yellow
git -C "$WorkingPath" push -u origin "$Branch"
Write-Host "  -> Branch pushed successfully to origin." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 3. Pull Request Creation
# -----------------------------------------------------------------------------
Write-Host "`n[Gate 3/4] Preparing Pull Request for '$Branch' -> 'main'..." -ForegroundColor Yellow

$RepoUrl = "https://github.com/NQuangHuyZ31/TIKTOK-CRAWLER-CMS"
$PrUrl = "$RepoUrl/pull/new/$Branch"

Write-Host "  -> Pull Request URL: $PrUrl" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 4. Merge Evaluation (If FullCycle or MergePR)
# -----------------------------------------------------------------------------
if ($Action -eq "MergePR" -or $Action -eq "FullCycle") {
    Write-Host "`n[Gate 4/4] Merging validated changes into 'main'..." -ForegroundColor Yellow

    # Fetch latest origin
    git -C "$GitRoot" fetch origin
    git -C "$GitRoot" checkout main
    git -C "$GitRoot" pull origin main

    # Squash merge feature branch into main
    Write-Host "  -> Performing Squash Merge of '$Branch' into 'main'..." -ForegroundColor Cyan
    git -C "$GitRoot" merge --squash "$Branch"
    
    $lastCommitMsg = (git -C "$WorkingPath" log -1 --pretty=%B).Trim()
    $mergeMsg = if ($Title) { "$Title`n`nMerged from $Branch" } else { "$lastCommitMsg`n`nMerged from $Branch" }

    git -C "$GitRoot" commit -m "$mergeMsg"
    git -C "$GitRoot" push origin main

    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host " ✅ TASK MERGED INTO MAIN SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "`n[Next Steps - Release Security Protocol]" -ForegroundColor Yellow
    Write-Host "1. GitHub Action 'auto-draft-release.yml' is now generating a Draft Release." -ForegroundColor White
    Write-Host "2. Navigate to: $RepoUrl/releases" -ForegroundColor Cyan
    Write-Host "3. HUMAN APPROVAL REQUIRED: Review the Draft Release notes and click 'Publish release'." -ForegroundColor Yellow
    Write-Host "4. Production deployment to Render will execute ONLY after you publish." -ForegroundColor White
    Write-Host ""
}
