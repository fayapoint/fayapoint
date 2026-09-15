"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FAIXAS, GRADE_DO_DIA, INVENTARIO, brl } from "@/lib/fabrica";

/**
 * MONTE A FÁBRICA DA SUA EMPRESA — a pergunta que a página inteira existe para responder.
 *
 * O Ricardo (15/09/2026): "quem está vendo vai pegar a empresa dele, contratar a gente e
 * fazer a empresa dele funcionar toda automática". Então, logo depois do filme, a pessoa
 * sai do "olha o que a FayAI faz" e entra no "o que acontece com a MINHA empresa".
 *
 * ## O que esta tela pode e não pode dizer
 *
 * - Pode: o dia que a operação roda (sai de `GRADE_DO_DIA`), onde as peças aparecem, e
 *   qual faixa corresponde a quanto do caminho a pessoa quer fazer sozinha (sai de `FAIXAS`).
 * - ⛔ Não pode: prometer venda, audiência ou faturamento. A fábrica publica; quem decide se
 *   interessa é quem lê — está no "o que isto não promete", e esta tela não contradiz aquilo.
 * - O ramo só muda o EXEMPLO de pauta, e o exemplo diz que é exemplo. Nenhum número por ramo
 *   é inventado aqui.
 *
 * Nada é enviado a lugar nenhum: o resumo vai no link do contato, e a pessoa decide se manda.
 */

/**
 * O WhatsApp de atendimento do site — o mesmo de `conversion/WhatsAppButton.tsx`,
 * `layout/Footer.tsx` e `home/CTASection.tsx` (não há constante compartilhada).
 *
 * ⚠️ O resumo vai por aqui, e não para `/contato`: a página de contato NÃO lê
 * parâmetros (conferido em 15/09/2026), então `?mensagem=...` chegava lá e sumia
 * calado — a pessoa montava a fábrica dela e começava a conversa do zero.
 */
const WHATSAPP = "5521971763780";

const RAMOS = [
  { id: "servicos", nome: "Serviços (consultoria, agência, escritório)", pauta: "o erro que o cliente comete antes de te contratar" },
  { id: "saude", nome: "Saúde e bem-estar", pauta: "a dúvida que o paciente faz toda semana" },
  { id: "educacao", nome: "Educação e cursos", pauta: "o conceito que o aluno trava para entender" },
  { id: "varejo", nome: "Loja e produtos", pauta: "o jeito certo de usar o produto mais vendido" },
  { id: "alimentacao", nome: "Restaurante e alimentação", pauta: "o bastidor do prato que mais sai" },
  { id: "imoveis", nome: "Imóveis e construção", pauta: "o que ninguém conta antes de fechar negócio" },
  { id: "tecnologia", nome: "Tecnologia e software", pauta: "o problema que o seu produto resolve em 30 segundos" },
  { id: "outro", nome: "Outro ramo", pauta: "a pergunta que você mais responde no seu trabalho" },
] as const;

/**
 * Onde cada peça do dia sai. ⚠️ Carrossel não existe no YouTube: a primeira versão
 * escrevia "Carrossel em Instagram e YouTube" — o tipo de frase errada que faz o
 * leitor desconfiar do resto. Carrossel vai para feed; reel vai para vídeo curto.
 */
const CANAIS = [
  { id: "instagram", nome: "Instagram", carrossel: true, reel: true },
  { id: "linkedin", nome: "LinkedIn", carrossel: true, reel: false },
  { id: "youtube", nome: "YouTube (aulas)", carrossel: false, reel: true },
  { id: "livro", nome: "Livro e audiobook", carrossel: false, reel: false },
] as const;

const juntar = (nomes: string[]) =>
  nomes.length <= 1 ? nomes[0] ?? "" : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

/** Quanto do caminho a pessoa quer fazer sozinha → a faixa. As frases são as de `FAIXAS.para`. */
const CAMINHOS = [
  { id: "pasta", titulo: "Eu mesmo construo", texto: "Já dirijo um agente e quero o mapa inteiro." },
  { id: "instalacao", titulo: "Construímos juntos", texto: "Quero a operação de pé sem descobrir sozinho onde trava." },
  { id: "fabrica", titulo: "Quero a fábrica inteira", texto: "Tenho acervo e quero que ele vire livro, áudio, aula e filme." },
] as const;

export function MonteSuaFabrica() {
  const [ramo, setRamo] = useState<(typeof RAMOS)[number]["id"] | "">("");
  const [canais, setCanais] = useState<string[]>(["instagram"]);
  const [caminho, setCaminho] = useState<(typeof CAMINHOS)[number]["id"] | "">("");

  const r = RAMOS.find((x) => x.id === ramo);
  // Pedir livro/audiobook é pedir esteira longa: só existe na Fábrica Inteira.
  const querLonga = canais.includes("livro") || canais.includes("youtube");
  const faixaId = caminho === "fabrica" || (caminho && querLonga) ? "fabrica" : caminho || null;
  const faixa = FAIXAS.find((f) => f.id === faixaId);
  const subiuDeFaixa = Boolean(caminho && caminho !== "fabrica" && querLonga);
  const pronto = Boolean(r && canais.length && caminho);

  const alternar = (id: string) =>
    setCanais((atual) => (atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]));

  const dia = useMemo(() => {
    if (!r) return [];
    const escolhidos = CANAIS.filter((c) => canais.includes(c.id));
    const feed = juntar(escolhidos.filter((c) => c.carrossel).map((c) => c.nome)) || "o seu feed";
    const video = juntar(escolhidos.filter((c) => c.reel).map((c) => c.id === "youtube" ? "YouTube Shorts" : c.nome)) || "o seu canal de vídeo";
    return GRADE_DO_DIA.map((d) => {
      if (d.hora === "12:00") return { hora: d.hora, texto: `Carrossel no ${feed}, com a sua marca — por exemplo, sobre ${r.pauta}.` };
      if (d.hora === "19:00") return { hora: d.hora, texto: `Reel narrado com a sua voz no ${video}, só depois de a transcrição bater com o roteiro.` };
      return { hora: d.hora, texto: d.longa };
    });
  }, [r, canais]);

  const resumo = pronto && faixa
    ? `Quero a fábrica da minha empresa. Ramo: ${r!.nome}. Canais: ${CANAIS.filter((c) => canais.includes(c.id)).map((c) => c.nome).join(", ")}. Faixa: ${faixa.nome}.`
    : "";

  return (
    <div className="fx-monte" data-pronto={pronto ? "sim" : "nao"}>
      <div className="fx-monte-cabeca">
        <p className="fx-eyebrow">Agora, a sua empresa</p>
        <h2>
          Monte a fábrica
          <br />
          <span>da sua empresa.</span>
        </h2>
        <p>
          Três respostas. Do outro lado, o dia da sua operação rodando sozinha — com a sua marca, a sua voz e as{" "}
          {INVENTARIO.portoes} medições que barram a peça ruim.
        </p>
      </div>

      <div className="fx-monte-grade">
        <form className="fx-monte-form" onSubmit={(e) => e.preventDefault()}>
          <fieldset>
            <legend>
              <span>1</span> Qual é o ramo da sua empresa?
            </legend>
            <div className="fx-monte-opcoes">
              {RAMOS.map((x) => (
                <label key={x.id} className="fx-monte-opcao" data-marcado={ramo === x.id}>
                  <input type="radio" name="ramo" value={x.id} checked={ramo === x.id} onChange={() => setRamo(x.id)} />
                  {x.nome}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>2</span> Onde a sua empresa precisa aparecer?
            </legend>
            <div className="fx-monte-opcoes fx-monte-opcoes--linha">
              {CANAIS.map((c) => (
                <label key={c.id} className="fx-monte-opcao" data-marcado={canais.includes(c.id)}>
                  <input type="checkbox" value={c.id} checked={canais.includes(c.id)} onChange={() => alternar(c.id)} />
                  {c.nome}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>
              <span>3</span> Quanto do caminho você quer fazer sozinho?
            </legend>
            <div className="fx-monte-opcoes">
              {CAMINHOS.map((c) => (
                <label key={c.id} className="fx-monte-opcao fx-monte-opcao--grande" data-marcado={caminho === c.id}>
                  <input type="radio" name="caminho" value={c.id} checked={caminho === c.id} onChange={() => setCaminho(c.id)} />
                  <b>{c.titulo}</b>
                  <small>{c.texto}</small>
                </label>
              ))}
            </div>
          </fieldset>
        </form>

        <aside className="fx-monte-resultado" aria-live="polite">
          {!pronto ? (
            <div className="fx-monte-vazio">
              <p className="fx-eyebrow">O dia da sua fábrica</p>
              <p>Responda as três perguntas e o dia da sua operação aparece aqui, hora por hora.</p>
            </div>
          ) : (
            <>
              <p className="fx-eyebrow">O dia da fábrica da sua empresa</p>
              <ol className="fx-monte-dia">
                {dia.map((d) => (
                  <li key={d.hora}>
                    <time>{d.hora}</time>
                    <p>{d.texto}</p>
                  </li>
                ))}
              </ol>
              {faixa && (
                <div className="fx-monte-faixa">
                  <p className="fx-eyebrow">A faixa que faz isso</p>
                  <h3>{faixa.nome}</h3>
                  <p>{faixa.corte}</p>
                  <p className="fx-monte-preco">{brl(faixa.preco)}</p>
                  {subiuDeFaixa && (
                    <p className="fx-monte-aviso">
                      <Check size={14} aria-hidden="true" /> Aula em vídeo no YouTube, livro e audiobook são as esteiras longas — elas estão na Fábrica Inteira.
                    </p>
                  )}
                  <a
                    className="fx-button fx-button-blue"
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(resumo)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Conversar sobre a minha fábrica <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                  <p className="fx-monte-nota">
                    Abre o WhatsApp com este resumo já escrito — você revisa antes de enviar. Prefere e-mail?{" "}
                    <Link href="/contato">Use o formulário</Link>. O exemplo de pauta é só um exemplo; a pauta real sai da
                    sua entrevista.
                  </p>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
