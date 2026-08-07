import { useT } from "@/i18n/dicionario";
import { Quote, AlertTriangle } from "lucide-react";
import type { Secao } from "@/data/microcursos/tipos";

/**
 * Renderização dos blocos de conteúdo de um microcurso.
 *
 * São componentes de servidor de propósito: o conteúdo pago é recortado antes
 * de chegar aqui, e nada que dependa do plano deve viajar para o cliente.
 */

/**
 * Converte o `**negrito**` do texto-fonte em `<strong>`.
 *
 * Não é markdown completo e não deve virar: a entrada vem dos nossos próprios
 * arquivos de dados, não de usuário, e um interpretador de markdown aqui
 * traria superfície de ataque e peso sem resolver problema nenhum. Se um dia
 * a fonte passar a ser externa, isto precisa de sanitização.
 */
export function Negrito({ texto }: { texto: string }) {
  const T = useT();
  const partes = texto.split("**");
  return (
    <>
      {partes.map((parte, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-white">
            {T(parte)}
          </strong>
        ) : (
          <span key={i}>{T(parte)}</span>
        ),
      )}
    </>
  );
}

export function BlocoSecao({ secao }: { secao: Secao }) {
  const T = useT();
  switch (secao.tipo) {
    case "paragrafo":
      return (
        <p className="text-[15px] leading-relaxed text-white/75">
          <Negrito texto={T(secao.texto)} />
        </p>
      );

    case "lista":
      return (
        <ul className="space-y-2.5">
          {secao.itens.map((item, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/75">
              <span
                aria-hidden
                className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5c04e]"
              />
              <span>
                <Negrito texto={T(item)} />
              </span>
            </li>
          ))}
        </ul>
      );

    case "passos":
      return (
        <ol className="space-y-3">
          {secao.itens.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[15px] leading-relaxed text-white/75">
              <span
                aria-hidden
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#f5c04e]/40 bg-[#f5c04e]/10 text-[12px] font-semibold text-[#f5c04e]"
              >
                {i + 1}
              </span>
              <span>
                <Negrito texto={T(item)} />
              </span>
            </li>
          ))}
        </ol>
      );

    case "citacao":
      return (
        <figure className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <Quote aria-hidden className="mb-2 h-4 w-4 text-[#f5c04e]/70" />
          <blockquote className="text-[15px] italic leading-relaxed text-white/80">
            {T(secao.texto)}
          </blockquote>
          {/* Dizia "Fonte, aos 04:08". O minuto era o último rastro da origem
              que sobrou depois de 03/08/2026: junto com o texto da citação —
              que é pesquisável — ele diz que existe um vídeo e onde procurar.
              O `minuto` continua no dado, para auditoria; a legenda agora
              atribui a fala a quem a fez, que é a informação útil ao leitor. */}
          <figcaption className="mt-2.5 text-xs text-white/45">
            
            {T("Da demonstração oficial")}
          </figcaption>
        </figure>
      );

    case "alerta":
      return (
        <div className="flex gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-4">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-[14px] leading-relaxed text-amber-100/85">
            <Negrito texto={T(secao.texto)} />
          </p>
        </div>
      );
  }
}

export function Secoes({ secoes }: { secoes: Secao[] }) {
  return (
    <div className="space-y-4">
      {secoes.map((secao, i) => (
        <BlocoSecao key={i} secao={secao} />
      ))}
    </div>
  );
}
