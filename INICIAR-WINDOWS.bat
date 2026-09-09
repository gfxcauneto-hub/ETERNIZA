@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22 em https://nodejs.org/ e execute este arquivo novamente.
  pause
  exit /b 1
)
call npx --yes pnpm@10.4.1 install
if errorlevel 1 pause & exit /b 1
call npx --yes pnpm@10.4.1 dev
pause
