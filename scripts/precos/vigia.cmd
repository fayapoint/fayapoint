@echo off
REM Vigia de preco dos modelos — chamado pela tarefa agendada "FayAI Vigia Precos".
REM
REM Existe como .cmd, e nao como linha direta no schtasks, porque a tarefa
REM precisa entrar na pasta certa (o script grava a referencia ao lado de si) e
REM porque assim da para mudar o comando sem mexer na tarefa registrada.
cd /d "%~dp0..\.."
node scripts\precos\vigia-precos.mjs >> "scripts\precos\ultima-rodada.log" 2>&1
REM codigo 2 = o preco mudou. A tarefa guarda esse codigo no historico do
REM Agendador, entao da para ver quando mudou sem abrir o log.
exit /b %ERRORLEVEL%
