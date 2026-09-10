"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

/**
 * O formulário de resgate.
 *
 * O erro do servidor é mostrado como veio: "já foi resgatado" e "não existe"
 * são problemas diferentes e exigem ações diferentes da pessoa. Colapsar os
 * dois num "código inválido" genérico gera o e-mail de suporte que a mensagem
 * específica evitaria.
 */
export function FormularioResgate({ autenticado }: { autenticado: boolean }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!autenticado) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        Para resgatar, entre na sua conta primeiro — é nela que o acesso fica
        guardado.{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Entrar
        </Link>{" "}
        ou{" "}
        <Link href="/registro" className="text-primary underline underline-offset-4">
          criar conta
        </Link>
        .
      </div>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/pasta-viva/resgatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });
      const dados = await r.json();
      if (!r.ok) {
        setErro(dados?.erro || "Não consegui resgatar agora.");
        return;
      }
      router.push("/pasta-viva");
    } catch {
      setErro("A conexão falhou. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="codigo"
          className="block text-xs font-medium text-muted-foreground"
        >
          Código do PDF
        </label>
        <input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="PV-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm uppercase tracking-wider text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || codigo.trim().length === 0}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {enviando ? "Resgatando…" : "Resgatar e abrir a Pasta Viva"}
      </button>
    </form>
  );
}
