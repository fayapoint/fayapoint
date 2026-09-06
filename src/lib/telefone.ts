import crypto from 'node:crypto';

/**
 * ── CELULAR: NORMALIZAR, MANDAR CÓDIGO E CONFERIR ────────────────────────────
 * 06/09/2026 · ver `autoresearch/PLANO_FUNDADORES_2026-09-05.md`, §7
 *
 * O celular verificado é a segunda prova de identidade do fundador — a primeira
 * é o CPF, que o banco já protege com índice único. Ele existe por um motivo
 * só: **CPF é caro de conseguir, mas é público**. Número de telefone não prova
 * quem a pessoa é; prova que existe um aparelho na mão dela, e é isso que
 * quebra a fazenda de contas.
 *
 * ## ⚠️ O CANAL AINDA NÃO EXISTE, E ISSO É UMA DEPENDÊNCIA, NÃO UM DEFEITO
 *
 * Medido em 06/09: não há credencial de WhatsApp Business nem de SMS em
 * nenhum `.env` do ecossistema (43 chaves no `.env.local` do site; a única de
 * mensagem é a do Resend, que é e-mail). Sem `WHATSAPP_TOKEN` e
 * `WHATSAPP_PHONE_ID`, este módulo cai no modo `console`: gera o código, grava
 * o hash e **escreve o código no log do servidor** em vez de mandar.
 *
 * O modo `console` serve para desenvolver e é recusado em produção
 * (`enviarCodigo` devolve `indisponivel`). Ou seja: **o programa Fundadores não
 * abre antes de existir o token do WhatsApp** — e isso é barato de resolver
 * (mensagem de autenticação custa centavos; cem fundadores custam menos de dez
 * reais). Está escrito aqui para não ser descoberto no dia do lançamento.
 */

const SEGREDO = process.env.OTP_SECRET || process.env.JWT_SECRET || '';
const MINUTOS_DE_VALIDADE = 10;
export const MAX_TENTATIVAS = 5;

/**
 * `(21) 99999-8888` → `5521999998888`.
 *
 * ⚠️ Sem normalizar, o mesmo aparelho vira várias identidades: a máscara muda,
 * o DDI aparece ou não, e a conferência de "mesmo telefone" do antifraude passa
 * a comparar strings diferentes que são a mesma pessoa. Tudo entra e sai daqui
 * em uma forma só.
 */
export function normalizarTelefone(bruto: string): string | null {
  const d = (bruto || '').replace(/\D/g, '');
  if (!d) return null;
  // Já veio com DDI 55 e 10 ou 11 dígitos depois.
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) return d;
  // Veio sem DDI: DDD + número.
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return null;
}

export function formatarTelefone(comDdi: string): string {
  const d = comDdi.replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return comDdi;
}

/** Seis dígitos, do gerador criptográfico — `Math.random()` é previsível. */
export function gerarCodigo(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashDoCodigo(codigo: string, telefone: string): string {
  return crypto
    .createHash('sha256')
    .update(`${codigo}:${telefone}:${SEGREDO}`)
    .digest('hex');
}

/**
 * Comparação em tempo constante.
 *
 * Com seis dígitos e um `===`, a diferença de tempo entre "errou no primeiro
 * dígito" e "errou no último" é medível pela rede em volume suficiente. O custo
 * de usar `timingSafeEqual` é zero; o de não usar só aparece quando alguém já
 * está explorando.
 */
export function confereHash(a: string, b: string): boolean {
  const A = Buffer.from(a, 'utf8');
  const B = Buffer.from(b, 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

export function validadeEmMinutos(): number {
  return MINUTOS_DE_VALIDADE;
}

export function expiraEm(): Date {
  return new Date(Date.now() + MINUTOS_DE_VALIDADE * 60 * 1000);
}

export type ResultadoEnvio =
  | { ok: true; canal: 'whatsapp' | 'sms' | 'console' }
  | { ok: false; motivo: 'indisponivel' | 'falhou'; detalhe?: string };

function canalConfigurado(): 'whatsapp' | 'console' {
  return process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID ? 'whatsapp' : 'console';
}

/**
 * Manda o código pelo canal que estiver configurado.
 *
 * O texto é curto de propósito: mensagem de autenticação do WhatsApp tem
 * formato próprio e não aceita enfeite. E ele diz o que o código serve para
 * fazer — código sem contexto é o que golpista pede por telefone.
 */
export async function enviarCodigo(
  telefone: string,
  codigo: string,
): Promise<ResultadoEnvio> {
  const canal = canalConfigurado();

  if (canal === 'console') {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[Telefone] SEM CANAL: defina WHATSAPP_TOKEN e WHATSAPP_PHONE_ID. ' +
          'Nenhum código foi enviado.',
      );
      return { ok: false, motivo: 'indisponivel' };
    }
    console.log(`[Telefone] (dev) código para ${telefone}: ${codigo}`);
    return { ok: true, canal: 'console' };
  }

  try {
    const r = await fetch(
      `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: telefone,
          type: 'text',
          text: {
            body: `${codigo} é o seu código da FayAI. Ele confirma o seu celular no programa Fundadores e vale por ${MINUTOS_DE_VALIDADE} minutos. Ninguém da FayAI vai pedir este código por telefone.`,
          },
        }),
      },
    );
    if (!r.ok) {
      const corpo = await r.text();
      console.error('[Telefone] WhatsApp recusou:', r.status, corpo.slice(0, 300));
      return { ok: false, motivo: 'falhou', detalhe: `HTTP ${r.status}` };
    }
    return { ok: true, canal: 'whatsapp' };
  } catch (e) {
    console.error('[Telefone] erro ao enviar:', e);
    return { ok: false, motivo: 'falhou' };
  }
}
