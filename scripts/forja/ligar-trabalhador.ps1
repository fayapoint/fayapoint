# Liga o trabalhador da Forja e o mantém de pé.
#
# ## O que este script resolve
#
# O trabalhador é um processo Node que puxa serviço do site e roda no ComfyUI.
# Ele morre por motivos banais: o ComfyUI reinicia, a rede cai, o Windows
# atualiza. Um `npx tsx trabalhador.ts` solto no terminal morre junto e ninguém
# percebe — a fila do site enche e a mensagem que a pessoa vê é "a GPU está fora
# do ar", que é verdade e não ajuda.
#
# Este laço reergue o processo, com espera crescente para não virar um martelo
# quando a causa é permanente (segredo errado, ComfyUI desinstalado).
#
# ## Como deixar rodando sozinho
#
#   powershell -ExecutionPolicy Bypass -File scripts\forja\ligar-trabalhador.ps1
#
# Para nascer com o Windows, registre a tarefa:
#
#   powershell -ExecutionPolicy Bypass -File scripts\forja\ligar-trabalhador.ps1 -Registrar
#
# ⚠️ Uma tarefa do Windows pode dizer `Ready` e estar MORTA. O sinal de vida é
# `NextRunTime`, não `State`. Depois de registrar, confira:
#
#   Get-ScheduledTask -TaskName "FayAI-Forja" | Get-ScheduledTaskInfo | Select LastRunTime, NextRunTime
#
# Um gatilho `-Once` SEM repetição roda um dia e nunca mais rearma — por isso o
# registro abaixo usa `AtLogOn`, que dispara em toda entrada, e o laço interno
# cuida do resto.

param(
    [switch]$Registrar,
    [switch]$Remover
)

$ErrorActionPreference = "Stop"
$Raiz = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Projeto = Split-Path -Parent $PSScriptRoot | Split-Path -Parent
$Tarefa = "FayAI-Forja"

if ($Remover) {
    Unregister-ScheduledTask -TaskName $Tarefa -Confirm:$false -ErrorAction SilentlyContinue
    "Tarefa '$Tarefa' removida."
    exit 0
}

if ($Registrar) {
    $acao = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$PSCommandPath`"" `
        -WorkingDirectory $Projeto

    # AtLogOn e não Once: um gatilho de uma vez só roda uma vez e nunca rearma.
    $gatilho = New-ScheduledTaskTrigger -AtLogOn

    $config = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 5) `
        -ExecutionTimeLimit ([TimeSpan]::Zero)

    Register-ScheduledTask -TaskName $Tarefa -Action $acao -Trigger $gatilho -Settings $config -Force | Out-Null

    "Registrada. Conferindo o sinal de vida (NextRunTime, nao State):"
    Get-ScheduledTask -TaskName $Tarefa | Get-ScheduledTaskInfo | Select-Object LastRunTime, NextRunTime, LastTaskResult
    exit 0
}

# ── o laço ────────────────────────────────────────────────────────────────────

Set-Location $Projeto
$espera = 5

"Forja: trabalhador em $Projeto"

while ($true) {
    $inicio = Get-Date
    & node "node_modules\tsx\dist\cli.mjs" "scripts\forja\trabalhador.ts"
    $duracao = (Get-Date) - $inicio

    # Viveu mais de um minuto? Foi queda passageira: volta rápido e zera a
    # espera. Morreu em segundos? É defeito de configuração, e insistir a cada
    # cinco segundos só enche o log — a espera dobra até dez minutos.
    if ($duracao.TotalSeconds -gt 60) {
        $espera = 5
    } else {
        $espera = [Math]::Min($espera * 2, 600)
    }

    "[$(Get-Date -Format 'HH:mm:ss')] o trabalhador caiu depois de $([int]$duracao.TotalSeconds)s. Voltando em ${espera}s."
    Start-Sleep -Seconds $espera
}
