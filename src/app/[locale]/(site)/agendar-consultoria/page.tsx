import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingForm } from "@/components/consultation/ScheduleMeetingForm";
import { useTranslations } from "next-intl";

export default function ConsultPage() {
  const t = useTranslations("Consultation");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="relative pt-32 pb-20 overflow-hidden">
          <Image
            src="/rwx6.jpg"
            alt="Equipe FayAi"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-black/80 to-pink-900/60" />
          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              <Badge variant="secondary" className="mb-6 text-sm tracking-[0.3em] uppercase">
                Agenda exclusiva
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("title")}</h1>
              <p className="text-lg md:text-xl text-gray-100 mb-6">{t("description")}</p>
              <p className="text-sm text-gray-300">Reservamos blocos de 30 minutos entre 9h e 18h (BRT). Após enviar, você será redirecionado para a agenda do Google com o próximo horário disponível.</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 -mt-16 pb-20 relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
            <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-purple-900/15">
              <ScheduleMeetingForm
                copy={{
                  badge: t("badge", { default: "" }) as string,
                  title: t("title"),
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
                <h2 className="text-2xl font-semibold mb-4">Como funciona</h2>
                <ul className="space-y-4 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">1.</span> Validamos se você já está em nossa base para personalizar o atendimento.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">2.</span> Calculamos automaticamente o próximo horário disponível na agenda compartilhada.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">3.</span> Abrimos a Google Agenda para você concluir o agendamento e ajustar o melhor horário.
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <p className="text-sm text-muted-foreground mb-3">Prefere falar direto com o time?</p>
                <Button asChild variant="outline">
                  <a href="https://wa.me/5521971908530" target="_blank" rel="noreferrer">
                    WhatsApp Business
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
