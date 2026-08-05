import { cenaDoCurso, fundosDoCurso } from "@/data/curso-midia";

/**
 * A atmosfera do topo da página de curso — três fotografias que se fundem.
 *
 * Ricardo, 05/08/2026, em dois pedidos seguidos:
 * *"devemos ter uma imagem logo no início dos cursos, e que ela fique de fundo,
 * onde temos um blur para não atrapalhar a leitura e um esmaecimento com
 * gradient nos cantos para que não fique duro"*, e depois:
 * *"essa imagem na capa eu gostaria que fosse fotorealista, para dar uma
 * sensação de conexão do curso com a realidade, e que fique diferente para dar
 * uma respirada no estilo abstrato e sci fi que utilizamos … onde elas vão
 * fundir entre elas e criar uma sensação de constante movimento mas de leve e
 * alternar com zoom bem lento"*.
 *
 * ── As decisões, e o porquê de cada uma ────────────────────────────────────
 *
 * **1. Fotografia, e não a linguagem de cristal do resto do site.** O site
 * inteiro fala em cristal sobre navy — capas, cenas, artes de seção. Isso dá
 * unidade, e em excesso dá irrealidade: o visitante vê um mundo que não é o
 * dele. O topo é o lugar certo para a exceção, porque é onde ele decide se
 * aquilo tem a ver com a vida dele. Debaixo do texto, e desfocado, a foto não
 * briga com o cristal — ela dá chão a ele.
 *
 * **2. Três, não uma.** Uma foto parada num topo é papel de parede; o olho
 * registra e descarta. Três que se atravessam mantêm a página viva sem pedir
 * atenção — e cada uma mostra um recorte diferente da mesma realidade.
 *
 * **3. `blur(34px)` com `scale`.** O desfoque puxa pixels de fora da caixa;
 * sem ampliar antes, aparece uma faixa clara de ~34px em cada borda, o defeito
 * clássico de fundo borrado. A escala do zoom (1,1 a 1,26) já cobre isso com
 * folga em toda a animação.
 *
 * **4. A máscara é RADIAL, não linear.** Um degradê linear resolve duas bordas
 * e deixa as outras duas cortadas — e o pedido foi justamente "nos cantos". A
 * elipse dissolve os quatro ao mesmo tempo, e o centro, onde mora o título,
 * fica cheio.
 *
 * **5. `opacity: .3` mais um véu escuro.** O texto do herói é branco; qualquer
 * fundo mais forte derruba o contraste do subtítulo, que é o texto mais fino
 * da página. O fundo é atmosfera, não ilustração — se disputar com a leitura,
 * perdeu.
 *
 * A degradação é em três degraus: três fotos → a cena 1 do curso → a capa.
 * Some por inteiro se não houver nenhuma das três.
 */
export function FundoDoCurso({
  slug,
  reserva,
}: {
  slug: string;
  /** A capa do curso, último recurso. */
  reserva?: string | null;
}) {
  const fotos = fundosDoCurso(slug);
  const camadas = fotos.length
    ? fotos
    : [cenaDoCurso(slug, 0)?.src ?? reserva].filter(Boolean as unknown as (v: string | null | undefined) => v is string);

  if (!camadas.length) return null;

  const mascara =
    "radial-gradient(115% 95% at 50% 32%, #000 0%, #000 42%, rgba(0,0,0,.55) 66%, rgba(0,0,0,.15) 84%, transparent 100%)";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {camadas.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- arte local estática, decorativa
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          /* Só a primeira é ansiosa: ela é a que aparece na dobra. As outras
             duas só entram em cena depois de 9 e 18 segundos — carregá-las
             junto atrasaria justamente o que decide a venda. */
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className={camadas.length > 1 ? "fundo-curso-camada absolute inset-0 h-full w-full object-cover" : "absolute inset-0 h-full w-full object-cover"}
          style={{
            filter: "blur(34px) saturate(1.15)",
            opacity: 0.3,
            maskImage: mascara,
            WebkitMaskImage: mascara,
            /* O atraso negativo faz a terceira já entrar no meio do ciclo em
               vez de a página começar com dois quadros pretos esperando. */
            animationDelay: camadas.length > 1 ? `${-9 * i}s, ${-14 * i}s` : undefined,
            transform: camadas.length > 1 ? undefined : "scale(1.12)",
          }}
        />
      ))}
      {/* O véu que devolve o contraste ao texto. Sem ele, o subtítulo cinza
          some sobre a parte clara da foto borrada. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 80% at 50% 25%, rgba(4,5,11,.35) 0%, rgba(4,5,11,.7) 60%, rgba(4,5,11,.92) 100%)",
        }}
      />
    </div>
  );
}
