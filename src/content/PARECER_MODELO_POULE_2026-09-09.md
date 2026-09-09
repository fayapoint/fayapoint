# Parecer: a casa que deixa de ser a casa

**Sobre o modelo proposto pelo Ricardo em 09/09/2026.**
Análise regulatória, aritmética e de produto, com a conta executável em
`fayapoint-ai/src/lib/game/poule.ts` e provada em `scripts/game/_teste/poule.ts`.

---

## Veredito em três linhas

1. **O modelo tem nome, tem cem anos de uso e funciona: chama-se aposta mútua
   (pari-mutuel).** A intuição está certa — é exatamente assim que o totalizador
   do turfe opera, o mesmo precedente que você levantou.
2. **Com dinheiro de verdade, no Brasil, ele não tem caminho legal.** E não por
   pouco: é a única modalidade que a Lei 14.790/2023 **não** licencia, porque a
   lei licencia *quota fixa* e a poule é o oposto disso. Nem com os R$ 30
   milhões.
3. **Com ficha, funciona hoje, é melhor do que o que temos, e já está
   implementado e testado.** É onde a ideia se prova.

---

## 1. O que o modelo é, tecnicamente

O que você descreveu — bolo comum, comissão fixa da casa, o resto dividido entre
quem acertou em proporção ao que pôs, cotação saindo do volume — é **aposta
mútua**. A casa não tem posição: fatura igual se der favorito ou zebra.

A frase "deixamos de ser a casa" é literalmente verdadeira nesse desenho, e é a
diferença que importa: **numa casa de quota fixa, o lucro dela é a perda do
apostador.** Na poule, não. A casa quer volume, e apostador que ganha é bom para
ela, porque volta e traz gente.

Isso não é detalhe de marketing — é a raiz do conflito de interesse que faz
casas limitarem quem ganha. Sua intuição acertou o alvo certo.

---

## 2. Onde ele trava, com dinheiro real

### 2.1 A definição legal que fecha a porta

A Lei 14.790/2023 licencia **aposta de quota fixa**, definida como aquela em que
o apostador **sabe, no momento da aposta, quanto pode ganhar**.

Na poule, por construção, ninguém sabe: o pagamento só existe depois que o bolo
fecha. **Logo a poule não é quota fixa e não cabe na autorização da SPA.** Não é
que seja difícil de licenciar — é que a licença que existe não serve para ela.

### 2.2 E o lugar onde ela cabe já tem dono

Aposta mútua sobre esporte, no Brasil, existe e é legal: **Loteca e Lotogol**.
São loterias da Caixa Econômica Federal — modalidade de **monopólio da União**.

Ou seja: o formato que você propôs é exatamente o que a lei reservou ao Estado.
Um operador privado fazendo poule esportiva não está numa brecha; está na
modalidade mais fechada das duas.

**A ironia que vale registrar:** a quota fixa, que é o modelo "desonesto" que
você quer evitar, é a única que um privado pode operar.

### 2.3 O que a premissa do turfe faz e não faz

O turfe sobreviveu à proibição de 1946 por uma finalidade declarada (o
aprimoramento da raça equina, hoje na Lei 7.291/1984). Isso é **desenho
institucional**, e vale — está no art. 5º do nosso estatuto.

O que ele **não** faz é criar exceção nova. A ressalva do turfe é para corrida
de cavalo, administrada por entidade específica. Ela não se estende a esports
por analogia, e nenhuma finalidade dispensa autorização para aposta com valor.

---

## 3. A aritmética do fundo de devolução

Aqui está o ponto que precisa de conta, não de opinião. **Devolver a quem perdeu
só é possível tirando de dois lugares: da comissão, ou do bolo de quem ganhou.
Não existe terceira fonte.**

### 3.1 Se sair do bolo dos vencedores

Bolo de R$ 1.000. Comissão 10%. R$ 400 apostados no vencedor, R$ 600 nos
perdedores.

| | sem devolução | com devolução de 20% |
|---|---|---|
| distribuível | R$ 900 | R$ 900 − R$ 120 = R$ 780 |
| **paga por real apostado** | **2,25×** | **1,95×** |
| comissão efetiva sobre o vencedor | 10% | **22%** |

Uma casa de quota fixa comum trabalha com margem de 5% a 8%. Ou seja: a casa
"honesta" pagaria **pior a quem acerta** do que uma casa comum, para ser gentil
com quem erra. Isso afasta exatamente o apostador que traz volume.

**Por isso, na implementação, a devolução sai da comissão e nunca do bolo dos
vencedores.** Está travado em código e provado no teste: com e sem devolução, o
vencedor recebe os mesmos 2,25×.

### 3.2 Se sair da comissão, com dinheiro real

Rodei a conta (`contaComDinheiroReal`, valores da Lei 14.790):

```
movimento de R$ 1.000.000 em um ano, comissão de 10%

   receita bruta          R$ 100.000
   imposto (12% do GGR)   R$  12.000
   custo da devolução     R$ 120.000   ← 20% sobre R$ 600.000 de perdas
   SOBRA                  R$ -7.232.000
```

**A devolução de 20% custa R$ 120.000 e a comissão inteira arrecada R$ 100.000.**
Não é apertar o cinto: a conta não fecha por construção. Para a devolução caber
na comissão, ela teria de ficar abaixo de ~8% das perdas — e aí não sobra nada
para a casa existir.

E antes disso vem a outorga: **R$ 68,2 milhões de movimento por ano, R$ 341
milhões em cinco anos, só para pagar a licença** — sem plataforma, sem
verificação de identidade, sem atendimento, sem auditoria, sem devolução nenhuma.

### 3.3 "É impossível perder tudo"

Com devolução de 20%, quem põe R$ 100 e erra sai com R$ 20 — perdeu R$ 80. A
frase é verdadeira no sentido estrito e enganosa no sentido prático, e
publicidade de aposta que sugere risco reduzido é justamente o que a Lei
14.790 e as regras da SPA restringem. **Essa frase não pode ir para a tela** em
nenhuma versão, nem na de ficha.

---

## 4. A contradição das cotações

Você pediu odds "baseadas em performance, resultados anteriores **e** volume".
As duas coisas não podem decidir o mesmo pagamento:

- se o preço é fixado no momento da aposta pelo nosso modelo → é **quota fixa**,
  e a casa volta a ser contraparte, com o conflito de volta;
- se o pagamento sai da divisão do bolo → é **poule**, e quem decide é o volume.

**O jeito honesto de ter as duas:** o pagamento segue o bolo, e ao lado dele a
tela mostra o **valor justo segundo a nossa medida**. Aí o apostador vê onde a
multidão e o modelo discordam — que é informação de verdade, e é o produto que
ninguém oferece. É assim que o painel do totalizador funciona há décadas.

---

## 5. O que foi implementado

`src/lib/game/poule.ts`, com 21 asserções em `scripts/game/_teste/poule.ts`.
As regras que o teste trava:

- **o bolo fecha**: pagamento + comissão + devolução = total apostado, sempre.
  Ficha criada do nada é o defeito que arruína um sistema de apostas;
- **a projeção da tela é o pagamento da liquidação** — 2,25× projetado, 2,25×
  pago. Preço que descreve outro pagamento já custou caro aqui;
- **ninguém acertou → devolve tudo, comissão inclusive.** Ficar com a comissão
  de uma poule que não pagou ninguém seria a casa ganhando exatamente onde
  jurou não ganhar;
- **piso de 1,00**: quem acerta nunca recebe menos do que pôs. Se todo mundo
  apostar no mesmo lado, o custo do piso sai da comissão — medido: a casa fica
  com zero nesse caso;
- **a devolução sai da comissão e para quando a comissão acaba.** Nunca invade
  o bolo dos vencedores.

Falta ligar na mesa (modelo de bolo por evento, tela com projeção que se move,
liquidação). São peças de encanamento; a regra, que é o difícil, está pronta e
provada.

---

## 6. Recomendação

**Fazer, em ficha, e agora.** Três razões:

1. **É legal hoje**, sem licença nenhuma, porque ficha não tem valor econômico —
   a cláusula pétrea do art. 6º do estatuto.
2. **É melhor do que o que temos.** Hoje a mesa é quota fixa com margem de 4% a
   9% e nós somos a contraparte: simulamos exatamente o "a casa sempre ganha"
   que você quer deixar para trás.
3. **É a única forma de descobrir se o modelo prende gente.** Poule precisa de
   volume: com poucos apostadores os bolos ficam rasos e o pagamento vira
   loteria. Rodando em ficha a gente mede isso sem arriscar dinheiro de
   ninguém — e mede o número que qualquer conversa futura (parceria com
   operador licenciado, ou licença própria) vai exigir.

**Não fazer com dinheiro real**, e não por prudência: por não haver porta. A
única porta que existe é a quota fixa licenciada, que custa R$ 30 milhões e é
justamente o modelo que você não quer.

**O que eu faria em paralelo**, se quiser caminho para dinheiro: procurar
operador **já licenciado** para uma poule de esports como produto B2B. A licença
seria dele, o produto e o público nossos. Continua esbarrando na definição de
quota fixa, mas é a única mesa em que essa conversa pode existir.

---

## Fontes

- [Lei 14.790/2023 — texto](https://www2.camara.leg.br/legin/fed/lei/2023/lei-14790-29-dezembro-2023-795206-norma-pl.html)
- [SPA / Ministério da Fazenda — Apostas de Quota Fixa](https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apostas-de-quota-fixa)
- [Mayer Brown — aspectos societários, tributários e regulatórios](https://www.mayerbrown.com/pt/insights/publications/2024/02/the-corporate-tax-and-regulatory-aspects-of-brazils-esports-betting-law)
- [Pinheiro Neto — panorama da regulação](https://www.pinheironeto.com.br/Documents/storage/files/apostas-de-quota-fixa-no-brasil-atualizacao-do-panorama-sobre-a-regulacao-no-pais/apostas-de-quota-fixa-no-brasil-atualizacao-do-panorama-sobre-a-regulacao-no-pais.pdf)
- [Migalhas — apostas esportivas e jogos de azar: cenário legal](https://www.migalhas.com.br/depeso/416614/apostas-esportivas-e-jogos-de-azar-analise-do-cenario-legal-atual)

> Este parecer é análise de produto e de risco feita para decisão interna. Não é
> parecer jurídico, e a constituição de qualquer operação com valor deve ser
> precedida de advogado especializado em jogos.
