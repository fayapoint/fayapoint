import { createReadStream, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

import { NextResponse } from 'next/server';

import { getMongoClient } from '@/lib/products';

/**
 * A BANCADA DA LENTE — só em desenvolvimento.
 *
 * ## Por que ela existe (05/09/2026)
 *
 * A lente já foi reescrita quatro vezes e nunca teve como ser vista funcionando
 * sem uma conta com o curso comprado, um link assinado do Cloudinary com prazo
 * e um capítulo narrado. Resultado prático: cada mudança era conferida por
 * leitura de código, e três defeitos medidos (o `<span>` que derrubava a página,
 * o `scrollTop` cravado em zero, o aumento que o React reescrevia) só
 * apareceram no uso.
 *
 * Esta rota junta, em uma resposta, o que a lente precisa para ser vista de
 * verdade: o TEXTO do capítulo (a mesma fonte que o leitor usa,
 * `fayapointProdutos.products.courseContent`), a LINHA DO TEMPO gerada pelo
 * montador, e o caminho do áudio e do vídeo montados na máquina.
 *
 * ⛔ NUNCA EM PRODUÇÃO. Ela serve arquivo do disco e não confere acesso
 * nenhum — o audiobook é degrau pago. O portão é o primeiro `if` de cada
 * handler, e o teste é `NODE_ENV`, não uma variável que alguém possa ligar.
 */

export const dynamic = 'force-dynamic';

const RAIZ = path.resolve(process.cwd(), '..');
const NARRACAO = path.join(RAIZ, 'cursos', 'audio', 'saida');
const VIDEOS = path.join(RAIZ, 'outputs', 'aulas');

/** A mesma quebra que o leitor usa: um `#` de primeiro nível por capítulo. */
const CORTE = /\n(?=#\s)/;

function proibidoForaDoDesenvolvimento() {
  return process.env.NODE_ENV !== 'development';
}

/**
 * Serve um arquivo grande com suporte a Range.
 *
 * Sem `Accept-Ranges` o Chrome toca o arquivo e RECUSA pular no tempo — e a
 * bancada existe justamente para conferir que pular no tempo move a lente.
 */
function servirArquivo(arquivo: string, mime: string, range: string | null) {
  const { size } = statSync(arquivo);
  if (!range) {
    const fluxo = Readable.toWeb(createReadStream(arquivo)) as ReadableStream;
    return new Response(fluxo, {
      headers: { 'Content-Type': mime, 'Content-Length': String(size), 'Accept-Ranges': 'bytes' },
    });
  }
  const [de, ate] = range.replace(/bytes=/, '').split('-');
  const inicio = Number(de) || 0;
  const fim = ate ? Number(ate) : size - 1;
  const fluxo = Readable.toWeb(createReadStream(arquivo, { start: inicio, end: fim })) as ReadableStream;
  return new Response(fluxo, {
    status: 206,
    headers: {
      'Content-Type': mime,
      'Content-Length': String(fim - inicio + 1),
      'Content-Range': `bytes ${inicio}-${fim}/${size}`,
      'Accept-Ranges': 'bytes',
    },
  });
}

export async function GET(request: Request) {
  if (proibidoForaDoDesenvolvimento()) {
    return NextResponse.json({ erro: 'só em desenvolvimento' }, { status: 404 });
  }

  const url = new URL(request.url);
  const curso = (url.searchParams.get('curso') || 'chatgpt-zero').replace(/[^a-z0-9-]/gi, '');
  const cap = Number(url.searchParams.get('cap') || 3);
  const nn = String(cap).padStart(2, '0');
  const peca = url.searchParams.get('peca');

  if (peca === 'audio') {
    const arquivo = path.join(NARRACAO, curso, `cap${nn}.m4a`);
    if (!existsSync(arquivo)) return NextResponse.json({ erro: 'sem áudio montado' }, { status: 404 });
    return servirArquivo(arquivo, 'audio/mp4', request.headers.get('range'));
  }

  if (peca === 'video') {
    const arquivo = path.join(VIDEOS, curso, `cap${nn}.mp4`);
    if (!existsSync(arquivo)) return NextResponse.json({ erro: 'sem vídeo montado' }, { status: 404 });
    return servirArquivo(arquivo, 'video/mp4', request.headers.get('range'));
  }

  // ── O pacote: texto + régua ────────────────────────────────────────────────
  const tempos = path.join(NARRACAO, curso, `cap${nn}.tempos.json`);
  if (!existsSync(tempos)) {
    return NextResponse.json({ erro: `sem ${curso}/cap${nn}.tempos.json` }, { status: 404 });
  }
  const { readFile } = await import('node:fs/promises');
  const linhaDoTempo = JSON.parse(await readFile(tempos, 'utf8'));

  // O texto vem da MESMA origem que o leitor mostra ao aluno. Qualquer outra
  // origem faria a bancada aprovar uma sincronia que não existe na página real
  // — ver o cabeçalho de `cursos/audio/fonte.mjs`.
  const cliente = await getMongoClient();
  const doc = await cliente
    .db('fayapointProdutos')
    .collection('products')
    .findOne({ slug: curso }, { projection: { courseContent: 1 } });

  const secoes = typeof doc?.courseContent === 'string' ? doc.courseContent.split(CORTE) : [];
  // A seção 0 é a abertura do curso, não é aula: o capítulo N é a seção N.
  const markdown = secoes[cap] ?? null;

  return NextResponse.json({
    curso,
    capitulo: cap,
    markdown,
    secoes: secoes.length,
    linhaDoTempo,
    audio: `/api/prova-lente?curso=${curso}&cap=${cap}&peca=audio`,
    video: `/api/prova-lente?curso=${curso}&cap=${cap}&peca=video`,
    temVideo: existsSync(path.join(VIDEOS, curso, `cap${nn}.mp4`)),
  });
}
