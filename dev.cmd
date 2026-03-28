@echo off
set PATH=C:\Users\ricar\AppData\Roaming\fnm\node-versions\v24.14.1\installation;%PATH%
cd /d "%~dp0"
if exist .next rmdir /s /q .next
node node_modules\next\dist\bin\next dev --port 3000
