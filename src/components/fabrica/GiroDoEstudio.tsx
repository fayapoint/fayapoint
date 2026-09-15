"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * O GIRO DO ESTÚDIO — o "bullet time" depois da construção.
 *
 * O Ricardo pediu (15/09/2026): quando a montagem termina, a cena gira de
 * frente para o verso, e nos objetos ficam as informações. Clicar num objeto
 * abre um modal que nasce de um ZOOM naquele pedaço da imagem, no ângulo em
 * que a cena estiver.
 *
 * ## Como o zoom nasce do objeto
 *
 * Cada ponto tem coordenadas em % sobre a imagem daquele lado. Ao abrir, a
 * própria imagem recebe `transform-origin` no ponto e escala até ele — o modal
 * não aparece "por cima" da página: a câmera entra no objeto. Fechar desfaz o
 * mesmo caminho. É por isso que o recorte precisa ser a imagem inteira, e não
 * um pedaço cortado: a transição só é contínua se o pixel de partida for o
 * mesmo que a pessoa estava vendo.
 *
 * ## Os dois lados
 *
 * A frente e o verso são fotos 4K do MESMO estúdio. Enquanto o vídeo da órbita
 * não chega, a troca entre os dois é um giro de cartão em CSS; quando chegar, a
 * sequência de rolagem entra no lugar e os pontos continuam valendo nos dois
 * quadros de parada.
 *
 * ## Acessibilidade
 *
 * Os pontos são botões de verdade, na ordem de leitura. O modal é um
 * `role="dialog"` com foco no botão de fechar, Escape fecha e o foco volta ao
 * ponto de origem. Com movimento reduzido não há zoom: o painel só aparece.
 */

export type PontoDoEstudio = {
  id: string;
  /** Posição do centro do objeto na imagem, em % (0–100). */
  x: number;
  y: number;
  rotulo: string;
  titulo: string;
  texto: string;
  /** Linha pequena de procedência: de qual faixa ou horário a informação vem. */
  origem?: string;
};

type Lado = { src: string; alt: string; pontos: PontoDoEstudio[] };

export function GiroDoEstudio({ frente, verso }: { frente: Lado; verso: Lado }) {
  const [lado, setLado] = useState<"frente" | "verso">("frente");
  const [aberto, setAberto] = useState<PontoDoEstudio | null>(null);
  const origemFoco = useRef<HTMLButtonElement | null>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const atual = lado === "frente" ? frente : verso;

  const abrir = useCallback((p: PontoDoEstudio, botao: HTMLButtonElement) => {
    origemFoco.current = botao;
    setAberto(p);
  }, []);

  const fecharModal = useCallback(() => {
    setAberto(null);
    requestAnimationFrame(() => origemFoco.current?.focus());
  }, []);

  useEffect(() => {
    if (!aberto) return;
    fechar.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharModal();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, fecharModal]);

  return (
    <div className="fx-giro" data-lado={lado} data-aberto={aberto ? "sim" : "nao"}>
      <div className="fx-giro-cabeca">
        <div>
          <p className="fx-eyebrow">Por dentro da sua fábrica</p>
          <h2>
            Cada objeto é uma parte
            <br />
            <span>da sua empresa funcionando.</span>
          </h2>
        </div>
        <div className="fx-giro-lados" role="group" aria-label="Lado do estúdio">
          <button type="button" aria-pressed={lado === "frente"} onClick={() => setLado("frente")}>
            Frente
          </button>
          <button type="button" aria-pressed={lado === "verso"} onClick={() => setLado("verso")}>
            Verso
          </button>
        </div>
      </div>

      <div className="fx-giro-palco">
        <div
          className="fx-giro-cena"
          style={
            aberto
              ? ({ ["--zx" as string]: `${aberto.x}%`, ["--zy" as string]: `${aberto.y}%` } as React.CSSProperties)
              : undefined
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={atual.src} src={atual.src} alt={atual.alt} width={1920} height={1080} loading="lazy" decoding="async" />
          {!aberto &&
            atual.pontos.map((p) => (
              <button
                key={`${lado}-${p.id}`}
                type="button"
                className="fx-ponto"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onClick={(e) => abrir(p, e.currentTarget)}
                aria-haspopup="dialog"
              >
                <span className="fx-ponto-anel" aria-hidden="true" />
                <span className="fx-ponto-rotulo">{p.rotulo}</span>
              </button>
            ))}
        </div>

        {aberto && (
          <div className="fx-giro-modal" role="dialog" aria-modal="true" aria-labelledby={`giro-${aberto.id}`}>
            <button ref={fechar} type="button" className="fx-giro-fechar" onClick={fecharModal} aria-label="Fechar e voltar ao estúdio">
              <X size={18} aria-hidden="true" />
            </button>
            <p className="fx-eyebrow">{aberto.rotulo}</p>
            <h3 id={`giro-${aberto.id}`}>{aberto.titulo}</h3>
            <p>{aberto.texto}</p>
            {aberto.origem && <p className="fx-giro-origem">{aberto.origem}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
