@echo off
REM ============================================================================
REM  COLETOR DO /game — roda de hora em hora, do PC do Ricardo.
REM ============================================================================
REM
REM  Por que existe: a EA responde HTTP 403 para IP de datacenter (medido em
REM  25/08/2026 na Netlify E na VPS da Hostinger). Só IP residencial passa.
REM  Então quem lê a EA é ESTE computador, e a produção lê o Mongo.
REM
REM  Não precisa de Tailscale nem de porta aberta: a conexão é de SAÍDA daqui
REM  para o Mongo Atlas. Ninguém alcança esta máquina de fora.
REM
REM  Registrar a tarefa (PowerShell como administrador, uma vez só):
REM
REM    $a = New-ScheduledTaskAction -Execute "C:\Users\ricar\WORKSMAIN\autoresearch\fayapoint-ai\scripts\game\coletar.cmd"
REM    $g = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) `
REM           -RepetitionInterval (New-TimeSpan -Minutes 60) `
REM           -RepetitionDuration ([TimeSpan]::MaxValue)
REM    $s = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries `
REM           -AllowStartIfOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
REM    Register-ScheduledTask -TaskName "FayAI-Game-Coletor" -Action $a -Trigger $g -Settings $s
REM
REM  ⚠️ DEPOIS DE REGISTRAR, CONFIRA O `NextRunTime`:
REM
REM    Get-ScheduledTask -TaskName "FayAI-Game-Coletor" | Get-ScheduledTaskInfo
REM
REM  `State: Ready` NÃO é sinal de vida — uma tarefa morta também diz Ready.
REM  O sinal é `NextRunTime` estar preenchido e no futuro. Um gatilho `-Once`
REM  SEM `-RepetitionInterval` roda uma vez e nunca mais rearma; foi assim que
REM  o publicador ficou três dias parado sem ninguém notar.
REM
REM  O outro sinal, esse do lado do site: `/api/game/ea/diagnostico` mostra o
REM  pulso do coletor (quando rodou, quanto trouxe).
REM ============================================================================

setlocal
set PATH=C:\Users\ricar\AppData\Roaming\fnm\node-versions\v24.14.1\installation;%PATH%
cd /d "%~dp0..\.."

REM  Rotaciona o log para ele não crescer sem fim: guarda a rodada anterior.
if exist "scripts\game\coletar.log" move /y "scripts\game\coletar.log" "scripts\game\coletar.anterior.log" >nul 2>&1

echo ===== %DATE% %TIME% ===== >> "scripts\game\coletar.log"

REM  Ranking das duas gerações + captura funda dos 3 primeiros de cada + todos
REM  os clubes que alguém reivindicou no site. ~25 idas à EA por rodada, o que
REM  é irrisório para uma fonte pública e generoso com ela.
node --env-file=.env.local node_modules\tsx\dist\cli.mjs scripts\game\espelhar-ea.ts --fundo 3 >> "scripts\game\coletar.log" 2>&1

echo Saida: %ERRORLEVEL% >> "scripts\game\coletar.log"
endlocal
