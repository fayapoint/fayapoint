"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useT } from "@/i18n/dicionario";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getClientAuthHeaders } from "@/lib/client-auth";
import { cpfValido, formatarCpf, normalizarCpf } from "@/lib/cpf";

/**
 * Identidade da conta — Google, CPF e e-mails (10/08/2026).
 *
 * ## O que este cartão desfaz
 *
 * Ricardo: *"a parte de conta ainda não entendi, estou logado com o google mas
 * ainda preciso logar de novo ali, não faz sentido"*. Duas coisas estavam
 * erradas ao mesmo tempo:
 *
 * 1. A aba Segurança desenhava "Google — Conectado" **fixo no HTML**, sem
 *    consultar nada. Para quem tinha, era coincidência; para quem não tinha,
 *    era mentira. E não dizia o que o vínculo dava nem o que faltava.
 * 2. Não havia lugar nenhum para o CPF nem para um segundo e-mail — as duas
 *    coisas que o produto realmente precisa saber sobre uma pessoa.
 *
 * ## As regras, na tela e no servidor
 *
 * O servidor é quem decide (`lib/identidade.ts`); aqui só explicamos. Mas as
 * frases importam: "só e-mail verificado serve para entrar" precisa estar
 * escrito ANTES de a pessoa adicionar um, ou o e-mail de contato vira uma
 * promessa de login que não se cumpre.
 */

interface EmailVinculado {
  email: string;
  verificado: boolean;
  origem: string;
  principal: boolean;
}

interface Identidade {
  principal: string;
  emails: EmailVinculado[];
  cpf: string | null;
  temCpf: boolean;
  google: { conectado: boolean; email?: string | null; foto?: string | null; publicacaoLiberada?: boolean };
}

export default function CartaoIdentidade() {
  const T = useT();
  const [dados, setDados] = useState<Identidade | null>(null);
  const [cpfTexto, setCpfTexto] = useState("");
  const [salvandoCpf, setSalvandoCpf] = useState(false);
  const [novoEmail, setNovoEmail] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    try {
      const r = await fetch("/api/account/identidade", {
        credentials: "include",
        headers: getClientAuthHeaders(),
        cache: "no-store",
      });
      if (!r.ok) return;
      setDados(await r.json());
    } catch {
      /* rede */
    }
  }, []);

  useEffect(() => {
    void buscar();
  }, [buscar]);

  const salvarCpf = async () => {
    if (!cpfValido(cpfTexto)) {
      toast.error(T("CPF inválido. Confira os números."));
      return;
    }
    setSalvandoCpf(true);
    try {
      const r = await fetch("/api/account/identidade", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ cpf: normalizarCpf(cpfTexto) }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d?.error || "Não deu para salvar o CPF");
        return;
      }
      toast.success(T("CPF confirmado ✅"));
      setCpfTexto("");
      await buscar();
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setSalvandoCpf(false);
    }
  };

  /**
   * Abre o consentimento do Google — o MESMO caminho da tela de login.
   *
   * ⚠️ A primeira versão disto era `<a href="/api/auth/google?...">`, e essa
   * rota só existe como `POST` (ela recebe o `idToken` do Google Identity
   * Services). O clique devolvia 405 e a tela que existe para acabar com o
   * "preciso logar de novo" quebrava exatamente ali. Aqui montamos a URL de
   * consentimento igual a `handleGoogleLogin` do `/login`, com o mesmo
   * `redirect_uri` de caminho plano — que é o único que funciona com o
   * Turbopack do Next 16 neste projeto.
   */
  const conectarGoogle = () => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '167078774916-ktdd044k8l528goetmjc7pdqkgrbranc.apps.googleusercontent.com';
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/google-callback`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('prompt', 'select_account');
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('state', window.location.pathname);
    window.location.assign(url.toString());
  };

  const adicionarEmail = async () => {
    setOcupado("novo");
    try {
      const r = await fetch("/api/account/identidade", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ email: novoEmail }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d?.error || "Não deu para vincular");
        return;
      }
      setNovoEmail("");
      toast.success(T("E-mail vinculado a esta conta"));
      await buscar();
    } catch {
      toast.error(T("Erro de rede"));
    } finally {
      setOcupado(null);
    }
  };

  const remover = async (email: string) => {
    setOcupado(email);
    try {
      const r = await fetch(`/api/account/identidade?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
        credentials: "include",
        headers: getClientAuthHeaders(),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d?.error || "Não deu para remover");
        return;
      }
      await buscar();
    } finally {
      setOcupado(null);
    }
  };

  const tornarPrincipal = async (email: string) => {
    setOcupado(email);
    try {
      const r = await fetch("/api/account/identidade", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ principal: email }),
      });
      const d = await r.json();
      if (!r.ok) {
        toast.error(d?.error || "Não deu para trocar o principal");
        return;
      }
      toast.success(T("Pronto — este é o e-mail principal"));
      await buscar();
    } finally {
      setOcupado(null);
    }
  };

  if (!dados) {
    return (
      <Card className="flex items-center justify-center bg-card p-8">
        <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Google ─────────────────────────────────────────────── */}
      <Card className="bg-card p-4 md:p-6">
        <h3 className="mb-1 text-base font-semibold md:text-lg">{T("Como você entra")}</h3>
        {/* ⚠️ A frase é CONDICIONAL. A primeira versão afirmava "você não
            precisa entrar de novo" logo acima de um botão "Conectar" — a tela
            se contradizendo na mesma dobra, que é o defeito que ela veio
            consertar. */}
        <p className="mb-4 text-sm text-muted-foreground">
          {/* ⚠️ O texto de "não conectado" NÃO afirma como a pessoa entra
              hoje. O vínculo é gravado no login, então quem entrou pelo Google
              antes desta versão ainda aparece sem vínculo — dizer "esta conta
              entra por e-mail e senha" seria afirmar como verdade uma coisa
              que a gente só descobre no próximo login dela. */}
          {dados.google.conectado
            ? T("Você não precisa entrar de novo: a conta que você usou para acessar já é a sua identidade aqui.")
            : T("O Google ainda não está ligado a esta conta. Ligando, você entra com um clique — e nome e foto vêm preenchidos de lá, sem você digitar nada.")}
        </p>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 md:p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
            {dados.google.foto ? (
              /* eslint-disable-next-line @next/next/no-img-element -- avatar remoto do Google; `next/image` recusa host não declarado */
              <img src={dados.google.foto} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{T("Google")}</p>
            <p className="truncate text-sm text-muted-foreground">
              {dados.google.conectado ? dados.google.email || dados.principal : T("não conectado")}
            </p>
          </div>
          {dados.google.conectado ? (
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              <Check size={12} className="mr-1" />
              {T("Conectado")}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" className="border-border" onClick={conectarGoogle}>
              {T("Conectar")}
            </Button>
          )}
        </div>

        {dados.google.conectado && !dados.google.publicacaoLiberada && (
          /* Honestidade que economiza um 403 na cara do usuário: identidade e
             permissão de publicar são autorizações diferentes. */
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            {T("Isto identifica você. Para publicar no YouTube em seu nome é preciso uma permissão extra — um clique, sem novo login.")}
          </p>
        )}
      </Card>

      {/* ── CPF ────────────────────────────────────────────────── */}
      <Card className={cn("bg-card p-4 md:p-6", !dados.temCpf && "border-amber-500/40")}>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-base font-semibold md:text-lg">CPF</h3>
          {dados.temCpf ? (
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              <BadgeCheck size={12} className="mr-1" />
              {T("confirmado")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/50 text-amber-400">
              <AlertTriangle size={12} className="mr-1" />
              {T("obrigatório")}
            </Badge>
          )}
        </div>

        {dados.temCpf ? (
          <>
            <p className="text-sm text-muted-foreground">
              {T("Sua conta está identificada. Recibos e cobranças saem neste documento.")}
            </p>
            <p className="mt-3 rounded-lg border border-border bg-secondary/40 px-3 py-2 font-mono text-lg tracking-wider">
              {dados.cpf}
            </p>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              {T("Um CPF por conta, e ele não muda sozinho — se estiver errado, fale com o suporte.")}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {T("É o que identifica a sua conta como sua: uma pessoa, uma conta. Também é o que a cobrança e o recibo exigem — preenchendo aqui, o checkout já vem pronto.")}
            </p>
            <div className="mt-3 flex max-w-sm gap-2">
              <Input
                value={cpfTexto}
                onChange={(e) => setCpfTexto(formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                className="border-border bg-secondary font-mono text-white"
              />
              {/* Com rótulo: um quadrado laranja com um escudo dentro não diz
                  se salva, verifica ou protege. */}
              <Button
                onClick={salvarCpf}
                disabled={salvandoCpf || !cpfValido(cpfTexto)}
                className="shrink-0 bg-amber-600 hover:bg-amber-700"
              >
                {salvandoCpf ? (
                  <Loader2 size={16} className="mr-1.5 animate-spin" />
                ) : (
                  <ShieldCheck size={16} className="mr-1.5" />
                )}
                {T("Confirmar")}
              </Button>
            </div>
            {cpfTexto.length >= 14 && !cpfValido(cpfTexto) && (
              <p className="mt-1.5 text-xs text-red-400">{T("Esse número não é um CPF válido.")}</p>
            )}
          </>
        )}
      </Card>

      {/* ── E-mails ────────────────────────────────────────────── */}
      <Card className="bg-card p-4 md:p-6">
        <h3 className="mb-1 text-base font-semibold md:text-lg">{T("Seus e-mails")}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {T("Você pode ter vários e-mails na mesma conta — o pessoal e o do trabalho, por exemplo. O mesmo e-mail nunca fica em duas contas.")}
        </p>

        <div className="space-y-2">
          {dados.emails.map((e) => (
            <div key={e.email} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
              <Mail size={15} className="shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{e.email}</span>

              {e.principal && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                  <Star size={11} className="mr-1" />
                  {T("principal")}
                </Badge>
              )}
              {/* ⚠️ "só contato" NÃO pode aparecer no principal: o principal é
                  a chave de login por definição, verificado ou não. Dizer que
                  o e-mail com que a pessoa entra "só serve para contato" é
                  informação falsa no lugar mais sensível da tela. */}
              {e.verificado ? (
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  <BadgeCheck size={11} className="mr-1" />
                  {T("verificado")}
                </Badge>
              ) : e.principal ? (
                <Badge variant="outline" className="border-white/20 text-muted-foreground">
                  {T("serve para entrar")}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/20 text-muted-foreground">
                  {T("só contato")}
                </Badge>
              )}

              {!e.principal && e.verificado && (
                <button
                  onClick={() => tornarPrincipal(e.email)}
                  disabled={ocupado === e.email}
                  className="cursor-pointer text-[11.5px] font-bold text-amber-400 hover:underline disabled:opacity-50"
                >
                  {T("tornar principal")}
                </button>
              )}
              {!e.principal && (
                <button
                  onClick={() => remover(e.email)}
                  disabled={ocupado === e.email}
                  aria-label={T("Remover e-mail")}
                  className="cursor-pointer text-muted-foreground transition-colors hover:text-red-400 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex max-w-md gap-2">
          <Input
            value={novoEmail}
            onChange={(ev) => setNovoEmail(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && novoEmail && adicionarEmail()}
            placeholder={T("outro@email.com")}
            className="border-border bg-secondary text-white"
          />
          <Button
            onClick={adicionarEmail}
            disabled={!novoEmail || ocupado === "novo"}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {ocupado === "novo" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </Button>
        </div>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {T("E-mail adicionado aqui serve para contato e recibo. Para ele também valer como login, entre uma vez com o Google usando esse endereço — assim a posse fica provada.")}
        </p>
      </Card>
    </div>
  );
}
