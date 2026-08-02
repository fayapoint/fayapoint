#!/usr/bin/env bash
# Relatório de SEO diário — mede o site em produção e publica no #seo do Buzz.
#
# Por que existe (02/08/2026): o Search Console mostra o que o Google DECIDIU
# ontem; este mede o que o site SERVE agora. Os dois respondem perguntas
# diferentes e só o segundo diz o que consertar hoje. Foi ele que achou, na
# primeira execução, 15 das 20 prévias respondendo 404 com a URL declarada no
# sitemap — coisa que o Search Console levaria semanas para reportar.
#
# Se GSC_REFRESH_TOKEN existir no .env.fayai, o relatório também traz indexação
# e consultas reais. Sem ele, sai só a parte medida, que é a acionável.
#
# Nunca derruba nada: sai 0 mesmo em falha, e loga.
set -uo pipefail

DIR=/root/kirmes/cursos
LOG=/root/kirmes/logs/relatorio_seo_$(date +%Y%m%d).log
mkdir -p /root/kirmes/logs "$DIR/relatorios"

echo "[$(date '+%F %T')] Relatorio de SEO — inicio" >> "$LOG"

SAIDA=$(cd "$DIR" && node --env-file=/root/kirmes/.env.fayai seo_relatorio.mjs --amostra=45 2>>"$LOG")
CODIGO=$?

if [ $CODIGO -ne 0 ] || [ -z "$SAIDA" ]; then
  echo "[$(date '+%F %T')] falhou (exit $CODIGO)" >> "$LOG"
  printf '%s' "**Relatorio de SEO — FALHOU**
O script saiu com codigo $CODIGO. Log: \`$LOG\`" | /root/kirmes/buzz_post.sh seo -
  exit 0
fi

# O relatório inteiro fica no disco; o canal recebe até o fim da parte 3, que é
# onde termina o que se decide olhando.
printf '%s' "$SAIDA" | head -c 12000 | /root/kirmes/buzz_post.sh seo -

echo "[$(date '+%F %T')] Fim — publicado no #seo" >> "$LOG"
exit 0
