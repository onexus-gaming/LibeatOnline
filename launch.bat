@echo off
where py >nul 2>nul
if %ERRORLEVEL% neq 0 echo Python not found.

echo Libeat Online start script - Windows
echo Open this window and press CTRL+C to stop the server (you will need to close your browser tab).
echo ----

echo Generating database...
py database.py
echo ----

echo Starting game...
start "" http://127.0.0.1:9000
py -m http.server 9000