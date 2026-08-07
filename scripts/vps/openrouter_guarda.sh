#!/usr/bin/env bash
# Guarda de gasto da OpenRouter. Roda de 4 em 4 horas e SO fala quando algo
# passa do limite — o relatorio diario continua sendo o buzz_custo.sh das 08:45.
#
# Existe porque em 07/08/2026 o Buzz/OpenClaw estava no moonshotai/kimi-k3
# (US$ 3 / 15 por M) enquanto todo o resto ja tinha migrado para o deepseek v4
# flash (US$ 0,09 / 0,18) — 83x mais barato na saida. A troca de 02/08 foi feita
# no CODIGO e o config do OpenClaw na VPS ficou para tras. Ninguem viu por cinco
# dias porque o relatorio diario mostrava o TOTAL e nunca um LIMITE. Um numero
# que so informa nao protege; este script e o limite.
set -uo pipefail

KEY_FILE=/root/kirmes/.openrouter_key
KEY="$(cat "$KEY_FILE" 2>/dev/null || echo "${OPENROUTER_KEY:-}")"
[ -n "$KEY" ] || exit 0

STATE=/root/kirmes/.openrouter_guarda
MARCOS=/root/kirmes/.openrouter_marcos

# RITMO_MAX e por JANELA de 4h: 0,25 equivale a US$ 1,50/dia.
RITMO_MAX=${RITMO_MAX:-0.25}
SALDO_MARCOS=${SALDO_MARCOS:-"40 25 15 8"}

LEITURA=$(curl -s --max-time 25 https://openrouter.ai/api/v1/credits \
  -H "Authorization: Bearer $KEY" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin)["data"]; print("%.6f %.2f" % (d["total_usage"], d["total_credits"]))' 2>/dev/null)
[ -n "$LEITURA" ] || exit 0

USED=$(echo "$LEITURA" | cut -d' ' -f1)
BOUGHT=$(echo "$LEITURA" | cut -d' ' -f2)
SALDO=$(python3 -c "print('%.2f' % ($BOUGHT - $USED))")

touch "$MARCOS"
ALERTA=""

# 1) Ritmo na janela de 4h
if [ -f "$STATE" ]; then
  PREV=$(cat "$STATE")
  DELTA=$(python3 -c "print('%.4f' % ($USED - $PREV))")
  if [ "$(python3 -c "print(1 if $DELTA > $RITMO_MAX else 0)")" = "1" ]; then
    DIA=$(python3 -c "print('%.2f' % ($DELTA * 6))")
    ALERTA="$ALERTA
🔴 **Ritmo acima do limite** — US\$ $DELTA nas ultimas 4h (teto $RITMO_MAX). Nesse passo da **US\$ $DIA por dia**.
Quem esta gastando: \`journalctl -u kirmes-proxy -S -4h | grep tentando | sort | uniq -c | sort -rn\`
Modelo do Buzz: \`openclaw --profile vps config get agents.defaults.model\`"
  fi
fi
echo "$USED" > "$STATE"

# 2) Marcos de saldo — cada um fala UMA vez so
for M in $SALDO_MARCOS; do
  if [ "$(python3 -c "print(1 if $SALDO < $M else 0)")" = "1" ] && ! grep -qx "$M" "$MARCOS"; then
    echo "$M" >> "$MARCOS"
    ALERTA="$ALERTA
🟠 **Saldo abaixo de US\$ $M** — restam **US\$ $SALDO**."
  fi
done

[ -n "$ALERTA" ] || exit 0
printf '%s' "**Guarda da OpenRouter**$ALERTA" | /root/kirmes/buzz_post.sh hermes -
