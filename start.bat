@echo off
where nodemon >nul 2>&1
if %ERRORLEVEL% equ 0 (
    start cmd /c nodemon server.js
) else (
    start cmd /c node server.js
)
timeout /t 1 /nobreak
start http://localhost:3030/
