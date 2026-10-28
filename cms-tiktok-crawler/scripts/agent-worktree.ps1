<#
.SYNOPSIS
    Manages persistent git worktrees for AI Agents and developers adhering to AGENTS.md.

.DESCRIPTION
    Ensures the root repository remains an idle anchor while development occurs inside
    designated persistent worktrees (project1-worktree-1 to project1-worktree-5).

.PARAMETER WorktreeIndex
    The index of the worktree to use (1 to 5). Default is 1.

.PARAMETER Branch
    The branch name to checkout or create. Default is 'main'.

.PARAMETER CreateBranch
    If specified, creates a new branch from BaseBranch.

.PARAMETER BaseBranch
    The base branch to branch from when creating a new branch. Default is 'main'.

.EXAMPLE
    .\scripts\agent-worktree.ps1 -WorktreeIndex 1 -Branch "feature/crawler-settings" -CreateBranch
#>

param (
    [ValidateRange(1, 5)]
    [int]$WorktreeIndex = 1,

    [string]$Branch = "main",

    [switch]$CreateBranch,

    [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\.."
$ParentDir = Split-Path -Parent $ProjectRoot
$TargetWorktreePath = "$ParentDir\project1-worktree-$WorktreeIndex"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host " CMS TikTok Crawler - AI Agent Worktree Manager" -ForegroundColor Cyan
Write-Host " Target Worktree : project1-worktree-$WorktreeIndex" -ForegroundColor Yellow
Write-Host " Target Branch   : $Branch" -ForegroundColor Yellow
Write-Host " Path            : $TargetWorktreePath" -ForegroundColor DarkGray
Write-Host "========================================================`n" -ForegroundColor Cyan

# 1. Inspect existing worktrees
$worktrees = git -C "$ProjectRoot" worktree list --porcelain

$worktreeExists = Test-Path "$TargetWorktreePath"

if (-not $worktreeExists) {
    Write-Host "[Worktree] Initializing worktree at: $TargetWorktreePath..." -ForegroundColor Green

    if ($CreateBranch) {
        git -C "$ProjectRoot" worktree add -b $Branch "$TargetWorktreePath" $BaseBranch
    } else {
        # Check if branch exists
        $branchExists = git -C "$ProjectRoot" branch --list $Branch
        if ($branchExists) {
            git -C "$ProjectRoot" worktree add "$TargetWorktreePath" $Branch
        } else {
            git -C "$ProjectRoot" worktree add -b $Branch "$TargetWorktreePath" $BaseBranch
        }
    }
} else {
    Write-Host "[Worktree] Worktree exists. Switching branch to '$Branch' inside worktree..." -ForegroundColor Green
    
    if ($CreateBranch) {
        git -C "$TargetWorktreePath" checkout -b $Branch $BaseBranch
    } else {
        git -C "$TargetWorktreePath" checkout $Branch
    }
}

Write-Host "`n[Worktree Ready] Current status inside project1-worktree-$WorktreeIndex:" -ForegroundColor Cyan
git -C "$TargetWorktreePath" status --short

Write-Host "`n[Agent Instructions]" -ForegroundColor Yellow
Write-Host "To execute tasks in this worktree, run:" -ForegroundColor White
Write-Host "  cd `"$TargetWorktreePath\cms-tiktok-crawler`"" -ForegroundColor Green
Write-Host "  npm.cmd run check-types" -ForegroundColor Green
Write-Host "  php artisan test" -ForegroundColor Green
Write-Host ""
