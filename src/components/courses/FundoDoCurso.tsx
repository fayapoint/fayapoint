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
 * **3. `blur(9px)` com `scale`.** O desfoque puxa pixels de fora da caixa; sem
 * ampliar antes, aparece uma faixa clara em cada borda, o defeito clássico de
 * fundo borrado. A escala do zoom (1,1 a 1,26) cobre isso com folga.
 *
 * ⚠️ Era `blur(34px)` até 05/08/2026, e o Ricardo cortou: *"precisamos diminuir
 * muito o blur, é pra ficar um pouco desfocado, não invisível a imagem"*. E ele
 * está certo — 34px sobre uma foto de 1376px de largura destrói a forma, não só
 * o detalhe: o que restava era um campo de cor. Isso derrubava a razão de a foto
 * existir, que é o pedido original dele mesmo, *"dar uma sensação de conexão do
 * curso com a realidade"*. Não há conexão com uma realidade que ninguém
 * reconhece. 9px ainda impede a leitura de qualquer detalhe e mantém o texto na
 * frente, mas a mesa, a sala e o servidor continuam sendo uma mesa, uma sala e
 * um servidor.
 *
 * **4. A máscara é RADIAL, não linear.** Um degradê linear resolve duas bordas
 * e deixa as outras duas cortadas — e o pedido foi justamente "nos cantos". A
 * elipse dissolve os quatro ao mesmo tempo, e o centro, onde mora o título,
 * fica cheio.
 *
 * **5. `opacity: .5` mais um véu escuro.** O texto do herói é branco; um fundo
 * forte demais derruba o contraste do subtítulo, que é o texto mais fino da
 * página. O fundo é atmosfera, não ilustração — se disputar com a leitura,
 * perdeu. Mas a 0,3 sobre um desfoque de 34px ele não disputava com nada:
 * também não aparecia. Com o desfoque em 9px a opacidade sobe junto, e o véu
 * afrouxa no centro — é o véu, e não o borrão, que protege a leitura.
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
    /* ── A CAIXA TEM A PROPORÇÃO DA FOTO ────────────────────────────────────
       Ricardo, 05/08/2026: *"eu tinha dado a área verde de onde as imagens
       deveriam ficar, aparentemente está muito maior e distorcida … ainda está
       um borrão e não vemos nada"*.

       O problema NÃO era o desfoque. Medido no herói do `openclaw`: a foto tem
       1376×768 e o `inset-0` dava a ela uma caixa de **1420×1943** — a seção
       inteira, que cresce com o texto da coluna esquerda. Com `object-cover`
       numa caixa 2,4× mais alta que larga, o navegador amplia a foto até a
       altura caber e joga fora as laterais: sobrava uma faixa de ~35% da
       largura, esticada 2,5×. Nenhum desfoque é responsável por isso — uma
       fotografia ampliada 2,5× já não tem forma para desfocar. Baixar o blur
       sozinho ia continuar mostrando um borrão, e foi o que aconteceu.

       A caixa agora tem `aspect-ratio: 16/9`, a mesma da foto: `object-cover`
       passa a ser um encaixe exato — zero corte, zero ampliação. E ela para
       onde o Ricardo marcou: no alto do herói, cobrindo título, subtítulo e a
       barra de números, e não os 2000px de texto abaixo.

       ⚠️ `maxHeight: 100%` é a trava para a tela larga e baixa: sem ela, num
       monitor de 2560px a caixa pediria 1440px de altura e voltaria a
       transbordar a seção. */
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
      style={{ aspectRatio: "16 / 9", maxHeight: "100%" }}
    >
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
            /* 5px, e não os 34px originais. Com a caixa na proporção certa a
               foto não está mais ampliada, então este número volta a significar
               o que deveria significar: tira o detalhe (um rosto, uma etiqueta,
               um texto na tela ao fundo não podem competir com o título) e
               deixa a FORMA — a mesa, a sala, o servidor na prateleira. */
            filter: "blur(5px) saturate(1.12)",
            /* ⚠️ A variável é para as TRÊS camadas: os keyframes de
               `fundo-curso-troca` sobrescrevem `opacity`, então declarar só a
               propriedade não segurava nada quando a animação estava ligada.
               A `opacity` continua aqui para o degrau de UMA camada, que não
               anima. Ver o aviso em `@keyframes fundo-curso-troca`. */
            ["--fundo-opacidade" as string]: "0.5",
            opacity: 0.5,
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
          some sobre a parte clara da foto.

          ⚠️ Com o desfoque em 9px, é ESTE elipse que passa a fazer o trabalho
          que o borrão fazia antes — e ele o faz melhor, porque escurece sem
          destruir a forma. Ele abre no alto (onde mora o título, que é branco e
          grande e aguenta) e fecha em baixo e nos cantos, que é justamente onde
          vive o texto fino. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 90% at 50% 20%, rgba(4,5,11,.22) 0%, rgba(4,5,11,.52) 55%, rgba(4,5,11,.84) 100%)",
        }}
      />
      {/* Uma segunda camada, só embaixo: a coluna esquerda do herói é a que tem
          mais texto corrido, e é a que mais precisa de chão escuro. */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "linear-gradient(to top, rgba(4,5,11,.80) 0%, rgba(4,5,11,.42) 45%, transparent 100%)",
        }}
      />
    </div>
  );
}
