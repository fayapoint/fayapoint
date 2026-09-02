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
  texto: { icone: BookOpen, rotuloPt: "Texto", rotuloEn: "Text", cor: "text-sky-300" },
  audio: { icone: Headphones, rotuloPt: "Audiobook", rotuloEn: "Audiobook", cor: "text-violet-300" },
  video: { icone: Video, rotuloPt: "Vídeo", rotuloEn: "Video", cor: "text-amber-300" },
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
              "inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-sm ring-1 ring-white/10",
              s.cor,
              compacto ? "p-1.5" : "px-2 py-1",
            )}
          >
            <Icone size={compacto ? 13 : 12} aria-hidden="true" />
            {!compacto && <span className="text-[10px] font-medium tracking-wide">{rotulo}</span>}
          </span>
        );
      })}
    </div>
  );
}
