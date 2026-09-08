import { useT } from "@/i18n/dicionario";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingForm } from "@/components/consultation/ScheduleMeetingForm";
import { useTranslations } from "next-intl";

export default function ConsultPage() {
  const T = useT();
  const t = useTranslations("Consultation");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden">
          <Image
            src="/rwx6.jpg"
            alt={T("Equipe FayAi")}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/70 via-black/80 to-yellow-900/60" />
          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              <Badge variant="secondary" className="mb-6 text-sm tracking-[0.3em] uppercase">
                
                {T("Agenda exclusiva")}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
              {/* O texto do dicionário ("preencha e retornaremos") descreve o
                  formulário, que agora é a segunda porta. No alto da página ele
                  prometeria espera onde existe agendamento imediato — então o
                  herói ganha a sua própria frase, e o dicionário segue servindo
                  o formulário, onde continua verdadeiro. */}
              <p className="text-lg md:text-xl text-gray-100 mb-6">
                {T("Escolha um horário e receba a confirmação na hora. Sem formulário, sem espera.")}
              </p>
              <p className="text-sm text-gray-200">{T("Blocos de 30 minutos, de segunda a sexta, das 9h às 17h (horário de Brasília). Você escolhe o horário e recebe o convite na hora — sem esperar retorno.")}</p>
            </div>
          </div>
        </section>

        {/* O AGENDAMENTO DE VERDADE, ANTES DO FORMULÁRIO.
            A página nasceu com o formulário na frente: a pessoa preenchia e
            esperava alguém responder — e ninguém era avisado, porque a rota só
            registrava no banco. Quem já decidiu falar não quer preencher um
            pedido: quer escolher a hora e sair com o convite na mão. O
            formulário continua logo abaixo, para quem prefere escrever antes. */}
        <section className="container mx-auto px-4 -mt-16 pb-4 relative z-10">
          <div className="bg-card border border-border rounded-3xl p-4 md:p-6 shadow-2xl shadow-amber-900/15">
            <h2 className="text-2xl font-semibold mb-1 px-2 pt-2">{T("Escolha o horário")}</h2>
            <p className="text-sm text-muted-foreground mb-4 px-2">
              {T("A confirmação e o link do Google Meet chegam no seu e-mail assim que você escolher.")}
            </p>
            <iframe
              src="https://calendly.com/ricardofaya/30min?hide_gdpr_banner=1&background_color=0e1013&text_color=e6e9ee&primary_color=d29922"
              title={T("Agenda do Ricardo Faya")}
              className="w-full rounded-2xl border-0"
              style={{ height: "720px", minHeight: "720px" }}
              loading="lazy"
            />
          </div>
        </section>

        <section className="container mx-auto px-4 pt-10 pb-20 relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-amber-900/15">
              <p className="text-sm text-muted-foreground mb-6">
                {T("Prefere escrever antes de marcar? Conte o que você precisa e eu volto com uma proposta de horário.")}
              </p>
              <ScheduleMeetingForm
                copy={{
                  // Sem crachá e sem título repetidos: o herói já disse o nome
                  // da página, e vê-lo duas vezes lê como defeito de montagem.
                  badge: "",
                  title: "",
                  description: t("description"),
                  submit: t("submit"),
                  fields: {
                    fullName: t("fields.name"),
                    email: t("fields.email"),
                    details: t("fields.details"),
                  },
                }}
                showCompanyRole={false}
                source="agenda-page"
              />
            </div>

            <div className="bg-muted/40 border border-border rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-4">{T("Como funciona")}</h2>
                <ul className="space-y-4 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">1.</span>  {T("Você escolhe um horário livre no calendário acima — o que aparece lá já está livre de verdade.")}
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">2.</span>  {T("A confirmação e o link do Google Meet chegam no seu e-mail na hora, sem depender de ninguém responder.")}
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">3.</span>  {T("Na conversa, quem atende é Ricardo Faya — editor de broadcast desde 1998, com passagem por Fox e Copa do Mundo.")}
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-3">{T("Prefere falar direto com o time?")}</p>
                <Button asChild variant="outline">
                  <a href="https://wa.me/5521971908530" target="_blank" rel="noreferrer">
                    
                    {T("WhatsApp Business")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
