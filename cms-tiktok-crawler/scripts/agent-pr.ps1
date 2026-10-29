<#
.SYNOPSIS
    Automates task & release branch pushing, verification, and Pull Request preparation for AI Agents adhering to AGENTS.md.

.DESCRIPTION
    Allows AI agents to safely:
    1. Validate branch naming and local tests (TypeScript, Pest).
    2. Push branch (e.g. 'feature/TIK-101-avatar', 'fix/TIK-102-parse', 'release/v1.0.0') to remote origin.
    3. Output Pull Request link targeting 'main' with standardized PR template.
    4. STOP and await human code review & merge into 'main' on GitHub.
    5. After human merges into 'main', GitHub Action automatically creates the Draft Release.
    6. Production deployment is triggered ONLY when human user publishes the release on GitHub.

    IMPORTANT: Direct pushing to 'main' is STRICTLY FORBIDDEN. All changes enter 'main' via Pull Request review.

.PARAMETER Action
    'CreatePR' (default) or 'Status'.

.PARAMETER Branch
    The branch name (e.g. 'release/v1.0.0', 'feature/TIK-101-auth', 'fix/TIK-102-parse').

.PARAMETER TargetBranch
    The target branch for the Pull Request. Default is 'main'.

.PARAMETER WorktreeIndex
    Slot index (1-5). Can use alias -Slot.

.PARAMETER Role
    Slot role ('feature', 'fix', 'hotfix', 'refactor', 'release').

.EXAMPLE
    # Push release branch and generate PR link to main
    .\scripts\agent-pr.ps1 -Branch "release/v1.0.0"

    # Push feature branch and generate PR link
    .\scripts\agent-pr.ps1 -Role feature -Branch "feature/TIK-101-proxy-rotation"
#>

param (
    [ValidateSet("CreatePR", "Status")]
    [string]$Action = "CreatePR",

    [string]$Branch = "",

    [string]$TargetBranch = "main",

    [Alias("Slot")]
    [ValidateRange(0, 5)]
    [int]$WorktreeIndex = 0,

    [ValidateSet("feature", "fix", "hotfix", "refactor", "test", "release", "docs", "chore", "ci", "")]
    [string]$Role = ""
)

$ErrorActionPreference = "Stop"

# Slot resolution
if ($Role) {
    switch ($Role.ToLower()) {
        "feature"  { $WorktreeIndex = 1 }
        "fix"      { $WorktreeIndex = 2 }
        "hotfix"   { $WorktreeIndex = 3 }
        "refactor" { $WorktreeIndex = 4 }
        "test"     { $WorktreeIndex = 4 }
        "release"  { $WorktreeIndex = 5 }
        "docs"     { $WorktreeIndex = 5 }
        "chore"    { $WorktreeIndex = 5 }
        "ci"       { $WorktreeIndex = 5 }
    }
}
if ($WorktreeIndex -eq 0) {
    $WorktreeIndex = 1
}

# Detect Git Root dynamically
try {
    $GitCommonDir = (git rev-parse --git-common-dir 2>$null).Trim()
    if ($GitCommonDir) {
        if (-not [System.IO.Path]::IsPathRooted($GitCommonDir)) {
            $GitCommonDir = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $GitCommonDir))
        }
        $GitRoot = (Resolve-Path "$GitCommonDir\..").Path
    } else {
        $GitRoot = (git rev-parse --show-toplevel 2>$null).Trim()
    }
} catch {
    $GitRoot = ""
}

if (-not $GitRoot -or -not (Test-Path $GitRoot)) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $GitRoot = (Resolve-Path "$ScriptDir\..").Path
}

$RepoName = Split-Path -Leaf $GitRoot
$ParentDir = Split-Path -Parent $GitRoot
$TargetWorktreePath = "$ParentDir\$RepoName-worktree-$WorktreeIndex"

# Determine active working path
$WorkingPath = if (Test-Path "$TargetWorktreePath") { "$TargetWorktreePath" } else { (Get-Location).Path }

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

$cmsDir = "$GitRoot\cms-tiktok-crawler"
if (-not (Test-Path $cmsDir)) {
    $cmsDir = "$WorkingPath\cms-tiktok-crawler"
}

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
Write-Host " Latest Commit : $lastCommit" -ForegroundColor White
Write-Host " Source Branch : $Branch" -ForegroundColor Yellow
Write-Host " Target Branch : $TargetBranch" -ForegroundColor Yellow
Write-Host " PR URL        : $PrUrl" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Green

Write-Host "[Next Steps - Human Review & Release Lifecycle]" -ForegroundColor Yellow
Write-Host "1. Open the PR link: $PrUrl" -ForegroundColor Cyan
Write-Host "2. Verify CI quality checks pass automatically on GitHub Actions." -ForegroundColor White
Write-Host "3. Review the code diff and click 'Merge pull request' into '$TargetBranch'." -ForegroundColor White
Write-Host "4. Merging into '$TargetBranch' triggers 'auto-draft-release.yml' to generate a Draft Release." -ForegroundColor White
Write-Host "5. [RELEASE GATE] Review Draft Release at $RepoUrl/releases and manually click 'Publish release' to deploy to Render." -ForegroundColor Yellow
Write-Host ""
