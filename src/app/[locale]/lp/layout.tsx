import type { ReactNode } from "react";
import { LetreiroFayai } from "@/components/marca/MarcaFayai";

/**
 * O chrome das LANDING PAGES — e a razão dele é o motivo de esta pasta existir
 * fora de `(site)`.
 *
 * ## O que o gauntlet mediu (rodada 1, 10/09/2026)
 *
 * A LP nasceu dentro de `(site)`, e por isso herdava o `SiteChrome`: o header
 * institucional inteiro e o rodapé completo. **Dois dos três críticos, com
 * contexto zerado e sem saber um do outro, apontaram o mesmo defeito como o
 * pior da página:**
 *
 * - *Briefing*: "header com a navegação inteira do site (13+ links) no topo da
 *   LP — a maior fuga de atenção possível logo na primeira dobra".
 * - *Acabamento*: "compete com a única decisão que a página deveria pedir,
 *   abre 15+ rotas de saída antes da dobra terminar, e ainda empurra o herói
 *   para baixo".
 *
 * O crítico de briefing pegou ainda o outro lado: logo abaixo do botão de
 * compra vinham uma caixa de newsletter e um rodapé com ~12 links para outros
 * cursos — "oferecendo saída de baixo compromisso no lugar de reforçar a única
 * ação que importa".
 *
 * ## O que este layout faz
 *
 * Uma barra com a marca (sem link, porque link é saída) e um rodapé de três
 * linhas com o que a lei e a confiança pedem: quem vende, como se fala com a
 * gente, e onde o pagamento acontece. Nenhum link de navegação, nenhuma
 * captura de e-mail. Quem chega aqui tem uma decisão para tomar.
 *
 * ⚠️ Não mova esta pasta para dentro de `(site)` "para reaproveitar o header".
 * O header é exatamente o que ela existe para não ter.
 */
export default function LpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <LetreiroFayai className="h-6 w-auto" />
          <span className="text-sm text-muted-foreground">Pagamento seguro pela Hotmart</span>
        </div>
      </header>

      {children}

      <footer className="border-t border-border/60">
        <div className="container mx-auto space-y-2 px-4 py-8 text-center text-xs text-muted-foreground">
          <p>FayAI · fayai.com.br</p>
          <p>
            Pagamento, emissão de nota e reembolso são processados pela Hotmart. Dúvidas sobre o
            produto: <span className="text-foreground">contato@fayai.com.br</span>
          </p>
          <p>
            Este material ensina um método de trabalho. Não promete renda, valor nem prazo, e
            resultado depende de quem aplica.
          </p>
        </div>
      </footer>
    </div>
  );
}
