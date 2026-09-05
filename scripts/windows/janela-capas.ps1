<#
.SYNOPSIS
    Abre a janela diaria em que o blog consegue gerar capa, e fecha depois.

.DESCRIPTION
    O blog diario publica as 11h BRT e a capa de cada materia sai do ComfyUI,
    que roda NESTE PC e e alcancado pela VPS via Tailscale (comfy-bridge).
    Ate 28/07/2026 nada disso subia sozinho: as materias sairam com imagem
    generica desde ~22/07 e o cron terminava em exit 0, sem alertar ninguem.

    31/07/2026: a janela era 06:55/07:20 e o Ricardo estava dormindo — o PC
    ficava fora do ar, o pedido do bridge nao era atendido e a capa saia
    generica. Todo o bloco (janela + cron das noticias na VPS) foi movido para
    11h BRT, horario em que ele esta sempre acordado.

    Esta rotina abre a janela pouco antes da publicacao e a fecha depois, para
    nao deixar a GPU ocupada o dia inteiro:

      10:55  -Acao abrir   -> ComfyUI + comfy-bridge + janela SSH da VPS
      11:20  -Acao fechar  -> fecha o que ELA abriu, se o ComfyUI estiver ocioso

    ## As duas regras que evitam fechar o que nao e nosso

    1. **So fecha o que esta rotina abriu.** Se o ComfyUI ja estava de pe as
       10:55 (voce ja trabalhando), ela nao inicia nada e nao grava
       marcador — e as 11:20 nao fecha nada. O marcador
       (`%LOCALAPPDATA%\FayAI\janela-capas.json`) e a unica autorizacao de
       fechamento que existe.

    2. **So fecha com a fila vazia.** Antes de matar consulta
       `127.0.0.1:8000/queue`; se houver imagem em andamento ou na fila, espera
       ate `-EsperaMax` minutos. Se ainda assim nao esvaziar, DESISTE de fechar
       e apaga o marcador — deixar a GPU ocupada e muito melhor que matar
       geracao pela metade, e apagar o marcador garante que nenhuma execucao
       futura vai fechar essa sessao pelas costas.

.PARAMETER Acao
    abrir | fechar

.PARAMETER EsperaMax
    Minutos que o fechamento espera a fila esvaziar. Padrao 20.
#>
param(
    [Parameter(Mandatory = $true)][ValidateSet('abrir', 'fechar')][string]$Acao,
    [int]$EsperaMax = 20
)

$ErrorActionPreference = 'Stop'

# ─────────────────────────────────────────────────────────────────────────────
# A BATIDA — a primeira coisa que este arquivo faz, antes de qualquer logica.
#
# 05/09/2026: o log desta rotina nao recebe uma linha desde 31/07, e mesmo assim
# o Agendador registra "ultima execucao: ontem 10:55, resultado 0". As duas
# afirmacoes nao podem ser verdade juntas. Rodada a mao AGORA, a rotina escreve
# normalmente — entao o problema esta entre o Agendador e a primeira linha
# executada, e nao dentro da logica.
#
# Esta batida separa as duas hipoteses de uma vez: se o arquivo `batida` ganhar
# a data de hoje as 10:55 e o log continuar mudo, o script comeca e morre no
# meio; se nem a batida aparecer, a tarefa nunca chega a executar o script e o
# "resultado 0" do Agendador e mentira.
#
# ⛔ Nao proteja esta linha com try. Ela existe justamente para falhar alto.
# ─────────────────────────────────────────────────────────────────────────────
$PastaBatida = "$env:LOCALAPPDATA\FayAI"
if (-not (Test-Path $PastaBatida)) { New-Item -ItemType Directory -Path $PastaBatida -Force | Out-Null }
Add-Content -Path "$PastaBatida\janela-capas.batida.log" -Encoding UTF8 -Value (
    "[{0:yyyy-MM-dd HH:mm:ss}] entrei · acao={1} · usuario={2} · sessao={3} · cwd={4}" -f
    (Get-Date), $Acao, $env:USERNAME, [System.Diagnostics.Process]::GetCurrentProcess().SessionId, (Get-Location).Path
)

# ─────────────────────────────────────────────────────────────────────────────
# QUAL ComfyUI — e por que isto e uma linha perigosa
#
# 05/09/2026. Ha DUAS arvores de ComfyUI neste disco dividindo UMA venv
# (`C:\WORKS\ComfyUI\.venv`):
#
#   Comfy Desktop\Comfy Desktop.exe   ago/2026, core 0.34.5   <- a boa
#   ComfyUI.exe                       mai/2026, core 0.22.2   <- a do instalador
#
# Cada uma exige pins Python diferentes, e **quem sobe por ultimo deixa a venv
# do seu jeito e quebra a outra**. Esta rotina subia a ANTIGA todo dia as 10h55;
# o Estudio Social sobe a NOVA as 06h30. Resultado medido: o turno da manha
# falhou em 28, 29 e 31/08 e em 03, 04 e 05/09 com "ComfyUI nao respondeu na
# porta 8000 em 240s" — oito dias de posts perdidos por causa desta variavel.
#
# Nao e lentidao: no dia 30/08, quando a venv estava do jeito da Desktop, ela
# subiu em 42 segundos. Ou sobe rapido, ou nao sobe nunca.
#
# ⛔ As duas rotinas tem de apontar para o MESMO executavel. Ver a memoria
#    `reference_comfyui_venv_desatualizada`.
# ─────────────────────────────────────────────────────────────────────────────
#
# 05/09/2026, decisao do Ricardo: **a antiga nunca mais**, nem como plano B.
# O executavel dela foi renomeado no disco por
# `painel-automacoes\so-a-comfy-nova.ps1`, e este arquivo nao tem mais como
# chama-la nem por engano.
$ComfyCandidatos = @(
    "$env:LOCALAPPDATA\Programs\ComfyUI\Comfy Desktop\Comfy Desktop.exe"
)
$ComfyExe  = $ComfyCandidatos | Where-Object { Test-Path $_ } | Select-Object -First 1
$Bridge    = 'FayAI-ComfyBridge'          # tarefa agendada que ja existia
$VpsHost   = 'root@76.13.234.38'
$PastaEst  = "$env:LOCALAPPDATA\FayAI"
$Marcador  = "$PastaEst\janela-capas.json"
$Log       = "$PastaEst\janela-capas.log"

function Registrar($msg) {
    if (-not (Test-Path $PastaEst)) { New-Item -ItemType Directory -Path $PastaEst -Force | Out-Null }
    $linha = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $msg
    Write-Output $linha
    Add-Content -Path $Log -Value $linha -Encoding UTF8
}

function PortaAtiva([int]$porta) {
    $null -ne (Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue)
}

function DonoDaPorta([int]$porta) {
    $c = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue
    if ($c) { return $c[0].OwningProcess }
    return $null
}

# A fila do ComfyUI e a fonte da verdade sobre "tem algo rodando". Contar
# processo ou uso de GPU nao serve: o servidor fica residente e a VRAM continua
# alocada mesmo sem trabalho nenhum.
function FilaOcupada {
    try {
        $r = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/queue' -TimeoutSec 10
        $rodando  = @($r.queue_running).Count
        $pendente = @($r.queue_pending).Count
        return ($rodando + $pendente) -gt 0
    } catch {
        # Sem resposta = servidor ja caiu. Nao ha o que preservar.
        return $false
    }
}

# ─────────────────────────────────────────────────────────── abrir

if ($Acao -eq 'abrir') {
    if (PortaAtiva 8000) {
        Registrar 'ComfyUI JA estava aberto — nao inicio nem gravo marcador (as 11:20 nada sera fechado).'
        # O bridge ainda precisa estar de pe mesmo assim: e ele que da acesso
        # a VPS, e morre junto com a sessao dele.
        if (-not (PortaAtiva 8088)) {
            Start-ScheduledTask -TaskName $Bridge -ErrorAction SilentlyContinue
            Registrar '  bridge estava fora — iniciado.'
        }
        exit 0
    }

    Registrar 'abrindo a janela das capas...'

    Start-Process -FilePath $ComfyExe | Out-Null

    $subiu = $false
    foreach ($i in 1..40) {
        Start-Sleep -Seconds 6
        if (PortaAtiva 8000) { $subiu = $true; break }
    }
    if (-not $subiu) {
        Registrar '  ERRO: ComfyUI nao respondeu na porta 8000 em 240s. Nada foi marcado.'
        exit 1
    }

    # O Electron abre varios processos e o que escuta a 8000 e um filho, entao
    # anotar so o PID do Start-Process nao bastaria para fechar depois.
    $pids = @()
    $dono = DonoDaPorta 8000
    if ($dono) { $pids += $dono }
    $pids += (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^(ComfyUI|Comfy Desktop)' }).Id
    $pids = $pids | Sort-Object -Unique

    if (-not (PortaAtiva 8088)) {
        Start-ScheduledTask -TaskName $Bridge -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 4
    }
    $bridgeOk = PortaAtiva 8088

    # A janela SSH e pedido explicito do Ricardo. Nao e ela que faz a capa
    # funcionar — quem faz e o bridge acima — mas serve para acompanhar a VPS
    # no horario em que o cron das noticias roda.
    $ssh = Start-Process -FilePath 'ssh' -ArgumentList $VpsHost -PassThru

    @{
        abertoEm  = (Get-Date).ToString('s')
        comfyPids = @($pids)
        sshPid    = $ssh.Id
    } | ConvertTo-Json | Set-Content -Path $Marcador -Encoding UTF8

    Registrar ("  ComfyUI no ar (pids: {0}) · bridge: {1} · ssh pid {2}" -f ($pids -join ','), $(if ($bridgeOk) { 'ativo' } else { 'FORA' }), $ssh.Id)
    if (-not $bridgeOk) {
        Registrar '  AVISO: bridge fora do ar — a VPS nao vai alcancar o ComfyUI e as capas sairao genericas.'
    }
    exit 0
}

# ─────────────────────────────────────────────────────────── fechar

if (-not (Test-Path $Marcador)) {
    Registrar 'sem marcador: o ComfyUI nao foi aberto por esta rotina. Nao fecho nada.'
    exit 0
}

$m = Get-Content $Marcador -Raw | ConvertFrom-Json

$limite = (Get-Date).AddMinutes($EsperaMax)
while ((FilaOcupada) -and ((Get-Date) -lt $limite)) {
    Registrar '  fila do ComfyUI ocupada — aguardando 2 min.'
    Start-Sleep -Seconds 120
}

if (FilaOcupada) {
    Registrar ("  fila ainda ocupada apos {0} min. NAO fecho — e apago o marcador, para nenhuma execucao futura fechar esta sessao." -f $EsperaMax)
    Remove-Item $Marcador -Force
    exit 0
}

$mortos = @()
foreach ($p in @($m.comfyPids)) {
    $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
    if ($proc) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; $mortos += $p }
}
# Varredura final: o Electron pode ter aberto filhos depois do momento em que
# anotamos os pids.
foreach ($proc in (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match '^(ComfyUI|Comfy Desktop)' })) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    $mortos += $proc.Id
}

$sshMorto = $false
if ($m.sshPid) {
    $proc = Get-Process -Id $m.sshPid -ErrorAction SilentlyContinue
    if ($proc) { Stop-Process -Id $m.sshPid -Force -ErrorAction SilentlyContinue; $sshMorto = $true }
}

Remove-Item $Marcador -Force
Registrar ("janela fechada — ComfyUI (pids {0}) e ssh {1}. O bridge continua de pe (e leve e serve o dia todo)." -f (($mortos | Sort-Object -Unique) -join ','), $(if ($sshMorto) { 'encerrado' } else { 'ja estava fechado' }))
exit 0
