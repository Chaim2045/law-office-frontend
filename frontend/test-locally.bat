@echo off
echo ================================================
echo    Law Office Frontend - Local Test Server
echo ================================================
echo.
echo Starting local server on port 8080...
echo.
echo Open in browser: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

REM Try Python
python -m http.server 8080 2>nul
if %errorlevel% equ 0 goto :eof

REM Try Python3
python3 -m http.server 8080 2>nul
if %errorlevel% equ 0 goto :eof

REM Try PHP
php -S localhost:8080 2>nul
if %errorlevel% equ 0 goto :eof

REM No server found
echo.
echo ERROR: No server found!
echo.
echo Please install one of:
echo   - Python: https://www.python.org/downloads/
echo   - PHP: https://www.php.net/downloads
echo   - Node.js: npm install -g serve
echo.
pause
