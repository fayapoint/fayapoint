/**
 * Recusa o href que sai com o idioma duas vezes: `/pt-BR/pt-BR/...`.
 *
 * ## O defeito que este portão existe para pegar
 *
 * `@/i18n/navigation` exporta um `Link` que prefixa o idioma SOZINHO. O
 * `next/link` normal não prefixa nada. Os dois convivem no repo de propósito
 * (o cabeçalho de `src/i18n/navigation.ts` explica por quê), e a regra é uma
 * só: no arquivo que importa o Link com idioma, nenhum href pode trazer o
 * `/${locale}` escrito à mão.
 *
 * Em 04/09/2026 o botão "voltar ao site" da barra do painel apontava para
 * `/pt-BR/pt-BR` e dava 404 em quem saía do painel. A migração de `next/link`
 * para o Link com idioma tinha limpado os hrefs escritos no JSX e deixado para
 * trás o único que era montado numa variável — `const cubeHref = ...`.
 *
 * ## Por que um portão e não um comentário
 *
 * O próprio `navigation.ts` já avisava, em maiúsculas, exatamente deste erro.
 * O aviso estava certo e não impediu nada: um href errado não quebra o build,
 * não quebra o `tsc`, não aparece no console. Só manda o aluno para um 404.
 *
 *   node scripts/_conferir/conferir-idioma-duplo.mjs
 */
import fs from 'fs';
import path from 'path';

const RAIZ = 'src';
const IMPORTA_LINK_COM_IDIOMA = /from\s+["']@\/i18n\/navigation["']/;

// Só interessa o que vira href. `router.push` do `next/navigation` PRECISA do
// prefixo à mão, e mora no mesmo arquivo com frequência — pegá-lo seria ruído.
const HREF_COM_IDIOMA = [
  /href\s*=\s*\{?\s*[`"']\/\$\{locale\}/,          // href={`/${locale}/...`}
  /href\s*=\s*\{?\s*[`"']\/(pt-BR|en)\//,          // href="/pt-BR/..."
  // ⚠️ `\bhref` NAO casa dentro de `cubeHref`: nao ha fronteira de palavra
  // antes do H maiusculo. Foi exatamente essa forma — o href montado numa
  // variavel — que escapou da migracao e foi para producao dando 404.
  /\w*[Hh]ref\w*\s*=\s*.*[`"']\/\$\{locale\}/,
  /\w*[Hh]ref\w*\s*=\s*.*locale\s*\?\s*[`"']\/\$\{/,
];

function arquivos(dir) {
  const saida = [];
  for (const nome of fs.readdirSync(dir)) {
    const p = path.join(dir, nome);
    const st = fs.statSync(p);
    if (st.isDirectory()) saida.push(...arquivos(p));
    else if (/\.(tsx?|jsx?)$/.test(nome)) saida.push(p);
  }
  return saida;
}

let achados = 0;
for (const arq of arquivos(RAIZ)) {
  const texto = fs.readFileSync(arq, 'utf8');
  if (!IMPORTA_LINK_COM_IDIOMA.test(texto)) continue;
  texto.split('\n').forEach((linha, i) => {
    if (linha.trimStart().startsWith('//') || linha.trimStart().startsWith('*')) return;
    if (HREF_COM_IDIOMA.some((re) => re.test(linha))) {
      achados += 1;
      console.log(`\n  ${arq}:${i + 1}`);
      console.log(`    ${linha.trim()}`);
    }
  });
}

if (achados) {
  console.log(`\n⛔ ${achados} href com idioma escrito à mão em arquivo que usa o Link de \`@/i18n/navigation\`.`);
  console.log('   Esse Link já prefixa o idioma — o href sai `/pt-BR/pt-BR/...` e dá 404.');
  console.log('   Tire o `/${locale}` do href. Se a rota precisa MESMO sair do idioma,');
  console.log('   use o `next/link` normal nesse ponto.\n');
  process.exit(1);
}
console.log('ok — nenhum href com idioma duplicado.');
