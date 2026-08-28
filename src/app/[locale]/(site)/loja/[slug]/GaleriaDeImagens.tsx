"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GaleriaDeImagens({
  imagens,
  alt,
}: {
  imagens: string[];
  alt: string;
}) {
  const [atual, setAtual] = useState(0);
  const imagem = imagens[atual];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-gray-800/50 to-card/50">
        {imagem ? (
          <img src={imagem} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={64} className="text-gray-600" />
          </div>
        )}
      </div>
      {imagens.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imagens.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setAtual(i)}
              className={cn(
                "relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border transition",
                i === atual
                  ? "border-amber-500"
                  : "border-border opacity-70 hover:opacity-100"
              )}
            >
              <img src={img} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
