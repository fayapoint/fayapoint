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

REM  Ranking das duas gerações + captura funda dos 10 primeiros de cada + todos
REM  os clubes que alguém reivindicou no site. ~45 idas à EA por rodada, o que
REM  é irrisório para uma fonte pública e generoso com ela.
node --env-file=.env.local node_modules\tsx\dist\cli.mjs scripts\game\espelhar-ea.ts --fundo 10 >> "scripts\game\coletar.log" 2>&1

REM  COLETOR DA COPA - o mais urgente deste arquivo.
REM
REM  A EA guarda 10 partidas AMISTOSAS por clube, e um confronto MD5 queima
REM  cinco slots numa noite. Duas rodadas e o historico anterior some da fonte
REM  PARA SEMPRE: nao ha paginacao, consulta por matchId nem arquivo. Nem a
REM  organizacao da copa recupera - ela depende da mesma API.
REM
REM  Medido em 08/09: a varredura pelo grafo achou 9 dos 20 times e PAROU,
REM  porque os outros 11 ja tinham saido da janela. O que este comando grava
REM  hoje e o unico registro que vai existir amanha.
node --env-file=.env.local node_modules\tsx\dist\cli.mjs scripts\game\copa-coletar.ts --descobrir >> "scripts\game\coletar.log" 2>&1

REM  O BATIMENTO DA MESA DE APOSTAS - pega carona neste turno, de proposito.
REM
REM  Regra da casa: nao criar horario agendado novo; entrar num que ja existe.
REM  Consequencia declarada: um evento liquida em ate 1 hora depois do apito,
REM  que e o intervalo deste coletor. Por isso a rodada espaca as partidas em
REM  30 minutos - cada execucao acha 1 ou 2 vencidas, nunca uma pilha.
REM
REM  Roda DEPOIS do espelho, nao antes: a rodada nova e montada a partir dos
REM  clubes que o espelho acabou de atualizar.
node --env-file=.env.local node_modules\tsx\dist\cli.mjs scripts\game\mesa.ts >> "scripts\game\coletar.log" 2>&1

echo Saida: %ERRORLEVEL% >> "scripts\game\coletar.log"
endlocal
