@echo off
setlocal enabledelayedexpansion

echo ================================================
echo   Betting Management - GitHub Push Script
echo ================================================
echo.

:: -----------------------------------------------
:: CONFIGURATION - Edit these before running!
:: -----------------------------------------------
set GITHUB_USERNAME=YOUR_GITHUB_USERNAME
set REPO_NAME=betting-management
set BRANCH=main
set COMMIT_MSG=Initial commit

:: -----------------------------------------------
:: Check git is installed
:: -----------------------------------------------
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] git is not installed or not in PATH.
    echo Download it from https://git-scm.com/downloads
    pause
    exit /b 1
)

:: -----------------------------------------------
:: Initialize git repo if not already done
:: -----------------------------------------------
if not exist ".git" (
    echo [1/5] Initializing git repository...
    git init
    git checkout -b %BRANCH%
) else (
    echo [1/5] Git repository already initialized.
)

:: -----------------------------------------------
:: Stage all files (respects .gitignore)
:: -----------------------------------------------
echo [2/5] Staging files...
git add .
echo       Files staged:
git diff --cached --name-only

:: -----------------------------------------------
:: Commit
:: -----------------------------------------------
echo.
echo [3/5] Creating commit...
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [INFO] Nothing new to commit, or commit failed.
)

:: -----------------------------------------------
:: Set remote origin (skip if already set)
:: -----------------------------------------------
echo.
echo [4/5] Setting remote origin...
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    set REMOTE_URL=https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
    echo       Adding remote: !REMOTE_URL!
    git remote add origin !REMOTE_URL!
) else (
    echo       Remote origin already set:
    git remote get-url origin
)

:: -----------------------------------------------
:: Push to GitHub
:: -----------------------------------------------
echo.
echo [5/5] Pushing to GitHub...
git push -u origin %BRANCH%
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Common causes:
    echo   - The GitHub repo does not exist yet. Create it at:
    echo     https://github.com/new
    echo   - You are not authenticated. Run: git config --global credential.helper manager
    echo   - Wrong username or repo name in this script.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Success! Code pushed to GitHub.
echo   https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo ================================================
pause
