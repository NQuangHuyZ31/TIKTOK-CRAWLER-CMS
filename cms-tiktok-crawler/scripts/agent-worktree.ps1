<#
.SYNOPSIS
    Standardized Git Worktree Manager for AI Agents and Developers adhering to AGENTS.md.

.DESCRIPTION
    Enforces worktree isolation so that the root workspace (E:\Urekamedia\project1) remains
    strictly an idle anchor tracking 'main'. All development, testing, and commits occur inside
    isolated persistent worktrees (project1-worktree-1 through project1-worktree-5).

.PARAMETER Action
    Operation to perform: 'Switch' (default), 'List', 'Status', or 'Clean'.

.PARAMETER WorktreeIndex
    The index of the worktree slot (1 to 5). Default is 1.

.PARAMETER Branch
    The target branch name. Must follow:
    - feature/<task-id>-<description>
    - fix/<task-id>-<description>
    - hotfix/<task-id>-<description>
    - refactor/<task-id>-<description>
    - test/<task-id>-<description>
    - docs/<task-id>-<description>
    - chore/<task-id>-<description>
    - ci/<task-id>-<description>

.PARAMETER CreateBranch
    If specified, creates a new branch off BaseBranch.

.PARAMETER BaseBranch
    Base branch to branch from (default: 'main').

.EXAMPLE
    # List all worktrees
    .\scripts\agent-worktree.ps1 -Action List

    # Create a feature branch in worktree 1
    .\scripts\agent-worktree.ps1 -WorktreeIndex 1 -Branch "feature/PROJ-101-auth-flow" -CreateBranch

    # Reset worktree 1 to idle branch after PR merge
    .\scripts\agent-worktree.ps1 -Action Clean -WorktreeIndex 1
#>

param (
    [ValidateSet("Switch", "List", "Status", "Clean")]
    [string]$Action = "Switch",

    [ValidateRange(1, 5)]
    [int]$WorktreeIndex = 1,

    [string]$Branch = "",

    [switch]$CreateBranch,

    [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"

# Detect Git Repository Root
try {
    $GitRoot = (git rev-parse --show-toplevel 2>$null).Trim()
} catch {
    $GitRoot = ""
}

if (-not $GitRoot -or -not (Test-Path $GitRoot)) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $GitRoot = (Resolve-Path "$ScriptDir\..").Path
}

$ParentDir = Split-Path -Parent $GitRoot
$TargetWorktreePath = "$ParentDir\project1-worktree-$WorktreeIndex"

# Port mapping table
$PortMap = @{
    1 = @{ Laravel = 8010; Vite = 5181 }
    2 = @{ Laravel = 8020; Vite = 5182 }
    3 = @{ Laravel = 8030; Vite = 5183 }
    4 = @{ Laravel = 8040; Vite = 5184 }
    5 = @{ Laravel = 8050; Vite = 5185 }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - AI Worktree & Concurrency Manager" -ForegroundColor Cyan
Write-Host " Root Anchor : $GitRoot" -ForegroundColor DarkGray
Write-Host "========================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# ACTION: LIST
# -----------------------------------------------------------------------------
if ($Action -eq "List") {
    Write-Host "`n[Worktree Registry & Status]" -ForegroundColor Yellow
    git -C "$GitRoot" worktree list

    Write-Host "`n[Persistent Slot Mapping]" -ForegroundColor Cyan
    for ($i = 1; $i -5; $i++) {
        $path = "$ParentDir\project1-worktree-$i"
        $exists = Test-Path $path
        $statusStr = if ($exists) { "[ACTIVE]" } else { "[AVAILABLE]" }
        $color = if ($exists) { "Green" } else { "DarkGray" }
        $currBranch = if ($exists) { (git -C "$path" rev-parse --abbrev-ref HEAD 2>$null) } else { "none" }
        
        Write-Host " Slot $i : $path" -ForegroundColor $color
        Write-Host "         Status: $statusStr | Branch: $currBranch | Laravel: $($PortMap[$i].Laravel) | Vite: $($PortMap[$i].Vite)" -ForegroundColor DarkGray
    }
    Write-Host ""
    exit 0
}

# -----------------------------------------------------------------------------
# ACTION: STATUS
# -----------------------------------------------------------------------------
if ($Action -eq "Status") {
    Write-Host "`n[Inspecting Status Across All Worktrees]" -ForegroundColor Yellow
    for ($i = 1; $i -le 5; $i++) {
        $path = "$ParentDir\project1-worktree-$i"
        if (Test-Path $path) {
            $currBranch = (git -C "$path" rev-parse --abbrev-ref HEAD 2>$null)
            Write-Host "`n--- Slot $($i): project1-worktree-$i ($currBranch) ---" -ForegroundColor Cyan
            git -C "$path" status --short
        }
    }
    Write-Host ""
    exit 0
}

# -----------------------------------------------------------------------------
# ACTION: CLEAN
# -----------------------------------------------------------------------------
if ($Action -eq "Clean") {
    Write-Host "`n[Clean & Reset Worktree Slot $WorktreeIndex]" -ForegroundColor Yellow
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
    $idleBranch = "worktree-$WorktreeIndex"

    Write-Host "[Safety Check Passed] No uncommitted changes in slot $WorktreeIndex." -ForegroundColor Green
    Write-Host "Switching slot $WorktreeIndex back to idle tracking branch '$idleBranch'..." -ForegroundColor Cyan

    try { git -C "$GitRoot" fetch origin 2>$null } catch { }
    
    # Check if idle branch exists, or create it tracking origin/main
    $idleExists = git -C "$TargetWorktreePath" branch --list $idleBranch
    if ($idleExists) {
        git -C "$TargetWorktreePath" checkout $idleBranch
        git -C "$TargetWorktreePath" reset --hard origin/main
    } else {
        git -C "$TargetWorktreePath" checkout -B $idleBranch origin/main
    }

    # If the previous branch was a feature/fix branch, offer safe deletion hint
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
if (-not $Branch) {
    $Branch = "worktree-$WorktreeIndex"
}

# Branch naming standard check for active dev branches
$standardPattern = "^(feature|fix|hotfix|refactor|test|docs|chore|ci)/[a-zA-Z0-9._-]+$"
$isIdleBranch = ($Branch -match "^worktree-[1-5]$") -or ($Branch -eq "main") -or ($Branch -eq "develop")

if (-not $isIdleBranch -and ($Branch -notmatch $standardPattern)) {
    Write-Warning "Branch '$Branch' does NOT follow the standard naming convention:`n  <type>/<task-id>-<description> (e.g., feature/PROJ-101-auth-flow)`nAllowed types: feature, fix, hotfix, refactor, test, docs, chore, ci"
}

if ($Branch -eq "main") {
    Write-Warning "Working directly on 'main' is strictly forbidden by AGENTS.md. Use a feature/fix branch instead."
}

Write-Host " Target Worktree : project1-worktree-$WorktreeIndex" -ForegroundColor Yellow
Write-Host " Target Branch   : $Branch" -ForegroundColor Yellow
Write-Host " Path            : $TargetWorktreePath" -ForegroundColor DarkGray
Write-Host " Ports           : Laravel=$($PortMap[$WorktreeIndex].Laravel) | Vite Dev=$($PortMap[$WorktreeIndex].Vite)" -ForegroundColor DarkGray

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
    # Check for uncommitted changes before switching
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

Write-Host "`n[Worktree Status] project1-worktree-$($WorktreeIndex):" -ForegroundColor Cyan
git -C "$TargetWorktreePath" status --short

Write-Host "`n[Next Steps for Agent/Developer]" -ForegroundColor Yellow
Write-Host "1. Navigate to module workspace:" -ForegroundColor White
Write-Host "   cd `"$TargetWorktreePath\cms-tiktok-crawler`"" -ForegroundColor Green
Write-Host "2. Develop and run validation checks:" -ForegroundColor White
Write-Host "   npm.cmd run check-types" -ForegroundColor Green
Write-Host "   php artisan test" -ForegroundColor Green
Write-Host "3. Commit changes (English, Conventional Commits):" -ForegroundColor White
Write-Host "   git commit -m `"feat(crawler): add error retry exponential backoff`"" -ForegroundColor Green
Write-Host "4. Push branch and open Pull Request (Never push directly to main):" -ForegroundColor White
Write-Host "   git push -u origin $Branch" -ForegroundColor Green
Write-Host ""
