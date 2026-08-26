/**
 * A conferência do dia — roda contra um `next start` local (porta 3002).
 *
 * ⚠️ ANTES DE ACREDITAR NO RESULTADO: confira que o servidor está servindo o
 * build que você acabou de fazer. Em 26/08/2026 passei quarenta minutos
 * investigando três defeitos que não existiam porque o `next start` estava
 * servindo o `.next` do servidor de desenvolvimento — o `NEXT_DIST_DIR` tinha
 * sido engolido por um `set VAR=valor && …` do cmd, que guarda o espaço antes
 * do `&&` DENTRO do valor. Este script começa comparando o `BUILD_ID`.
 *
 *   node scripts/_conferir/conferir-tudo.mjs                     (local, 3002)
 *   node scripts/_conferir/conferir-tudo.mjs 3002 .next-verificacao
 *   node scripts/_conferir/conferir-tudo.mjs https://fayai.com.br  (produção)
 *
 * ⚠️ CONTRA PRODUÇÃO A VARREDURA SAI PELO IP DA CASA. São ~50 requisições, e
 * o limitador corta em 250/min por IP — foi assim que o Ricardo levou 429
 * navegando no próprio site em 26/08/2026. Por isso há uma pausa de 400 ms
 * entre pedidos quando o alvo não é localhost, e um 429 PARA a varredura em
 * vez de virar cinquenta falhas que não existem.
 * Ver `reference_429_por_ip_netlify`.
 */
import fs from 'fs';

const ARG = process.argv[2] || '3002';
const REMOTO = /^https?:\/\//.test(ARG);
const BASE = REMOTO ? ARG.replace(/\/$/, '') : `http://localhost:${ARG}`;
const DIST = process.argv[3] || '.next-verificacao';
const PAUSA = Number(process.env.PAUSA ?? (REMOTO ? 400 : 0));
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36' };

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const pegar = async (rota, opcoes = {}) => {
  if (PAUSA) await esperar(PAUSA);
  const res = await fetch(BASE + rota, { headers: UA, redirect: 'manual', ...opcoes });
  const corpo = await res.text();
  if (res.status === 429) {
    console.log(`\n⛔ ${rota} respondeu 429 — o limitador cortou a varredura, não o site.`);
    console.log('   Espere um minuto e rode com PAUSA=1000, ou meça no build local.');
    process.exit(2);
  }
  return { res, corpo };
};

let falhas = 0;
const conferir = (nome, ok, detalhe = '') => {
  if (!ok) falhas += 1;
  console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${nome}${detalhe ? '  — ' + detalhe : ''}`);
};

// 0. o servidor está servindo o build certo?
console.log(`\nalvo: ${BASE}${PAUSA ? `  (pausa de ${PAUSA} ms entre pedidos)` : ''}`);
if (REMOTO) {
  // Em produção não há `BUILD_ID` em disco para comparar; o que dá para
  // afirmar é que o alvo responde. As medidas abaixo falam por si.
  const { res } = await pegar('/pt-BR');
  conferir('o alvo responde', res.status === 200, String(res.status));
} else {
const buildId = fs.readFileSync(`${DIST}/BUILD_ID`, 'utf8').trim();
const { corpo: home } = await pegar('/pt-BR');
console.log(`build em ${DIST}: ${buildId}`);
conferir('o servidor serve ESTE build', home.includes(buildId),
  home.includes(buildId) ? '' : 'o HTML não cita este BUILD_ID — está servindo outra pasta');
if (!home.includes(buildId)) {
  console.log('\n⛔ pare aqui: qualquer medida abaixo é sobre outro build.');
  process.exit(1);
}
}

// 1. redirecionamentos estruturais (item 26 e 21)
console.log('\nredirecionamentos');
for (const [rota, esperado] of [
  ['/pt-BR/cursos/chatgpt-zero', '/pt-BR/curso/chatgpt-zero'],
  ['/en/cursos/chatgpt-zero', '/en/curso/chatgpt-zero'],
  ['/pt-BR/configuracoes', '/pt-BR/portal/conta?tab=preferencias'],
  ['/pt-BR/blog', '/pt-BR/noticias'],
]) {
  const { res } = await pegar(rota);
  conferir(`${rota} → 308`, res.status === 308 && (res.headers.get('location') || '').startsWith(esperado),
    `${res.status} ${res.headers.get('location') || ''}`);
}
for (const rota of ['/pt-BR/cursos/por-ferramenta', '/pt-BR/cursos/por-setor']) {
  const { res } = await pegar(rota);
  conferir(`${rota} continua 200 (não é slug)`, res.status === 200, String(res.status));
}

// 2. o hub de notícias e a rota de tag
console.log('\nnotícias');
for (const rota of ['/pt-BR/noticias', '/pt-BR/noticias/tag/MODELOS', '/en/noticias/tag/MODELOS']) {
  const { res } = await pegar(rota);
  conferir(`${rota} → 200`, res.status === 200, String(res.status));
}

// 3. as páginas que voltaram para o servidor (item 17)
console.log('\npáginas de servidor');
const servidor = ['termos', 'privacidade', 'faq', 'parcerias', 'afiliados', 'carreiras',
  'ajuda', 'instrutores', 'exclusao-de-dados', 'status', 'sobre', 'recursos/guias', 'api-docs'];
for (const r of servidor) {
  for (const loc of ['pt-BR', 'en']) {
    const { res, corpo } = await pegar(`/${loc}/${r}`);
    const marcacao = corpo.replace(/<script[\s\S]*?<\/script>/g, '');
    conferir(`/${loc}/${r}`, res.status === 200 && /<h1/.test(marcacao) && marcacao.length > 3000,
      `${res.status}, h1=${/<h1/.test(marcacao)}`);
  }
}

// 4. link interno sem idioma (item 20)
console.log('\nlinks internos');
for (const rota of ['/pt-BR', '/pt-BR/descobrir', '/pt-BR/casos', '/en/descobrir']) {
  const { corpo } = await pegar(rota);
  // ⚠️ Só `<a href>`. A primeira versão pegava qualquer `href=`, e acusava o
  // `<link rel="icon" href="/favicon.ico?…">` do `<head>` como link vazando —
  // três falsos positivos em toda página, porque a query burla o filtro de
  // extensão. Ícone não é navegação.
  const vaza = [...corpo.matchAll(/<a[^>]*href="(\/[^"]*)"/g)]
    .map((m) => m[1].split('?')[0])
    .filter((h) => !/^\/(en|pt-BR)(\/|$)/.test(h) && !/\.(webp|png|svg|ico|jpg|webm|mp4|json|xml|txt|css|js|webmanifest)$/.test(h)
      && !h.startsWith('/_next') && !h.startsWith('/api/') && h !== '/');
  const dup = [...corpo.matchAll(/href="\/(en|pt-BR)\/(en|pt-BR)\//g)].length;
  conferir(`${rota} sem link sem idioma`, vaza.length === 0, vaza.slice(0, 3).join(', '));
  conferir(`${rota} sem prefixo duplicado`, dup === 0, String(dup));
}

// 5. os números medidos (item 30)
console.log('\nnúmeros da vitrine');
const { corpo: catalogo } = await pegar('/pt-BR/cursos');
conferir('o catálogo soma 517 capítulos', catalogo.includes('517'));
conferir('sem "1.525"', !catalogo.includes('1.525'));
const { corpo: venda } = await pegar('/pt-BR/curso/make-integracao-total');
conferir('make-integracao diz 15 capítulos', /15[^0-9]{0,60}[Cc]ap/.test(venda));
conferir('sem "25+ horas"', !venda.includes('25+ horas'));
conferir('sem "Economize R$ NaN"', !venda.includes('NaN'));
const { corpo: vendaEn } = await pegar('/en/curso/make-integracao-total');
conferir('a versão inglesa não diz "25+ hours"', !vendaEn.includes('25+ hours'));

// 6. /en/casos em inglês (item 12)
console.log('\ninglês');
const { corpo: casosEn } = await pegar('/en/casos');
// ⚠️ Medir no TEXTO, não no HTML cru. A fatia do dicionário viaja no payload e
// é chaveada pelo português, então "Peças no acervo" aparece no HTML de
// `/en/casos` por desenho — como CHAVE, não como texto de tela.
const textoEn = casosEn.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
conferir('/en/casos com o cromo em inglês',
  textoEn.includes('Thirty-four years') && textoEn.includes('Pieces in the archive') && !textoEn.includes('Peças no acervo'));
const { corpo: casosPt } = await pegar('/pt-BR/casos');
conferir('/pt-BR/casos intacto', casosPt.includes('Trinta e quatro anos'));

console.log(`\n${falhas ? '⛔ ' + falhas + ' falha(s)' : '✓ tudo passou'}\n`);
process.exitCode = falhas ? 1 : 0;
