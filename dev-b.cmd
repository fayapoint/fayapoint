@echo off
REM Servidor de desenvolvimento PARALELO, para quando outra sessão já ocupa a
REM porta 3000. A diferença que importa não é a porta: é o NEXT_DIST_DIR.
REM
REM Dois `next dev` no mesmo diretório disputam o mesmo `.next`, e o segundo
REM passa a servir CSS e chunks compilados pelo primeiro. O sintoma engana:
REM a classe do Tailwind está no HTML, a regra não está na folha, o conserto
REM "não aparece" — e não há erro nenhum. Custou uma caçada em 23/08/2026.
set PATH=C:\Users\ricar\AppData\Roaming\fnm\node-versions\v24.14.1\installation;%PATH%
cd /d "%~dp0"
set NEXT_DIST_DIR=.next-b
node node_modules\next\dist\bin\next dev --port 3010
