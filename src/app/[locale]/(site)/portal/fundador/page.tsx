"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { toast } from "react-hot-toast";
import { Check, Copy, Loader2, ArrowRight } from "lucide-react";

/**
 * O PAINEL DO FUNDADOR — o extrato dele.
 *
 * Três decisões de tela que vêm da natureza do dado:
 *
 * 1. **Retido, liberado e pago aparecem SEPARADOS.** Um "saldo" só, somando os
 *    três, mentiria em silêncio: a maior parte do dinheiro passa 30 dias retida,
 *    e quem vê um número grande e não consegue sacar conclui que o site está
 *    segurando o dele. Três caixas com nome dizem a verdade sem exigir suporte.
 * 2. **A troca de código avisa que é definitiva ANTES do clique**, não depois.
 *    O endereço vai parar em cartaz e em print de grupo; trocar quebraria links
 *    que outras pessoas publicaram.
 * 3. **O e-mail de quem foi indicado aparece mascarado.** Quem indicou precisa
 *    reconhecer a conversão, não alcançar a pessoa.
 */

type Painel = {
  ehFundador: boolean;
  numero?: number;
  codigo?: string;
  endereco?: string;
  status?: string;
  nivel?: string;
  formaPreferida?: "credito" | "dinheiro";
  percentual?: number;
  identidade?: { cpfVerificado: boolean; telefoneVerificado: boolean };
  saldo?: { retido: number; liberado: number; pago: number; estornado: number; diasDeRetencao: number };
  indicados?: {
    validos: number;
    pendentes: number;
    lista: { estado: string; criadoEm: string; convertidaEm?: string; pista: string | null }[];
  };
  escada?: {
    proximo: { nivel: string; faltam: number } | null;
    marcos: { nivel: string; indicados: number; bonusCreditos: number }[];
    pagos: string[];
  };
  tabela?: { padrao: { credito: number; dinheiro: number }; lenda: { credito: number; dinheiro: number } };
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PainelDoFundador() {
  const [dados, setDados] = useState<Painel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Verificação de celular: número → código → verificado.
  const [etapaTelefone, setEtapaTelefone] = useState<"numero" | "codigo">("numero");
  const [telefone, setTelefone] = useState("");
  const [codigoOtp, setCodigoOtp] = useState("");
  const [enviandoOtp, setEnviandoOtp] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/fundadores/painel");
      if (r.status === 401) {
        setDados({ ehFundador: false });
        return;
      }
      setDados(await r.json());
    } catch {
      toast.error("Não deu para carregar o painel agora.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvar = async (corpo: Record<string, string>) => {
    setSalvando(true);
    try {
      const r = await fetch("/api/fundadores/painel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || "Não deu para salvar.");
      toast.success("Salvo.");
      setNovoCodigo("");
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu para salvar.");
    } finally {
      setSalvando(false);
    }
  };

  /**
   * O erro do envio aparece INTEIRO para a pessoa.
   *
   * A rota devolve mensagens que dizem o que fazer ("espere 43 segundos",
   * "peça outro código", "a verificação ainda não está ligada"). Trocar isso
   * por um "erro ao enviar" genérico transformaria cada teto de segurança num
   * mistério — e o suporte que recebe essa dúvida sou eu.
   */
  const enviarCodigo = async () => {
    setEnviandoOtp(true);
    try {
      const r = await fetch("/api/fundadores/telefone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || "Não deu para enviar o código.");
      toast.success(`Código enviado para ${j.para}. Vale ${j.validoPor} minutos.`);
      setEtapaTelefone("codigo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não deu para enviar o código.");
    } finally {
      setEnviandoOtp(false);
    }
  };

  const confirmarCodigo = async () => {
    setEnviandoOtp(true);
    try {
      const r = await fetch("/api/fundadores/telefone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoOtp }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.erro || "Código não confere.");
      toast.success("Celular confirmado.");
      setCodigoOtp("");
      setEtapaTelefone("numero");
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Código não confere.");
    } finally {
      setEnviandoOtp(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dados?.ehFundador) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Você ainda não é fundador</h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-muted-foreground">
          O número de fundador sai quando a primeira assinatura confirma. Enquanto houver
          lugar livre, ele ainda pode ser seu.
        </p>
        <Link
          href="/fundadores"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          Ver o programa <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const podeEscolherCodigo = dados.codigo?.startsWith("fundador-");
  const pendente =
    !dados.identidade?.cpfVerificado || !dados.identidade?.telefoneVerificado;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Fundador #{String(dados.numero).padStart(3, "0")} ·{" "}
        <span className="capitalize">{dados.nivel}</span>
        {dados.status !== "ativo" && ` · ${dados.status}`}
      </p>
      <h1 className="mt-3 text-4xl font-bold">O seu endereço</h1>

      {/* ── O código ─────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-secondary/40 px-5 py-4">
        <code className="font-mono text-lg">{dados.endereco}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(`https://${dados.endereco}`);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          {copiado ? <Check size={15} /> : <Copy size={15} />}
          {copiado ? "copiado" : "copiar"}
        </button>
      </div>

      {podeEscolherCodigo && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
          <h2 className="font-semibold">Escolha o seu código</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Você ainda está com o código provisório. Escolha o definitivo —{" "}
            <strong className="text-foreground">
              ele não muda depois, porque outras pessoas vão publicar esse endereço
            </strong>
            .
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">fayai.com.br/f/</span>
            <input
              value={novoCodigo}
              onChange={(e) => setNovoCodigo(e.target.value)}
              placeholder="oseunome"
              className="min-w-[180px] flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
            />
            <button
              type="button"
              disabled={salvando || novoCodigo.trim().length < 3}
              onClick={() => salvar({ codigo: novoCodigo })}
              className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
            >
              {salvando ? "salvando…" : "é esse"}
            </button>
          </div>
        </div>
      )}

      {pendente && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/40 px-5 py-5">
          <p className="text-sm text-muted-foreground">
            Para o código valer, faltam:{" "}
            {!dados.identidade?.cpfVerificado && <b className="text-foreground">CPF</b>}
            {!dados.identidade?.cpfVerificado && !dados.identidade?.telefoneVerificado && " e "}
            {!dados.identidade?.telefoneVerificado && (
              <b className="text-foreground">celular verificado</b>
            )}
            . A sua vaga já está garantida — a verificação é só para o código sair.
          </p>

          {!dados.identidade?.telefoneVerificado && (
            <div className="mt-4">
              {etapaTelefone === "numero" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(21) 99999-8888"
                    inputMode="tel"
                    className="min-w-[170px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={enviandoOtp || telefone.replace(/\D/g, "").length < 10}
                    onClick={enviarCodigo}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
                  >
                    {enviandoOtp ? "enviando…" : "receber código"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={codigoOtp}
                    onChange={(e) => setCodigoOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    inputMode="numeric"
                    className="w-[120px] rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.3em]"
                  />
                  <button
                    type="button"
                    disabled={enviandoOtp || codigoOtp.length !== 6}
                    onClick={confirmarCodigo}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"
                  >
                    confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEtapaTelefone("numero");
                      setCodigoOtp("");
                    }}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    trocar o número
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Saldo ────────────────────────────────────────────────── */}
      <h2 className="mt-12 text-2xl font-bold">A sua parte</h2>
      <div className="mt-4 grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-3">
        {[
          { rotulo: "Retido", valor: dados.saldo?.retido ?? 0, nota: `libera em até ${dados.saldo?.diasDeRetencao} dias` },
          { rotulo: "Liberado", valor: dados.saldo?.liberado ?? 0, nota: "pronto para usar ou sacar" },
          { rotulo: "Já recebido", valor: dados.saldo?.pago ?? 0, nota: "desde o começo" },
        ].map((c) => (
          <div key={c.rotulo} className="bg-background p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {c.rotulo}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{brl(c.valor)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.nota}</p>
          </div>
        ))}
      </div>

      {/* ── Forma ────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-border p-5">
        <h3 className="font-semibold">Como você quer receber</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Crédito rende mais porque não passa por banco nem por imposto na fonte — por
          isso paga {Math.round((dados.tabela?.padrao.credito ?? 0.07) * 100)}% contra{" "}
          {Math.round((dados.tabela?.padrao.dinheiro ?? 0.05) * 100)}% do dinheiro.
        </p>
        <div className="mt-3 flex gap-2">
          {(["credito", "dinheiro"] as const).map((f) => (
            <button
              key={f}
              type="button"
              disabled={salvando}
              onClick={() => salvar({ formaPreferida: f })}
              className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                dados.formaPreferida === f
                  ? "border-amber-400 bg-amber-500/10 text-amber-400"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {f === "credito" ? "Crédito na conta" : "Dinheiro por Pix"}
            </button>
          ))}
        </div>
        {dados.formaPreferida === "dinheiro" && (
          <p className="mt-3 text-xs text-muted-foreground">
            O saque em dinheiro exige nota (MEI ou CNPJ) e ainda não está aberto. Até lá, o
            valor continua sendo somado no seu extrato.
          </p>
        )}
      </div>

      {/* ── Escada ───────────────────────────────────────────────── */}
      <h2 className="mt-12 text-2xl font-bold">A escada</h2>
      {dados.escada?.proximo ? (
        <p className="mt-2 text-muted-foreground">
          Faltam <b className="text-foreground">{dados.escada.proximo.faltam}</b> contas
          para <span className="capitalize text-amber-400">{dados.escada.proximo.nivel}</span>.
        </p>
      ) : (
        <p className="mt-2 text-muted-foreground">Você chegou ao topo da escada.</p>
      )}
      <div className="mt-4 border-t border-border">
        {dados.escada?.marcos.map((m) => {
          const pago = dados.escada?.pagos.includes(m.nivel);
          return (
            <div
              key={m.nivel}
              className="flex items-baseline justify-between gap-4 border-b border-border py-3"
            >
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {m.indicados} contas
              </span>
              <span className={`flex-1 font-semibold capitalize ${pago ? "text-amber-400" : ""}`}>
                {m.nivel}
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {brl(m.bonusCreditos)} {pago && "· recebido"}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Indicados ────────────────────────────────────────────── */}
      <h2 className="mt-12 text-2xl font-bold">Quem entrou pelo seu código</h2>
      <p className="mt-2 text-muted-foreground">
        {dados.indicados?.validos ?? 0} contas pagando · {dados.indicados?.pendentes ?? 0}{" "}
        ainda sem primeira cobrança
      </p>

      {dados.indicados?.lista.length ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Conta</th>
                <th className="px-4 py-2.5 font-medium">Entrou</th>
                <th className="px-4 py-2.5 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {dados.indicados.lista.map((i, n) => (
                <tr key={n} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{i.pista ?? "—"}</td>
                  <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                    {new Date(i.criadoEm).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        i.estado === "valida"
                          ? "text-amber-400"
                          : i.estado === "anulada"
                            ? "text-muted-foreground line-through"
                            : "text-muted-foreground"
                      }
                    >
                      {i.estado === "valida"
                        ? "pagando"
                        : i.estado === "anulada"
                          ? "anulada"
                          : "sem cobrança ainda"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Estado vazio com uma afirmação só — traço repetido numa tabela lê
           como carregamento quebrado, não como "ainda não houve". */
        <div className="mt-4 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <p className="text-muted-foreground">
            Ninguém entrou pelo seu código ainda. Ele funciona a partir de agora —
            publique o endereço onde a sua gente já está.
          </p>
        </div>
      )}
    </div>
  );
}
