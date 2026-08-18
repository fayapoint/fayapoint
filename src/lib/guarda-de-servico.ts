import type { NextRequest } from "next/server";

import { verifyAdminToken } from "@/lib/admin-auth";

/**
 * Como uma máquina — ou um admin — prova quem é numa rota de serviço.
 *
 * ## Por que isto existe num arquivo só
 *
 * Porque a mesma decisão estava escrita em cinco rotas, e em três delas estava
 * **errada da mesma forma**. Levantamento de 18/08/2026, comparando o que o
 * código lê com o que existe de verdade no ambiente (`netlify env:list`):
 *
 * - `/api/admin/flush-ratelimits` — `GEOBLOCK_BYPASS_SECRET || "fayapoint-bypass-2024"`,
 *   variável ausente. O segredo em vigor era a string escrita no código, num
 *   **repositório público**. Zerava contadores e a lista de IPs bloqueados.
 * - `/api/security/stats` — `if (adminKey && ...)`. `ADMIN_API_KEY` ausente faz
 *   a condição inteira desaparecer: o `GET` publicava IPs bloqueados e strikes,
 *   e o `POST` deixava **qualquer um bloquear ou desbloquear qualquer IP** — que
 *   é negar o site a visitante legítimo, de graça.
 * - `/api/gate/verify` — caía na chave de teste da Cloudflare, que aprova tudo.
 *
 * O padrão que os três compartilham não é distração: é a forma
 * `if (SEGREDO && confere)`, que troca "não configurado" por "não protegido". A
 * regra certa é a inversa, e é a única aqui: **sem segredo configurado, ninguém
 * entra.**
 *
 * ## Qual segredo
 *
 * `SOCIAL_CRON_SECRET`, com `AINEWS_SECRET` de reserva — o par que
 * `radar/medir`, `social/publish-due`, `social/sync-due`, `emails/followup-due`
 * e o cron de notícias já usavam, e que **existe** no ambiente de produção.
 * Inventar uma variável nova por rota foi como se chegou a cinco nomes para uma
 * pergunta só, três deles nunca configurados.
 *
 * ⚠️ Nunca escreva `process.env.X || "algum-valor"` para um segredo neste
 * repositório. `github.com/fayapoint/fayapoint` é público: valor padrão de
 * senha é senha publicada.
 */
export function segredoDeServico(): string | undefined {
  return process.env.SOCIAL_CRON_SECRET || process.env.AINEWS_SECRET;
}

/**
 * Confere o segredo de serviço nos cabeçalhos indicados.
 *
 * Aceita mais de um nome porque as rotas antigas já publicaram os seus
 * (`x-admin-secret`, `x-cron-secret`) e quebrar um cron que funciona para
 * padronizar nome não paga o risco. `x-social-secret` é o nome novo.
 *
 * ⚠️ A comparação exige o segredo definido. Sem essa checagem, um cabeçalho
 * ausente (`null`) contra uma variável ausente (`undefined`) já falhou fechado
 * por acidente — `null === undefined` é falso — e código que depende de acidente
 * quebra na primeira refatoração que troca `headers.get()` por outra coisa.
 */
export function porSegredoDeServico(
  req: NextRequest | Request,
  cabecalhos: string[] = ["x-social-secret"],
): boolean {
  const segredo = segredoDeServico();
  if (!segredo) return false;
  return cabecalhos.some((nome) => req.headers.get(nome) === segredo);
}

/**
 * Segredo de serviço **ou** sessão de admin.
 *
 * Os dois chamadores são diferentes e nenhum serve para o outro: o script de
 * terminal não tem sessão, e o painel não deve carregar segredo de cron dentro
 * do navegador.
 */
export async function porSegredoOuAdmin(
  req: NextRequest,
  cabecalhos?: string[],
): Promise<boolean> {
  if (porSegredoDeServico(req, cabecalhos)) return true;
  const admin = await verifyAdminToken(req).catch(() => null);
  return Boolean(admin?.valid && admin.admin);
}
