import Link from "next/link";

/**
 * 404 com bússola — página perdida nunca pode ser beco sem saída (13/07/2026).
 * Server component simples: sem depender de contexto/JS para navegar.
 */
const bebas = { fontFamily: "var(--font-bebas), sans-serif" } as const;
const GOLD = "#f5c04e";

const ROTAS = [
  { href: "/", titulo: "Início", desc: "A mágica em 30 segundos", cor: "#38bdf8" },
  { href: "/cursos", titulo: "Cursos", desc: "Aprenda IA fazendo", cor: "#f5c04e" },
  { href: "/projetos", titulo: "Projetos", desc: "O ecossistema FayAI", cor: "#f472b6" },
  { href: "/noticias", titulo: "IA Hoje", desc: "Notícias explicadas todo dia", cor: "#a78bfa" },
  { href: "/portal", titulo: "Meu Portal", desc: "Sua jornada de aprendizado", cor: "#a3e635" },
];

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4 py-16 text-[#f3f1ff]"
      style={{
        background:
          "radial-gradient(800px 500px at 50% -10%, rgba(167,139,250,.2), transparent 60%)," +
          "radial-gradient(700px 480px at 90% 80%, rgba(56,189,248,.14), transparent 55%)," +
          "#0c0e1d",
      }}
    >
      <p className="text-8xl sm:text-9xl tracking-wide leading-none" style={{ ...bebas, color: GOLD }}>
        404
      </p>
      <h1 className="mt-3 text-3xl sm:text-4xl tracking-wide text-center" style={bebas}>
        ESSA PÁGINA SE PERDEU NA MÁGICA
      </h1>
      <p className="mt-2 text-sm sm:text-base text-white/60 text-center max-w-md">
        Mas você não precisa se perder junto — escolha um caminho:
      </p>

      <nav className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full max-w-4xl">
        {ROTAS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="group rounded-2xl p-4 text-center transition-transform hover:-translate-y-1"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,.06), rgba(255,255,255,0) 38%), rgba(22,26,54,.42)",
              border: `1px solid ${r.cor}44`,
              boxShadow: `0 10px 30px -12px ${r.cor}33`,
            }}
          >
            <span className="block text-lg tracking-wide" style={{ ...bebas, color: r.cor }}>
              {r.titulo.toUpperCase()}
            </span>
            <span className="block mt-1 text-[12px] text-white/55">{r.desc}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
