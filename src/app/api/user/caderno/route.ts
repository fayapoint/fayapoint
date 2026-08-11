import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getAuthUser } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/course-tiers";
import { debitar, saldoParaGastar } from "@/lib/creditos";
import { getPrecos } from "@/lib/precos-runtime";
import type { PersonaProfunda } from "@/lib/persona";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * O CADERNO DE PERSONAGEM (03/08/2026).
 *
 * ## Para que serve
 *
 * Ricardo: *"devemos também pedir mais fotos de perfil e dar a opção de gerar
 * um character sheet dele que custará créditos, entretanto, será detrimental
 * para que tenhamos um avatar que trará resultados eficazes e realista."*
 *
 * Uma foto só produz uma imagem parecida. O que faz o rosto SOBREVIVER a vinte
 * imagens diferentes — de frente, de perfil, sorrindo, sério — é ter o mesmo
 * rosto registrado em vários ângulos primeiro. É isso que este caderno é: o
 * insumo, não o produto.
 *
 * ## Por que não é LoRA
 *
 * Treinar um LoRA do rosto real foi estudado e descartado: exige dezenas de
 * fotos, GPU por horas e ainda erra. O caminho que funciona é **edição por
 * referência** — mandar a foto real junto do prompt e pedir o mesmo rosto em
 * outro ângulo. É o mesmo caminho que o Studio já usa quando recebe
 * `referenceImage`, e por isso este arquivo repete aquele desenho em vez de
 * inventar outro.
 *
 * ## A ordem que protege o aluno
 *
 * 1. Confere saldo ANTES de gerar (senão gastaríamos API sem lastro).
 * 2. Gera os ângulos, um a um, tolerando falha individual.
 * 3. **Cobra no fim, proporcional ao que saiu.** Zero imagens, zero créditos.
 *
 * É a mesma ordem do Ateliê, e pelo mesmo motivo: cobrar antes obriga a
 * estornar depois, e estorno é a parte que sempre quebra.
 */

/** Os ângulos do caderno. Quatro cobre o uso real sem fazer o aluno esperar demais. */
const ANGULOS = [
  {
    id: "frente",
    prompt:
      "Retrato frontal, olhando direto para a câmera, expressão neutra e confiante, luz suave de estúdio, fundo neutro desfocado, foto realista, alta definição",
  },
  {
    id: "tres-quartos",
    prompt:
      "Retrato em três quartos, rosto levemente virado, olhar para a câmera, luz suave lateral, fundo neutro desfocado, foto realista, alta definição",
  },
  {
    id: "sorrindo",
    prompt:
      "Retrato frontal sorrindo de forma natural e acolhedora, luz quente de estúdio, fundo neutro desfocado, foto realista, alta definição",
  },
  {
    id: "trabalhando",
    prompt:
      "Retrato de meio corpo em ambiente de trabalho, postura profissional, olhando para a câmera, luz natural, fundo levemente desfocado, foto realista, alta definição",
  },
] as const;

const MODELO_REFERENCIA = "google/gemini-3-pro-image-preview";

export async function POST() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await dbConnect();
    const user = await User.findById(authUser.id).select("socialPersona name image credits");
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const persona = (user.socialPersona || {}) as unknown as PersonaProfunda;
    const fotos = persona.fotos || [];

    /**
     * ⚠️ Exige uma foto REAL enviada, não o avatar do Google.
     *
     * O avatar costuma ter 96 pixels e vir cortado no rosto — dele não sai
     * caderno nenhum, sai borrão em quatro ângulos. Recusar aqui é mais barato
     * (e muito menos frustrante) do que cobrar 40 créditos por quatro borrões.
     */
    const base = fotos.find((f) => f.origem !== "google" && f.url) || null;
    if (!base) {
      return NextResponse.json(
        {
          error:
            "Para montar o caderno preciso de uma foto sua enviada por você — o avatar da conta Google é pequeno demais e sairia borrado.",
          precisaFoto: true,
        },
        { status: 422 },
      );
    }

    /**
     * ── O PRIMEIRO É DE GRAÇA, OS SEGUINTES CUSTAM 20 (11/08/2026) ──────────
     *
     * Ricardo: *"caderno de personagem, 1 – 0 e demais refaturas ou personagens
     * – 20"*.
     *
     * A régua é a EXISTÊNCIA de um caderno pronto, não uma contagem: quem nunca
     * teve rosto no sistema entra sem pagar — é o insumo que faz "curso com o
     * SEU rosto" deixar de ser promessa —, e quem já viu o próprio caderno
     * funcionando está refazendo por escolha (mudou a foto, quer outro
     * personagem) e paga por isso.
     *
     * ⚠️ Preço lido de `getPrecos()`, não de `CREDIT_COSTS`: os dois números
     * são editáveis no Mission Control, e ler a constante aqui faria o painel
     * mostrar 20 enquanto esta rota cobra 40.
     */
    const jaTemCaderno = Boolean(
      (persona as { caderno?: { imagens?: string[] } }).caderno?.imagens?.length,
    );
    const acaoCobranca = jaTemCaderno ? 'character_sheet_extra' : 'character_sheet';
    const precos = await getPrecos();
    const custo = precos.custos[acaoCobranca] ?? CREDIT_COSTS[acaoCobranca];

    const saldo = await saldoParaGastar(String(user._id));
    if (custo > 0 && saldo.total < custo) {
      return NextResponse.json(
        {
          error: `Refazer o caderno custa ${custo} créditos (= R$${custo}) e você tem ${saldo.total}. O primeiro caderno é gratuito; este é um novo.`,
          creditosNecessarios: custo,
          creditosDisponiveis: saldo.total,
          faltam: custo - saldo.total,
        },
        { status: 402 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Geração de imagem indisponível agora" }, { status: 503 });
    }
    const auth = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;

    const imagens: string[] = [];
    const falhas: string[] = [];

    for (const angulo of ANGULOS) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://fayai.com.br",
            "X-Title": "Fayapoint AI",
          },
          body: JSON.stringify({
            model: MODELO_REFERENCIA,
            modalities: ["image", "text"],
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      `${angulo.prompt}. ` +
                      `MANTENHA EXATAMENTE o mesmo rosto, o mesmo tom de pele, o mesmo cabelo e a mesma ` +
                      `estrutura facial da pessoa da imagem de referência. Não idealize, não rejuvenesça ` +
                      `e não mude traços — a semelhança é o objetivo.`,
                  },
                  { type: "image_url", image_url: { url: base.url } },
                ],
              },
            ],
          }),
        });

        if (!r.ok) {
          falhas.push(`${angulo.id}: ${r.status}`);
          continue;
        }
        const data = await r.json();
        const msg = data?.choices?.[0]?.message;
        const cru: string | null =
          msg?.images?.[0]?.image_url?.url ||
          msg?.content?.match(/https?:\/\/[^\s)"]+/)?.[0] ||
          msg?.content?.match(/data:image\/[^;]+;base64,[^"\s)]+/)?.[0] ||
          null;
        if (!cru) {
          falhas.push(`${angulo.id}: sem imagem`);
          continue;
        }

        // Sobe para o Cloudinary; se falhar, guarda a URL crua mesmo assim —
        // a imagem já foi paga ao provedor e perder o link seria jogar fora o
        // que o aluno comprou (é o defeito de 20/07, no Studio).
        let url = cru;
        try {
          const up = await cloudinary.uploader.upload(cru, {
            folder: "fayapoint-caderno",
            context: { username: user.name || "", angulo: angulo.id },
          });
          url = up.secure_url;
        } catch (e) {
          console.error("[caderno] Cloudinary falhou, mantendo URL crua:", e);
        }
        imagens.push(url);
      } catch (e) {
        falhas.push(`${angulo.id}: ${e instanceof Error ? e.message : "erro"}`);
      }
    }

    if (!imagens.length) {
      return NextResponse.json(
        { error: "Não deu para montar o caderno agora. Nada foi cobrado.", falhas },
        { status: 502 },
      );
    }

    await User.findByIdAndUpdate(authUser.id, {
      $set: {
        "socialPersona.caderno": {
          imagens,
          origem: [base.url],
          geradoEm: new Date(),
          status: "pronto",
        },
      },
      // A persona mudou de verdade: subir a versão faz as camadas de curso já
      // geradas se declararem desatualizadas, que é o comportamento certo —
      // agora dá para ilustrar com o rosto dele.
      $inc: { "socialPersona.personaVersion": 1 },
    });

    // Proporcional: se saíram 3 de 4 ângulos, cobra 3/4. Cobrar cheio por
    // caderno incompleto seria vender o que não foi entregue.
    //
    // ⚠️ No primeiro caderno o preço é zero e `debitar` devolve `ok` sem tocar
    // no saldo nem no extrato — de propósito. Um lançamento de "-0 créditos" no
    // extrato do aluno é ruído que ele tem de interpretar.
    const cobranca = await debitar(
      authUser.id,
      acaoCobranca,
      imagens.length / ANGULOS.length,
      `${jaTemCaderno ? "Novo caderno de personagem" : "Caderno de personagem (primeiro, gratuito)"}`
        + ` — ${imagens.length} de ${ANGULOS.length} ângulos`,
    );

    return NextResponse.json({
      imagens,
      angulos: imagens.length,
      totalAngulos: ANGULOS.length,
      primeiroGratuito: !jaTemCaderno,
      creditosGastos: cobranca.ok ? cobranca.gasto : 0,
      creditosRestantes: cobranca.restante,
      falhas: falhas.length ? falhas : undefined,
    });
  } catch (error) {
    console.error("[caderno] POST", error);
    return NextResponse.json({ error: "Erro ao montar o caderno" }, { status: 500 });
  }
}
