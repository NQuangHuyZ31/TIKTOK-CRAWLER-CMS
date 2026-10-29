<#
.SYNOPSIS
    Automated Verification Suite for DevOps, CI/CD, Worktree, and Release Workflows.

.DESCRIPTION
    Validates all critical requirements:
    1. Branch naming convention regex matching
    2. Conventional Commits format validation
    3. Worktree Role Matrix & manager script execution
    4. Workflow YAML integrity and release-only deployment gate triggers
    5. TypeScript & backend quality gate definitions
#>

$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - Workflow Automated Test Suite" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

function Assert-Test([string]$name, [bool]$condition, [string]$details = "") {
    $global:TotalTests++
    if ($condition) {
        $global:PassedTests++
        Write-Host "  [PASS] $name" -ForegroundColor Green
    } else {
        $global:FailedTests++
        Write-Host "  [FAIL] $name - $details" -ForegroundColor Red
    }
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

# -----------------------------------------------------------------------------
# 1. Branch Naming Regex Validation
# -----------------------------------------------------------------------------
Write-Host "--- Test Suite 1: Branch Naming Convention ---" -ForegroundColor Yellow
$branchPattern = "^(feature|fix|hotfix|release|refactor|test|docs|chore|ci)(/[a-zA-Z0-9._-]+)?$"

Assert-Test "Valid short fix branch 'fix'" `
    ("fix" -match $branchPattern)

Assert-Test "Valid short feature branch 'feature'" `
    ("feature" -match $branchPattern)

Assert-Test "Valid short refactor branch 'refactor'" `
    ("refactor" -match $branchPattern)

Assert-Test "Valid feature branch 'feature/TIK-101-proxy-rotation'" `
    ("feature/TIK-101-proxy-rotation" -match $branchPattern)

Assert-Test "Valid release branch 'release/v1.0.0'" `
    ("release/v1.0.0" -match $branchPattern)

Assert-Test "Valid fix branch 'fix/TIK-102-null-id'" `
    ("fix/TIK-102-null-id" -match $branchPattern)

Assert-Test "Valid hotfix branch 'hotfix/SEC-999-token-leak'" `
    ("hotfix/SEC-999-token-leak" -match $branchPattern)

Assert-Test "Valid refactor branch 'refactor/clean-routes'" `
    ("refactor/clean-routes" -match $branchPattern)

Assert-Test "Valid chore branch 'chore/release-v1.1.0'" `
    ("chore/release-v1.1.0" -match $branchPattern)

Assert-Test "Invalid branch 'random_dev_branch' is rejected" `
    (-not ("random_dev_branch" -match $branchPattern))

Assert-Test "Direct 'main' is rejected for active task dev" `
    (-not ("main" -match $branchPattern))

# -----------------------------------------------------------------------------
# 2. Conventional Commits Format Validation
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 2: Conventional Commits Validation ---" -ForegroundColor Yellow
$commitPattern = "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9._-]+\))?:\s.+$"

Assert-Test "Valid commit 'feat(crawler): implement retry backoff'" `
    ("feat(crawler): implement retry backoff" -match $commitPattern)

Assert-Test "Valid release commit 'chore(release): bump version to 1.1.0'" `
    ("chore(release): bump version to 1.1.0" -match $commitPattern)

Assert-Test "Valid fix commit 'fix: prevent null pointer on missing author'" `
    ("fix: prevent null pointer on missing author" -match $commitPattern)

Assert-Test "Invalid commit 'updated code and fixed bugs' is rejected" `
    (-not ("updated code and fixed bugs" -match $commitPattern))

# -----------------------------------------------------------------------------
# 3. Worktree Role Matrix & Manager Script Execution
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 3: Worktree Manager & Role Mapping ---" -ForegroundColor Yellow

$worktreeScript = Join-Path $PSScriptRoot "agent-worktree.ps1"
if (-not (Test-Path $worktreeScript)) {
    $worktreeScript = "$GitRoot\scripts\agent-worktree.ps1"
}
Assert-Test "agent-worktree.ps1 exists" (Test-Path $worktreeScript)

try {
    $listOutput = (powershell -ExecutionPolicy Bypass -File $worktreeScript -Action List 2>&1 | Out-String)
    $listSuccess = [bool]($listOutput -match "Dedicated Slot Role Mapping Matrix")
    Assert-Test "agent-worktree.ps1 -Action List executes cleanly" $listSuccess

    # Check that all 5 dedicated roles are registered
    Assert-Test "Slot 1 is mapped to FEATURE (feature/*)" ($listOutput -match "Slot 1 \[FEATURE\]")
    Assert-Test "Slot 2 is mapped to FIX (fix/*)" ($listOutput -match "Slot 2 \[FIX\]")
    Assert-Test "Slot 3 is mapped to HOTFIX (hotfix/*)" ($listOutput -match "Slot 3 \[HOTFIX\]")
    Assert-Test "Slot 4 is mapped to REFACTOR (refactor/*, test/*)" ($listOutput -match "Slot 4 \[REFACTOR\]")
    Assert-Test "Slot 5 is mapped to RELEASE (release/*, chore/*, docs/*, ci/*)" ($listOutput -match "Slot 5 \[RELEASE\]")
} catch {
    Assert-Test "agent-worktree.ps1 execution test" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 4. CI/CD Workflow Gate & Release-Only Deployment Trigger Safety
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 4: Workflow Gate & Trigger Safety ---" -ForegroundColor Yellow

# Look for workflows in current workspace or GitRoot
$workflowsDir = Join-Path $PSScriptRoot "..\.github\workflows"
if (-not (Test-Path $workflowsDir)) {
    $workflowsDir = "$GitRoot\.github\workflows"
}

$ciPath = Join-Path $workflowsDir "ci.yml"
$draftPath = Join-Path $workflowsDir "auto-draft-release.yml"
$deployPath = Join-Path $workflowsDir "deploy.yml"
$releasePath = Join-Path $workflowsDir "release.yml"

Assert-Test "ci.yml exists" (Test-Path $ciPath)
Assert-Test "auto-draft-release.yml exists" (Test-Path $draftPath)
Assert-Test "deploy.yml exists" (Test-Path $deployPath)
Assert-Test "release.yml exists" (Test-Path $releasePath)

if (Test-Path $deployPath) {
    $deployContent = Get-Content $deployPath -Raw
    
    # Invariant: deploy.yml MUST NOT deploy on direct push to main or pull_request
    $hasUncontrolledPush = $deployContent -match "push:\s*branches:\s*-\s*main"
    $hasPullRequestTrigger = $deployContent -match "pull_request:"
    Assert-Test "deploy.yml does NOT trigger on direct push to main" (-not $hasUncontrolledPush)
    Assert-Test "deploy.yml does NOT trigger on pull_request" (-not $hasPullRequestTrigger)

    # Invariant: deploy.yml triggers only on published release or manual dispatch
    $hasPublishedReleaseTrigger = $deployContent -match "release:\s*types:\s*\[published\]"
    Assert-Test "deploy.yml triggers on published release" $hasPublishedReleaseTrigger

    # Invariant: deploy.yml contains post-deploy health check
    $hasHealthCheck = $deployContent -match "/api/health"
    Assert-Test "deploy.yml executes /api/health probe" $hasHealthCheck

    # Invariant: deploy.yml contains rollback guidance
    $hasRollback = $deployContent -match "ROLLBACK INSTRUCTIONS"
    Assert-Test "deploy.yml includes explicit rollback instructions" $hasRollback
}

if (Test-Path $draftPath) {
    $draftContent = Get-Content $draftPath -Raw
    # Invariant: Draft release has draft: true so it never triggers deployment
    $hasDraftTrue = $draftContent -match "draft:\s*true"
    Assert-Test "auto-draft-release.yml sets draft: true (no accidental deployment)" $hasDraftTrue
}

# -----------------------------------------------------------------------------
# 5. Local Quality Gates (TypeScript & Backend Tests)
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 5: Quality Check Structure ---" -ForegroundColor Yellow

$cmsDir = Join-Path $PSScriptRoot "..\cms-tiktok-crawler"
if (-not (Test-Path $cmsDir)) {
    $cmsDir = "$GitRoot\cms-tiktok-crawler"
}

# TypeScript script config
$pkgPath = Join-Path $cmsDir "package.json"
if (Test-Path $pkgPath) {
    $pkgJson = Get-Content $pkgPath -Raw
    Assert-Test "cms-tiktok-crawler/package.json contains check-types script" ($pkgJson -match '"check-types"')
} else {
    Assert-Test "cms-tiktok-crawler/package.json exists" $false
}

# If node_modules installed, run check-types
if (Test-Path "$cmsDir\node_modules") {
    try {
        $tsOutput = npm.cmd --prefix "$cmsDir" run check-types 2>&1
        $tsSuccess = ($LASTEXITCODE -eq 0)
        Assert-Test "npm.cmd run check-types (0 compilation errors)" $tsSuccess
    } catch {
        Assert-Test "npm.cmd run check-types" $false $_.Exception.Message
    }
} else {
    Assert-Test "TypeScript configuration tsconfig.json exists" (Test-Path "$cmsDir\tsconfig.json")
}

# Backend routes / controllers
Assert-Test "Backend Core Module routes exist" (Test-Path "$cmsDir\Modules\Core\routes\web.php")

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " Verification Summary: $PassedTests / $TotalTests Passed ($FailedTests Failed)" -ForegroundColor $(if ($FailedTests -eq 0) { "Green" } else { "Red" })
Write-Host "========================================================`n" -ForegroundColor Cyan

if ($FailedTests -gt 0) {
    exit 1
} else {
    exit 0
}
