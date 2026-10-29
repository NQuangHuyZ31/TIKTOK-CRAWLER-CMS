<#
.SYNOPSIS
    Standardized Git Worktree Manager for AI Agents and Developers adhering to AGENTS.md.

.DESCRIPTION
    Enforces worktree isolation so that the root workspace remains strictly an idle anchor tracking 'main'.
    AI Agents are assigned to dedicated worktree slots based on task category:
      - Slot 1 (Role: feature)  : New product features and capabilities (branch prefix: feature/)
      - Slot 2 (Role: fix)      : Bug fixes, defects, error corrections (branch prefix: fix/)
      - Slot 3 (Role: hotfix)   : Critical production hotfixes (branch prefix: hotfix/)
      - Slot 4 (Role: refactor) : Code refactoring, optimization, test automation (branch prefixes: refactor/, test/)
      - Slot 5 (Role: release)  : Release candidates, documentation, chore maintenance (branch prefixes: release/, docs/, chore/, ci/)

.PARAMETER Action
    Operation to perform: 'Switch' (default), 'List', 'Status', or 'Clean'.

.PARAMETER WorktreeIndex
    The index of the worktree slot (1 to 5). Can be used interchangeably with -Role.

.PARAMETER Role
    Dedicated role for the slot: 'feature', 'fix', 'hotfix', 'refactor', 'test', 'release', 'docs', 'chore', 'ci'.

.PARAMETER Branch
    The target branch name (e.g., feature/TIK-101-profile-ingest, fix/TIK-102-null-pointer, release/v1.0.0).

.PARAMETER CreateBranch
    If specified, creates a new branch off BaseBranch.

.PARAMETER BaseBranch
    Base branch to branch from (default: 'main').

.EXAMPLE
    # List all worktree slots with designated roles
    .\scripts\agent-worktree.ps1 -Action List

    # Switch to Feature worktree (Slot 1) and create branch
    .\scripts\agent-worktree.ps1 -Role feature -Branch "feature/TIK-101-avatar-sync" -CreateBranch

    # Switch to Fix worktree (Slot 2)
    .\scripts\agent-worktree.ps1 -Role fix -Branch "fix/TIK-102-parse-error" -CreateBranch

    # Reset a worktree slot to idle state after PR merge
    .\scripts\agent-worktree.ps1 -Action Clean -Slot 1
#>

param (
    [ValidateSet("Switch", "List", "Status", "Clean")]
    [string]$Action = "Switch",

    [Alias("Slot")]
    [ValidateRange(0, 5)]
    [int]$WorktreeIndex = 0,

    [ValidateSet("feature", "fix", "bugfix", "hotfix", "refactor", "test", "release", "docs", "chore", "ci", "")]
    [string]$Role = "",

    [string]$Branch = "",

    [switch]$CreateBranch,

    [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"

# Slot Definitions & Role Matrix
$SlotDefinitions = @{
    1 = @{
        Role                = "feature"
        Title               = "Feature Development"
        AllowedPrefixes     = @("feature")
        Desc                = "New product features & capability expansion"
        DefaultBranchPrefix = "feature"
        Laravel             = 8010
        Vite                = 5181
    }
    2 = @{
        Role                = "fix"
        Title               = "Bug Fix & Patching"
        AllowedPrefixes     = @("fix")
        Desc                = "Defect repairs, issue resolution, bug fixes"
        DefaultBranchPrefix = "fix"
        Laravel             = 8020
        Vite                = 5182
    }
    3 = @{
        Role                = "hotfix"
        Title               = "Production Hotfix"
        AllowedPrefixes     = @("hotfix")
        Desc                = "Emergency production fixes & critical security patches"
        DefaultBranchPrefix = "hotfix"
        Laravel             = 8030
        Vite                = 5183
    }
    4 = @{
        Role                = "refactor"
        Title               = "Refactor & Testing"
        AllowedPrefixes     = @("refactor", "test")
        Desc                = "Code refactoring, optimization, unit & e2e testing"
        DefaultBranchPrefix = "refactor"
        Laravel             = 8040
        Vite                = 5184
    }
    5 = @{
        Role                = "release"
        Title               = "Release & Maintenance"
        AllowedPrefixes     = @("release", "chore", "docs", "ci")
        Desc                = "Release candidate packaging, documentation, dependencies"
        DefaultBranchPrefix = "release"
        Laravel             = 8050
        Vite                = 5185
    }
}

# Resolve Slot index and Role

if ($Role) {
    switch ($Role.ToLower()) {
        "feature"  { $WorktreeIndex = 1; $Role = "feature" }
        "fix"      { $WorktreeIndex = 2; $Role = "fix" }
        "bugfix"   { $WorktreeIndex = 2; $Role = "fix" }
        "hotfix"   { $WorktreeIndex = 3; $Role = "hotfix" }
        "refactor" { $WorktreeIndex = 4; $Role = "refactor" }
        "test"     { $WorktreeIndex = 4; $Role = "test" }
        "release"  { $WorktreeIndex = 5; $Role = "release" }
        "docs"     { $WorktreeIndex = 5; $Role = "docs" }
        "chore"    { $WorktreeIndex = 5; $Role = "chore" }
        "ci"       { $WorktreeIndex = 5; $Role = "ci" }
    }
} elseif ($WorktreeIndex -gt 0) {
    $Role = $SlotDefinitions[$WorktreeIndex].Role
} else {
    $WorktreeIndex = 1
    $Role = "feature"
}

# Detect Git Repository Anchor Root dynamically
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

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - AI Worktree & Role Concurrency Manager" -ForegroundColor Cyan
Write-Host " Root Anchor Repository : $GitRoot" -ForegroundColor DarkGray
Write-Host " Assigned Worktree Slot : Slot $WorktreeIndex [$($SlotDefinitions[$WorktreeIndex].Title)]" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# ACTION: LIST
# -----------------------------------------------------------------------------
if ($Action -eq "List") {
    Write-Host "`n[Worktree Registry & Status]" -ForegroundColor Yellow
    git -C "$GitRoot" worktree list

    Write-Host "`n[Dedicated Slot Role Mapping Matrix]" -ForegroundColor Cyan
    for ($i = 1; $i -le 5; $i++) {
        $slotMeta = $SlotDefinitions[$i]
        $path = "$ParentDir\$RepoName-worktree-$i"
        $exists = Test-Path $path
        $statusStr = if ($exists) { "[ACTIVE]" } else { "[AVAILABLE]" }
        $color = if ($exists) { "Green" } else { "DarkGray" }
        $currBranch = if ($exists) { (git -C "$path" rev-parse --abbrev-ref HEAD 2>$null) } else { "none" }
        $allowed = ($slotMeta.AllowedPrefixes | ForEach-Object { "$_/*" }) -join ", "
        
        Write-Host " Slot $i [$($slotMeta.Role.ToUpper())] : $path" -ForegroundColor $color
        Write-Host "         Purpose : $($slotMeta.Title) - $($slotMeta.Desc)" -ForegroundColor White
        Write-Host "         Allowed : $allowed" -ForegroundColor Yellow
        Write-Host "         Status  : $statusStr | Branch: $currBranch | Ports: Laravel $($slotMeta.Laravel), Vite $($slotMeta.Vite)" -ForegroundColor DarkGray
    }
    Write-Host ""
    exit 0
}

# -----------------------------------------------------------------------------
# ACTION: STATUS
# -----------------------------------------------------------------------------
if ($Action -eq "Status") {
    Write-Host "`n[Inspecting Status Across All Worktree Slots]" -ForegroundColor Yellow
    for ($i = 1; $i -le 5; $i++) {
        $path = "$ParentDir\$RepoName-worktree-$i"
        $slotMeta = $SlotDefinitions[$i]
        if (Test-Path $path) {
            $currBranch = (git -C "$path" rev-parse --abbrev-ref HEAD 2>$null)
            Write-Host "`n--- Slot $($i) [$($slotMeta.Role.ToUpper())]: $RepoName-worktree-$i ($currBranch) ---" -ForegroundColor Cyan
            git -C "$path" status --short
        } else {
            Write-Host "`n--- Slot $($i) [$($slotMeta.Role.ToUpper())]: $RepoName-worktree-$i [NOT INITIALIZED] ---" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
    exit 0
}

# -----------------------------------------------------------------------------
# ACTION: CLEAN
# -----------------------------------------------------------------------------
if ($Action -eq "Clean") {
    Write-Host "`n[Clean & Reset Worktree Slot $WorktreeIndex - $($SlotDefinitions[$WorktreeIndex].Title)]" -ForegroundColor Yellow
    if (-not (Test-Path "$TargetWorktreePath")) {
        Write-Host "Worktree slot $WorktreeIndex does not exist on disk ($TargetWorktreePath)." -ForegroundColor DarkGray
        exit 0
    }

    # Safety check: Verify no uncommitted changes
    $uncommitted = git -C "$TargetWorktreePath" status --porcelain
    if ($uncommitted) {
        Write-Error "ABORT: Worktree slot $WorktreeIndex has uncommitted modifications! Commit or stash them before cleaning:`n$uncommitted"
        exit 1
    }

    $currentBranch = (git -C "$TargetWorktreePath" rev-parse --abbrev-ref HEAD 2>$null).Trim()
    $idleBranch = "worktree-$WorktreeIndex-$($SlotDefinitions[$WorktreeIndex].Role)"

    Write-Host "[Safety Check Passed] No uncommitted changes in slot $WorktreeIndex." -ForegroundColor Green
    Write-Host "Switching slot $WorktreeIndex back to idle tracking branch '$idleBranch'..." -ForegroundColor Cyan

    try { git -C "$GitRoot" fetch origin 2>$null } catch { }
    
    $idleExists = git -C "$TargetWorktreePath" branch --list $idleBranch
    if ($idleExists) {
        git -C "$TargetWorktreePath" checkout $idleBranch
        git -C "$TargetWorktreePath" reset --hard origin/main
    } else {
        git -C "$TargetWorktreePath" checkout -B $idleBranch origin/main
    }

    if ($currentBranch -ne $idleBranch -and $currentBranch -ne "main") {
        Write-Host "[Branch Notice] Previous branch was '$currentBranch'." -ForegroundColor Yellow
        Write-Host "To safely delete the local branch after PR merge, run:" -ForegroundColor White
        Write-Host "  git -C `"$GitRoot`" branch -d $currentBranch" -ForegroundColor DarkGray
    }

    Write-Host "`n[Slot $WorktreeIndex Ready & Idle]" -ForegroundColor Green
    exit 0
}

# -----------------------------------------------------------------------------
# ACTION: SWITCH / INITIALIZE
# -----------------------------------------------------------------------------
$slotMeta = $SlotDefinitions[$WorktreeIndex]

if (-not $Branch) {
    $Branch = "worktree-$WorktreeIndex-$($slotMeta.Role)"
}

# Branch naming check
$standardPattern = "^(feature|fix|hotfix|release|refactor|test|docs|chore|ci)(/[a-zA-Z0-9._-]+)?$"
$isIdleBranch = ($Branch -match "^worktree-[1-5]-.*$") -or ($Branch -match "^worktree-[1-5]$") -or ($Branch -eq "main") -or ($Branch -eq "develop")

if (-not $isIdleBranch -and ($Branch -notmatch $standardPattern)) {
    Write-Warning "Branch '$Branch' does NOT follow the standard naming convention:`n  <type>/<task-id>-<description> (e.g., feature/TIK-101-auth-flow)`nAllowed types: feature, fix, hotfix, release, refactor, test, docs, chore, ci"
}

# Slot role prefix alignment check
if (-not $isIdleBranch) {
    $matchedPrefix = $false
    foreach ($p in $slotMeta.AllowedPrefixes) {
        if ($Branch -like "$p/*" -or $Branch -eq "$p") {
            $matchedPrefix = $true
            break
        }
    }
    if (-not $matchedPrefix) {
        Write-Warning "Branch '$Branch' does not align with Slot $WorktreeIndex designated role [$($slotMeta.Role.ToUpper())]!`n  Designated prefixes: $($slotMeta.AllowedPrefixes -join ', ')/"
    }
}

if ($Branch -eq "main") {
    Write-Warning "Working directly on 'main' is strictly forbidden by AGENTS.md. Use a task branch instead."
}

Write-Host " Target Slot     : Slot $WorktreeIndex [$($slotMeta.Title)]" -ForegroundColor Yellow
Write-Host " Target Branch   : $Branch" -ForegroundColor Yellow
Write-Host " Worktree Path   : $TargetWorktreePath" -ForegroundColor DarkGray
Write-Host " Allocated Ports : Laravel=$($slotMeta.Laravel) | Vite Dev=$($slotMeta.Vite)" -ForegroundColor DarkGray

$worktreeExists = Test-Path "$TargetWorktreePath"

if (-not $worktreeExists) {
    Write-Host "`n[Worktree] Initializing new worktree slot at: $TargetWorktreePath..." -ForegroundColor Green
    try { git -C "$GitRoot" fetch origin 2>$null } catch { }

    if ($CreateBranch) {
        git -C "$GitRoot" worktree add -b $Branch "$TargetWorktreePath" "origin/$BaseBranch"
    } else {
        $branchExists = git -C "$GitRoot" branch --list $Branch
        if ($branchExists) {
            git -C "$GitRoot" worktree add "$TargetWorktreePath" $Branch
        } else {
            git -C "$GitRoot" worktree add -b $Branch "$TargetWorktreePath" "origin/$BaseBranch"
        }
    }
} else {
    $uncommitted = git -C "$TargetWorktreePath" status --porcelain
    if ($uncommitted) {
        Write-Error "ABORT: Worktree slot $WorktreeIndex has uncommitted changes! Commit or stash them before switching:`n$uncommitted"
        exit 1
    }

    Write-Host "`n[Worktree] Switching slot $WorktreeIndex to branch '$Branch'..." -ForegroundColor Green
    try { git -C "$GitRoot" fetch origin 2>$null } catch { }

    if ($CreateBranch) {
        git -C "$TargetWorktreePath" checkout -B $Branch "origin/$BaseBranch"
    } else {
        git -C "$TargetWorktreePath" checkout $Branch
    }
}

Write-Host "`n[Worktree Status] $RepoName-worktree-$($WorktreeIndex) [$($slotMeta.Role.ToUpper())]:" -ForegroundColor Cyan
git -C "$TargetWorktreePath" status --short

Write-Host "`n[Next Steps for Agent/Developer]" -ForegroundColor Yellow
Write-Host "1. Navigate to module workspace:" -ForegroundColor White
Write-Host "   cd `"$TargetWorktreePath\cms-tiktok-crawler`"" -ForegroundColor Green
Write-Host "2. Develop and run validation checks:" -ForegroundColor White
Write-Host "   npm.cmd run check-types" -ForegroundColor Green
Write-Host "   php artisan test" -ForegroundColor Green
Write-Host "3. Commit changes (English, Conventional Commits):" -ForegroundColor White
Write-Host "   git commit -m `"$($slotMeta.DefaultBranchPrefix)(scope): concise explanation`"" -ForegroundColor Green
Write-Host "4. Push branch and open Pull Request (Never push directly to main):" -ForegroundColor White
Write-Host "   git push -u origin $Branch" -ForegroundColor Green
Write-Host "5. Create PR via script:" -ForegroundColor White
Write-Host "   .\scripts\agent-pr.ps1 -Branch `"$Branch`"" -ForegroundColor Green
Write-Host ""
