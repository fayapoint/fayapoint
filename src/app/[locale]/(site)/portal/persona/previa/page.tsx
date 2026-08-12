"use client";

import { notFound } from "next/navigation";
import { useState } from "react";
import PersonaConsole from "@/components/portal/PersonaConsole";
import type { Dossie } from "@/lib/persona";

/**
 * Prévia do Console da Persona — SÓ EM DESENVOLVIMENTO.
 *
 * ## Por que ela existe
 *
 * O console vive atrás de login, e fotografar tela logada exigiria autenticar
 * em nome do Ricardo — o que não se faz. Esta rota serve o MESMO componente com
 * um dossiê de mentira, para o laço de críticos julgar pixel de verdade.
 *
 * ⚠️ `notFound()` em produção. Rota de prévia que vaza para o ar é rota que
 * alguém acha pelo sitemap e confunde com o produto.
 */

const FIXTURE: Dossie = {
  confianca: 46,
  qualidade: "rascunho",
  resumo: "Confeiteira em Curitiba que vende bolo de pote e quer parar de responder o mesmo preço no direct.",
  dimensoes: [
    {
      id: "identidade",
      titulo: "Quem você é",
      paraQue: 'É o "eu" dos textos. Sem isto o conteúdo fala de você na terceira pessoa, como um release.',
      icone: "user",
      cor: "#f5c04e",
      confianca: 70,
      conhecido: [
        { rotulo: "O que você faz", valor: "Vendo produtos próprios pela internet", campo: "identidade.papel" },
        { rotulo: "Cidade", valor: "Curitiba", campo: "identidade.cidade" },
      ],
      faltando: [
        { campo: "identidade.marca", pergunta: "Que nome aparece para o cliente?", ganho: "É a assinatura de tudo que sai com a sua cara." },
        { campo: "identidade.missao", pergunta: "O que te fez começar?", ganho: "Vira a abertura das aulas e o fio das histórias." },
        { campo: "identidade.valores", pergunta: "O que você não abre mão?", ganho: "Define o que a IA nunca vai sugerir no seu lugar." },
      ],
    },
    {
      id: "voz",
      titulo: "Como você fala",
      paraQue: "A dimensão que mais muda o texto. Adjetivo de tom afina pouco; uma amostra sua afina tudo.",
      icone: "mic",
      cor: "#a78bfa",
      confianca: 30,
      conhecido: [],
      faltando: [
        { campo: "voz.bordoes", pergunta: "Quais frases são a sua marca?", ganho: "Entram no fim de cada peça, com as suas palavras." },
        { campo: "voz.vocabulario", pergunta: "Como você escolhe as palavras?", ganho: "Separa quem fala no balcão de quem escreve laudo." },
        { campo: "voz.formalidade", pergunta: "Quanto de formalidade?", ganho: "Calibra o texto entre conversa e documento." },
      ],
    },
    {
      id: "publico",
      titulo: "Com quem você fala",
      paraQue: 'Um post só é bom para alguém. Sem público definido a IA escreve para "todo mundo", que é ninguém.',
      icone: "users",
      cor: "#38bdf8",
      confianca: 20,
      conhecido: [],
      faltando: [
        { campo: "publico.quemE", pergunta: "Quem é a pessoa que te compra?", ganho: "Todo exemplo do curso passa a ser sobre ela." },
        { campo: "publico.dores", pergunta: "O que dói no seu cliente?", ganho: "Vira o gancho de abertura de cada peça." },
        { campo: "publico.desejos", pergunta: "O que ele quer de verdade?", ganho: "Vira a promessa — a que ele acredita." },
        { campo: "publico.lugares", pergunta: "Onde ele está?", ganho: "Escolhe o formato: reel, artigo ou direct." },
      ],
    },
    {
      id: "conteudo",
      titulo: "O que você publica",
      paraQue: "Define o formato, o comprimento e o calendário — e o que a IA não deve sugerir.",
      icone: "layers",
      cor: "#34d399",
      confianca: 65,
      conhecido: [{ rotulo: "Pilares", valor: "Bastidores do meu trabalho", campo: "estrategia.pilares" }],
      faltando: [
        { campo: "estrategia.naoFalar", pergunta: "Sobre o que você nunca fala?", ganho: "É a única lista que a IA respeita como proibição." },
        { campo: "estrategia.porSemana", pergunta: "Quantos posts por semana?", ganho: "Dimensiona o calendário que a gente monta." },
      ],
    },
    {
      id: "objetivo",
      titulo: "Onde você quer chegar",
      paraQue: "Muda a chamada para ação de cada peça — vender, ensinar e conversar pedem finais diferentes.",
      icone: "target",
      cor: "#fb7185",
      confianca: 10,
      conhecido: [],
      faltando: [
        { campo: "estrategia.assinatura", pergunta: "Como você encerra?", ganho: "É a chamada que fecha toda peça sua." },
        { campo: "aprendizado.objetivo", pergunta: "O que você quer conquistar em 90 dias?", ganho: "Ordena o que o curso te ensina primeiro." },
      ],
    },
    {
      id: "negocio",
      titulo: "O que você vende",
      paraQue: "Sem isto todo cálculo de retorno do curso é chute — e chute não convence ninguém.",
      icone: "store",
      cor: "#34d399",
      confianca: 55,
      conhecido: [{ rotulo: "Ticket médio", valor: "R$ 100", campo: "negocio.ticket" }],
      faltando: [
        { campo: "negocio.oQueVende", pergunta: "O que você vende, em uma frase?", ganho: "Todo exemplo do curso passa a usar o seu produto." },
        { campo: "negocio.canal", pergunta: "Por onde a venda acontece?", ganho: "Define onde a peça precisa funcionar." },
        { campo: "negocio.objecao", pergunta: 'Qual é o "mas" que você mais ouve?', ganho: "Vira a resposta pronta no fim do texto." },
        { campo: "negocio.clientesPorMes", pergunta: "Quantos clientes por mês?", ganho: "Dá escala real ao cálculo de retorno." },
      ],
    },
    {
      id: "aprendizado",
      titulo: "Como você aprende",
      paraQue: "É o que personaliza o CURSO, não o post: exemplos do seu ramo, ritmo e profundidade.",
      icone: "book",
      cor: "#facc15",
      confianca: 40,
      conhecido: [],
      faltando: [
        { campo: "aprendizado.ferramentas", pergunta: "O que você já usa hoje?", ganho: "O curso parte do que você tem, não do zero." },
        { campo: "aprendizado.travando", pergunta: "Onde você travou?", ganho: "Vira o capítulo que abre a sua trilha." },
        { campo: "aprendizado.ritmo", pergunta: "Como você prefere aprender?", ganho: "Define o tamanho de cada aula." },
      ],
    },
    {
      id: "rosto",
      titulo: "Seu rosto e sua marca",
      paraQue: "Sem imagem sua, todo post nasce com banco de imagens — e banco de imagens não constrói marca pessoal.",
      icone: "camera",
      cor: "#f472b6",
      confianca: 0,
      conhecido: [],
      faltando: [{ campo: "fotos.profissional", pergunta: "Uma foto profissional sua", ganho: "Entra em capa de curso e certificado." }],
    },
  ],
};

export default function PreviaConsole() {
  const [d, setD] = useState<Dossie>(FIXTURE);
  // `return null` deixaria uma página em branco de verdade no ar — soft 404 que
  // o Google indexa. `notFound()` devolve a 404 da casa.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden pt-16">
      <PersonaConsole dossie={d} onSalvo={setD} />
    </div>
  );
}
