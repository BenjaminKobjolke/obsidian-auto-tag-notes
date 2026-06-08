@echo off
REM Build the plugin and copy the latest artifacts into every vault in tools\vaults.json
setlocal
set "REPO=%~dp0.."

echo === Building plugin ===
call npm --prefix "%REPO%" run build
if errorlevel 1 (
	echo.
	echo Build failed. Aborting deploy.
	pause
	exit /b 1
)

echo.
echo === Deploying to vaults ===
node "%~dp0deploy_to_vaults.mjs"
set "RC=%errorlevel%"

echo.
pause
exit /b %RC%
