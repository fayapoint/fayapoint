import { MarcaFabrica } from "@/components/fabrica/MarcaFabrica";

/**
 * O PRIMEIRO QUADRO DA PÁGINA É O ÚLTIMO QUADRO DA ANIMAÇÃO.
 *
 * A desmontagem termina com a torre centrada na tela, sobre `#05060c`. Esta
 * tela desenha exatamente isso — mesma `<MarcaFabrica>`, mesmo centro, mesmo
 * fundo — e a cortina da animação sai POR CIMA dela.
 *
 * Por isso não existe piscada entre uma coisa e outra: os dois lados da troca
 * mostram o mesmo pixel. Se alguém mexer na geometria de um sem mexer no
 * outro, a emenda aparece — e é a única emenda que o leitor consegue ver
 * depois de 8 segundos de espetáculo.
 *
 * A torre respira em vez de girar: girar diz "espere", respirar diz "estou
 * trabalhando". E quem chega aqui já esperou o suficiente.
 */
export default function CarregandoFabrica() {
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center"
      style={{ background: "#05060c" }}
      role="status"
      aria-label="Carregando"
    >
      <div className="text-center">
        <MarcaFabrica pulsando />
        <p
          style={{
            marginTop: 18,
            fontSize: 11,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(245,192,78,.75)",
          }}
        >
          Fábrica Autônoma
        </p>
      </div>
    </div>
  );
}
