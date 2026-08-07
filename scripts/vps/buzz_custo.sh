#!/usr/bin/env bash
# Mede o gasto do dia na OpenRouter e publica no #hermes do Buzz.
# Guarda a leitura anterior para calcular o delta. Nunca derruba nada.
set -uo pipefail
STATE=/root/kirmes/.openrouter_usage
NOW=$(curl -s --max-time 25 https://openrouter.ai/api/v1/credits   -H "Authorization: Bearer <REDACTED — chave real so na VPS>"   | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print(f\"{d['total_usage']:.6f} {d['total_credits']:.2f}\")" 2>/dev/null)
[ -n "$NOW" ] || exit 0
USED=$(echo "$NOW" | cut -d' ' -f1)
BOUGHT=$(echo "$NOW" | cut -d' ' -f2)
SALDO=$(python3 -c "print(f'{0-0:.2f}')" 2>/dev/null)
SALDO=$(python3 -c "print(f'{$BOUGHT-$USED:.2f}')")
# A rota vinha cravada no texto e ficou 5 dias mentindo (dizia
# gemini-3.5-flash-lite depois que o proxy ja tinha migrado para o deepseek).
# Agora vem do /health do proxy: um relatorio que se contradiz e pior que
# relatorio nenhum, porque da confianca falsa.
ROTA=$(curl -s --max-time 8 http://127.0.0.1:7860/health | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[\"primary\"])" 2>/dev/null || echo "proxy fora do ar")
BUZZ=$(openclaw --profile vps config get agents.defaults.model 2>/dev/null | tr -d "
" || echo "?")
ROTA="$ROTA · Buzz: $BUZZ"

if [ -f "$STATE" ]; then
  PREV=$(cat "$STATE")
  DELTA=$(python3 -c "print(f'{$USED-$PREV:.4f}')")
  MES=$(python3 -c "print(f'{($USED-$PREV)*30:.2f}')")
  BODY="**Custo do dia — OpenRouter**
· gasto nas ultimas 24h: **US\$ $DELTA**
· projecao 30 dias nesse ritmo: **US\$ $MES**
· saldo restante: US\$ $SALDO
· modelo em uso: $ROTA"
else
  BODY="**Custo — primeira leitura (linha de base)**
· gasto acumulado ate agora: US\$ $USED
· saldo restante: US\$ $SALDO
A partir de amanha este canal mostra o gasto de 24h e a projecao mensal."
fi
printf '%s' "$BODY" | /root/kirmes/buzz_post.sh hermes -
echo "$USED" > "$STATE"
