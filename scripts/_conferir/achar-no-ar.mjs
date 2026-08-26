const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0 Safari/537.36' };
const alvo = process.argv[2] || '18 cursos';
const base = process.argv[3] || 'https://fayai.com.br';
const rotas = (process.argv[4] || '/pt-BR,/pt-BR/descobrir,/pt-BR/cursos').split(',');
const texto = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
for (const r of rotas) {
  await new Promise((s) => setTimeout(s, 400));
  const h = await (await fetch(base + r, { headers: UA })).text();
  const t = texto(h);
  let i = t.indexOf(alvo);
  while (i >= 0) {
    console.log(`${r}: …${t.slice(Math.max(0, i - 90), i + 60).trim()}…`);
    i = t.indexOf(alvo, i + 1);
  }
}
