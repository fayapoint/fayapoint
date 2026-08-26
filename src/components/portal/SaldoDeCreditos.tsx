"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Coins, Loader2 } from "lucide-react";
import { getClientAuthHeaders } from "@/lib/client-auth";

/**
 * O saldo de créditos, onde a pessoa procura por ele.
 *
 * ── O que estava errado ────────────────────────────────────────────────────
 *
 * Ricardo, 05/08/2026: *"não vejo meus créditos, e deveríamos já ter o sistema
 * de créditos completamente funcional"*.
 *
 * ⚠️ O sistema ESTÁ funcional. `GET /api/credits` existe, soma o saldo mensal
 * com os créditos comprados que ainda não venceram, e — o detalhe que importa —
 * roda `garantirCreditos()` ANTES de ler o documento, porque não há cron: é a
 * leitura do saldo que faz o refill do mês acontecer.
 *
 * O que não existia era alguém que CHAMASSE essa rota. Nenhum `.tsx` do projeto
 * referenciava `/api/credits`. O saldo era concedido, gasto e renovado sem
 * nunca aparecer numa tela — e, pior, num sistema em que a leitura é o gatilho
 * do refill, ninguém olhando o saldo significa que o refill de quem não usa o
 * Ateliê só acontecia na primeira vez que ela gastasse algo.
 *
 * ── Duas decisões ──────────────────────────────────────────────────────────
 *
 * **Um número, não um painel.** Quem está no meio de um curso não quer um
 * extrato; quer saber se dá para reescrever mais um capítulo. O extrato mora na
 * página de créditos, e o selo leva até lá.
 *
 * **Some sozinho para quem não está logado ou quando a rota falha.** Um selo
 * escrito "—" ao lado de "Lv.15" parece defeito do site. Não aparecer não
 * parece nada.
 */
export function SaldoDeCreditos({
  className = "",
  compacto = false,
}: {
  className?: string;
  /** No cabeçalho do menu, ao lado do nível: só o número. */
  compacto?: boolean;
}) {
  const T = useT();
  const [saldo, setSaldo] = useState<number | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch("/api/credits", { headers: getClientAuthHeaders() });
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        if (vivo) setSaldo(typeof d?.balance === "number" ? d.balance : 0);
      } catch {
        if (vivo) setErro(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (erro) return null;

  const conteudo =
    saldo === null ? (
      <Loader2 size={compacto ? 12 : 14} className="animate-spin opacity-60" />
    ) : (
      <>
        <span className="tabular-nums font-bold text-amber-300">{saldo}</span>
        {!compacto && (
          <span className="text-white/55">{saldo === 1 ? T("crédito") : T("créditos")}</span>
        )}
      </>
    );

  // ⚠️ `/portal/creditos` NÃO existe — o selo levava a um 404 desde que foi
  // criado (não há pasta `creditos` em `app/[locale]/(site)/portal/`). O
  // extrato mora na aba Assinatura de `/portal/conta`, que é onde
  // `CartaoDeCreditos` é renderizado.
  return (
    <Link
      href="/portal/conta?tab=assinatura"
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs transition-colors hover:border-amber-400/50 hover:bg-amber-500/15 ${className}`}
      title={T("Seus créditos — usados para personalizar capítulos no Ateliê")}
    >
      <Coins size={compacto ? 12 : 14} className="shrink-0 text-amber-400" />
      {conteudo}
    </Link>
  );
}
