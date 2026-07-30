#!/bin/bash
# TCH Worldbuilding Loop — 10h BRT (13h UTC) todo dia
# v2 2026-07-13: hermes com caminho completo + skill inline no prompt (formato
# antigo de skill .md solto não é mais reconhecido) + saída via /opt/data
# (único volume montado no container) com rsync de volta para /root/kirmes/tch.
LOG="/root/kirmes/logs/tch_$(date +%Y%m%d).log"
SKILL_FILE="/root/.hermes/skills/tch-worldbuilding-expander.md"
OUT_HOST="/root/.hermes/tch/expansions"   # = /opt/data/tch/expansions no container
DEST="/root/kirmes/tch/expansions"
TODAY=$(date +%Y-%m-%d)

echo "[$(date '+%Y-%m-%d %H:%M')] Iniciando worldbuilding TCH..." >> "$LOG"

if ! docker ps | grep -q kirmes; then
  echo "[$(date)] ERRO: kirmes não rodando" >> "$LOG"
  exit 1
fi

mkdir -p "$OUT_HOST" "$DEST"

TASK="Expanda um aspecto subdesenvolvido do universo TCH que não foi trabalhado nos últimos 3 dias. Verifique consistência com o canon.

ATENÇÃO — caminho de saída: salve o arquivo em /opt/data/tch/expansions/${TODAY}_[tema].md (ignore qualquer caminho /root/kirmes mencionado abaixo; esse caminho não existe neste ambiente).

Siga estas instruções de skill:
$(cat "$SKILL_FILE")"

# sem --yolo: nesta versão do hermes a flag quebra a execução (retorna vazio);
# as ferramentas já são auto-aprovadas na config do container
docker exec -u 10000 -e OPENROUTER_BASE_URL=http://127.0.0.1:7860/v1 -e OPENROUTER_API_KEY=kirmes-local kirmes /opt/hermes/.venv/bin/hermes -z "$TASK" >> "$LOG" 2>&1
STATUS=$?

# traz o que foi gerado para o diretório canônico
rsync -a "$OUT_HOST/" "$DEST/" >> "$LOG" 2>&1

NEW=$(find "$DEST" -name "${TODAY}*" 2>/dev/null | wc -l)
if [ "$STATUS" -eq 0 ] && [ "$NEW" -gt 0 ]; then
  MCSTATUS="success"
  MSG="Expansão gerada ($NEW arquivo(s) de hoje)"
else
  MCSTATUS="failure"
  MSG="Falha: exit=$STATUS, arquivos de hoje=$NEW"
fi

curl -s -X POST "https://mc-faya-dashboard.netlify.app/api/activity/log" \
  -H "Content-Type: application/json" \
  -d "{\"agent\":\"Kirmes\",\"agentEmoji\":\"⚡\",\"action\":\"Loop diário TCH worldbuilding: $MSG\",\"type\":\"task\"}" > /dev/null 2>&1

echo "[$(date '+%Y-%m-%d %H:%M')] Fim ($MSG)." >> "$LOG"
[ "$MCSTATUS" = "success" ]
