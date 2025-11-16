import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, CalendarDays } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <Image
            src="/rwx5.jpg"
            alt="Ricardo Faya facilitando uma sessão estratégica"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-black/80 to-pink-900/60" />

          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-200/80 mb-4">
              Vamos conversar
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Transforme suas iniciativas de IA com o time da FayaPoint
            </h1>
            <p className="text-lg text-gray-100">
              Parcerias estratégicas, imprensa, dúvidas sobre cursos ou planos corporativos — estamos prontos
              para responder em até 24h úteis.
            </p>
          </div>
        </section>

        {/* Form + Info */}
        <section className="container mx-auto px-4 mt-[-80px] relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
            <div className="bg-card/90 border border-border rounded-3xl shadow-2xl shadow-purple-900/20 p-8 backdrop-blur">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  Formulário
                </p>
                <h2 className="text-3xl font-semibold mb-2">Conte mais sobre você</h2>
                <p className="text-muted-foreground">
                  Nossa equipe responde pessoalmente cada mensagem com direcionamentos claros.
                </p>
              </div>

              <div className="grid gap-5">
                <Input placeholder="Nome completo" className="h-12" />
                <Input type="email" placeholder="Email profissional" className="h-12" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder="Empresa" className="h-12" />
                  <Input placeholder="Cargo" className="h-12" />
                </div>
                <textarea
                  className="bg-transparent border border-border rounded-2xl px-4 py-3 min-h-[140px] text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder="Como podemos ajudar? Descreva sua necessidade, prazos e objetivos."
                />
                <Button className="h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Enviar mensagem
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <Image
                  src="/rwx6.jpg"
                  alt="Equipe da FayaPoint em reunião de atendimento"
                  width={900}
                  height={700}
                  className="w-full h-full object-cover"
                  sizes="(min-width: 1024px) 40vw, 90vw"
                />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-sm uppercase tracking-[0.4em] text-purple-200">Equipe dedicada</p>
                  <p className="text-xl font-semibold">Acompanhamento próximo do primeiro contato ao onboarding</p>
                </div>
              </div>

              <div className="grid gap-4">
                {[{
                  icon: Mail,
                  label: "Email",
                  value: "ricardofaya@gmail.com",
                  description: "Retorno em até 1 dia útil",
                }, {
                  icon: Phone,
                  label: "WhatsApp Business",
                  value: "+55 21 97190-8530",
                  description: "Atendimento das 9h às 18h (BRT)",
                }, {
                  icon: CalendarDays,
                  label: "Consultorias",
                  value: "Agenda exclusiva para times e executivos",
                  description: "Clique para reservar um horário",
                  href: "/agendar-consultoria",
                }, {
                  icon: MapPin,
                  label: "Studio presencial",
                  value: "Rua Sebastião de Aquino, 11, 207",
                  description: "Visitas mediante agendamento",
                }].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 rounded-2xl border border-border p-5 bg-card/60"
                  >
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-lg font-semibold hover:text-primary transition"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-lg font-semibold">{item.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
