"use client";

/**
 * O selo de FORMATOS de um curso — o que dá para ler, ouvir e assistir.
 *
 * ## Por que ele existe
 *
 * A partir de 02/09/2026 alguns cursos têm audiobook e outros não, e depois
 * alguns terão vídeo e outros não. Sem um sinal na vitrine, a única forma de
 * descobrir é comprar e abrir — e quem quer estudar dirigindo não tem como
 * escolher o curso certo.
 *
 * ## Por que ele NÃO promete o que não existe
 *
 * O formato que ainda não foi produzido simplesmente **não aparece**. Nada de
 * ícone apagado com "em breve": um selo cinza continua sendo uma promessa na
 * vitrine, e a casa já tomou esse prejuízo antes (o degrau "Com audiobook"
 * ficou anunciado e não entregue de abril a setembro).
 *
 * O vídeo tem o lugar guardado no código, não na tela: quando `temVideo` passar
 * a ser verdade para um curso, o ícone aparece ali sem mais nada mudar.
 */

import { Headphones, BookOpen, Video } from "lucide-react";

import { cn } from "@/lib/utils";

export type Formato = "texto" | "audio" | "video";

const SELOS: Record<Formato, { icone: typeof BookOpen; rotuloPt: string; rotuloEn: string; cor: string }> = {
  texto: { icone: BookOpen, rotuloPt: "Texto", rotuloEn: "Text", cor: "text-sky-100 bg-sky-500/80 ring-sky-300/40" },
  audio: { icone: Headphones, rotuloPt: "Audiobook", rotuloEn: "Audiobook", cor: "text-white bg-violet-600/95 ring-violet-300/50" },
  video: { icone: Video, rotuloPt: "Vídeo", rotuloEn: "Video", cor: "text-white bg-amber-600/95 ring-amber-300/50" },
};

export function SeloDeFormato({
  formatos,
  ptBr = true,
  compacto = false,
  className,
}: {
  formatos: Formato[];
  ptBr?: boolean;
  /** Só os ícones, sem palavra — para caber na esquina de um cartão. */
  compacto?: boolean;
  className?: string;
}) {
  if (!formatos.length) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {formatos.map((f) => {
        const s = SELOS[f];
        if (!s) return null;
        const Icone = s.icone;
        const rotulo = ptBr ? s.rotuloPt : s.rotuloEn;
        return (
          <span
            key={f}
            title={rotulo}
            aria-label={rotulo}
            className={cn(
              // ⚠️ FUNDO SÓLIDO, NÃO `black/45`.
              // Sobre uma capa escura, um selo preto translúcido com texto de
              // 10px desaparece: ele estava lá desde 02/09 e o Ricardo, olhando
              // a vitrine, disse que não via diferença nenhuma nos cursos com
              // áudio. Selo que precisa ser procurado não sinaliza nada.
              "inline-flex items-center gap-1 rounded-full ring-1 shadow-lg shadow-black/30",
              s.cor,
              compacto ? "p-1.5" : "px-2.5 py-1",
            )}
          >
            <Icone size={compacto ? 13 : 12} aria-hidden="true" />
            {!compacto && <span className="text-[11px] font-bold tracking-wide">{rotulo}</span>}
          </span>
        );
      })}
    </div>
  );
}
