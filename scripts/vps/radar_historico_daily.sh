#!/bin/bash
# Radar FayAI — mede os 10 nichos e grava um ponto por dia no historico.
#
# Por que existe (28/07/2026): o grafico "A LINHA DO TEMPO" da /radar so tem o
# que este cron alimenta. A gravacao original pendurava na visita do usuario, e
# so o nicho "geral" (o padrao da pagina) enchia sozinho — os outros 9 ficavam
# com a serie furada.
#
# Um nicho por chamada de proposito: sao ~18 consultas de autocomplete cada, e
# os dez numa requisicao so estourariam o teto de execucao da funcao. O laco
# mora aqui, que nao tem esse teto.
#
# A rota /api/radar/medir FORCA a medicao. Chamar /api/radar nao serviria: ela
# passa pelo cache de 6h e, num processo quente, retorna antes de gravar.

SECRET=$(grep -m1 '^AINEWS_SECRET=' /root/kirmes/.env.fayai | cut -d= -f2-)
LOG=/root/kirmes/logs/radar_historico_$(date +%Y%m%d).log
UA='Mozilla/5.0 (VPS cron)'
BASE=https://fayai.com.br/api/radar/medir

echo "[$(date '+%Y-%m-%d %H:%M')] Iniciando historico do Radar..." >> "$LOG"

# A lista vem da propria API — nicho novo no site entra aqui sem editar script.
NICHOS=$(curl -s -X POST --max-time 30 -A "$UA" -H "x-social-secret: $SECRET" "$BASE"   | grep -o '"[a-z-]*"' | tr -d '"' | grep -v '^nichos$')

if [ -z "$NICHOS" ]; then
  echo "  ERRO: nao consegui a lista de nichos (segredo errado ou site fora?)" >> "$LOG"
  echo "[$(date '+%Y-%m-%d %H:%M')] Fim (exit 1)." >> "$LOG"
  exit 1
fi

OK=0; FALHOU=0
for n in $NICHOS; do
  R=$(curl -s -X POST --max-time 90 -A "$UA" -H "x-social-secret: $SECRET" "$BASE?nicho=$n")
  echo "  $R" >> "$LOG"
  case "$R" in
    *'"gravado":true'*) OK=$((OK+1)) ;;
    *) FALHOU=$((FALHOU+1)) ;;
  esac
  sleep 3   # gentileza com o autocomplete do Google; sem isto vira rajada
done

echo "[$(date '+%Y-%m-%d %H:%M')] Fim ($OK gravados, $FALHOU falharam)." >> "$LOG"
[ "$FALHOU" -eq 0 ] || exit 1
