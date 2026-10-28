<#
.SYNOPSIS
    Automated Verification Suite for DevOps, CI/CD, Worktree, and Release Workflows.

.DESCRIPTION
    Validates all critical requirements from the MASTER PROMPT:
    1. Branch naming convention regex matching
    2. Conventional Commits format validation
    3. Workflow YAML integrity and deployment gate triggers
    4. TypeScript check execution
    5. Backend Pest/PHPUnit test suite execution
    6. Health check route contract verification
    7. Worktree manager script listing and slot inspection
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

# -----------------------------------------------------------------------------
# 1. Branch Naming Regex Validation
# -----------------------------------------------------------------------------
Write-Host "--- Test Suite 1: Branch Naming Convention ---" -ForegroundColor Yellow
$branchPattern = "^(feature|fix|hotfix|refactor|test|docs|chore|ci)/[a-zA-Z0-9._-]+$"

Assert-Test "Valid feature branch 'feature/PROJ-101-proxy-rotation'" `
    ("feature/PROJ-101-proxy-rotation" -match $branchPattern)

Assert-Test "Valid fix branch 'fix/PROJ-102-null-id'" `
    ("fix/PROJ-102-null-id" -match $branchPattern)

Assert-Test "Valid hotfix branch 'hotfix/SEC-999-token-leak'" `
    ("hotfix/SEC-999-token-leak" -match $branchPattern)

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
# 3. CI/CD Workflow Gate & Security Integrity
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 3: Workflow Gate & Trigger Safety ---" -ForegroundColor Yellow

$ciPath = "E:\Urekamedia\project1\.github\workflows\ci.yml"
$draftPath = "E:\Urekamedia\project1\.github\workflows\auto-draft-release.yml"
$deployPath = "E:\Urekamedia\project1\.github\workflows\deploy.yml"

Assert-Test "ci.yml exists" (Test-Path $ciPath)
Assert-Test "auto-draft-release.yml exists" (Test-Path $draftPath)
Assert-Test "deploy.yml exists" (Test-Path $deployPath)

if (Test-Path $deployPath) {
    $deployContent = Get-Content $deployPath -Raw
    
    # Invariant: deploy.yml MUST NOT deploy on push to main or pull_request
    $hasUncontrolledPush = $deployContent -match "push:\s*branches:\s*-\s*main"
    Assert-Test "deploy.yml does NOT trigger on direct push to main" (-not $hasUncontrolledPush)

    # Invariant: deploy.yml triggers on published release
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
    # Invariant: Draft release has draft: true
    $hasDraftTrue = $draftContent -match "draft:\s*true"
    Assert-Test "auto-draft-release.yml sets draft: true (no accidental deployment)" $hasDraftTrue
}

# -----------------------------------------------------------------------------
# 4. Worktree Manager Script Execution
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 4: Worktree Script Functionality ---" -ForegroundColor Yellow
$worktreeScript = "E:\Urekamedia\project1\scripts\agent-worktree.ps1"
Assert-Test "agent-worktree.ps1 exists at root" (Test-Path $worktreeScript)

try {
    $listOutput = (powershell -ExecutionPolicy Bypass -File $worktreeScript -Action List 2>&1 | Out-String)
    $listSuccess = [bool]($listOutput -match "Persistent Slot Mapping")
    Assert-Test "agent-worktree.ps1 -Action List executes cleanly" $listSuccess
} catch {
    Assert-Test "agent-worktree.ps1 -Action List executes cleanly" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 5. Local Quality Gates (TypeScript & Backend Tests)
# -----------------------------------------------------------------------------
Write-Host "`n--- Test Suite 5: Local Quality Checks ---" -ForegroundColor Yellow

# TypeScript
try {
    $tsOutput = npm.cmd run check-types 2>&1
    $tsSuccess = ($LASTEXITCODE -eq 0)
    Assert-Test "npm.cmd run check-types (0 compilation errors)" $tsSuccess
} catch {
    Assert-Test "npm.cmd run check-types (0 compilation errors)" $false $_.Exception.Message
}

# Backend Tests
try {
    $phpTestOutput = php artisan test --filter CoreDynamicRoutingTest 2>&1
    $phpSuccess = ($LASTEXITCODE -eq 0)
    Assert-Test "php artisan test --filter CoreDynamicRoutingTest passes 100%" $phpSuccess
} catch {
    Assert-Test "php artisan test passes 100%" $false $_.Exception.Message
}

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
