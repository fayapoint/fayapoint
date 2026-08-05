"use client";

/**
 * Uma faixa de vídeo decorativa para o topo de uma página.
 *
 * ── Por que ela existe ─────────────────────────────────────────────────────
 *
 * Sete vídeos estavam prontos em `D:\fayai\Videos\` com destino escrito no
 * inventário — e o inventário afirmava que havia "código que os espera". Não
 * havia: nenhuma das sete rotas era referenciada em `src/`. Os arquivos
 * entravam no `git clone`, subiam no deploy e nunca apareciam para ninguém.
 * Este componente é o código que faltava.
 *
 * ── As decisões ───────────────────────────────────────────────────────────
 *
 * `autoPlay muted loop playsInline` é a única combinação que os navegadores
 * deixam tocar sem gesto. Sem `muted`, o `play()` é recusado e a página mostra
 * um pôster parado fingindo ser vídeo.
 *
 * O pôster é obrigatório: sem ele, quem chega com a rede lenta vê um retângulo
 * preto exatamente onde a página promete movimento — pior do que não ter vídeo.
 *
 * `aria-hidden` porque é adorno. O conteúdo da página vive no HTML por cima; o
 * leitor de tela não ganha nada anunciando "vídeo" aqui, e ganha ruído.
 */
export function FaixaDeVideo({
  src,
  poster,
  altura = "h-[220px] sm:h-[300px]",
  className = "",
  children,
}: {
  /** Caminho do `.webm` a partir de `public/`. */
  src: string;
  /** Caminho do `.webp` do primeiro quadro. */
  poster: string;
  altura?: string;
  className?: string;
  /** Texto que vive por cima da faixa — sempre HTML, nunca gravado no vídeo. */
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-500/20 bg-black ${altura} ${className}`}
    >
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(4,5,11,.9) 0%, rgba(4,5,11,.5) 40%, rgba(4,5,11,.15) 70%, transparent 100%)",
        }}
      />
      {children && (
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">{children}</div>
      )}
    </div>
  );
}
