import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

type ContactHero = {
  badge: string;
  title: string;
  description: string;
  imageAlt: string;
};

type ContactForm = {
  badge: string;
  title: string;
  description: string;
  fields: {
    fullName: string;
    email: string;
    company: string;
    role: string;
    detailsPlaceholder: string;
  };
  submit: string;
};

type ContactHighlight = {
  badge: string;
  title: string;
  imageAlt: string;
};

type InfoCard = {
  icon: "mail" | "phone" | "calendar" | "map";
  label: string;
  value: string;
  description: string;
  href?: string;
};

const iconMap = {
  mail: Mail,
  phone: Phone,
  calendar: CalendarDays,
  map: MapPin,
};

export default function ContactPage() {
  const t = useTranslations("Contact");
  const hero = t.raw("hero") as ContactHero;
  const form = t.raw("form") as ContactForm;
  const highlight = t.raw("highlightCard") as ContactHighlight;
  const infoCards = t.raw("infoCards") as InfoCard[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <Image
            src="/rwx5.jpg"
            alt={hero.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-black/80 to-pink-900/60" />

          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-200/80 mb-4">
              {hero.badge}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {hero.title}
            </h1>
            <p className="text-lg text-gray-100">
              {hero.description}
            </p>
          </div>
        </section>

        {/* Form + Info */}
        <section className="container mx-auto px-4 mt-[-80px] relative z-10">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
            <div className="bg-card/90 border border-border rounded-3xl shadow-2xl shadow-purple-900/20 p-8 backdrop-blur">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  {form.badge}
                </p>
                <h2 className="text-3xl font-semibold mb-2">{form.title}</h2>
                <p className="text-muted-foreground">{form.description}</p>
              </div>

              <div className="grid gap-5">
                <Input placeholder={form.fields.fullName} className="h-12" />
                <Input type="email" placeholder={form.fields.email} className="h-12" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder={form.fields.company} className="h-12" />
                  <Input placeholder={form.fields.role} className="h-12" />
                </div>
                <textarea
                  className="bg-transparent border border-border rounded-2xl px-4 py-3 min-h-[140px] text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder={form.fields.detailsPlaceholder}
                />
                <Button className="h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  {form.submit}
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <Image
                  src="/rwx6.jpg"
                  alt={highlight.imageAlt}
                  width={900}
                  height={700}
                  className="w-full h-full object-cover"
                  sizes="(min-width: 1024px) 40vw, 90vw"
                />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-sm uppercase tracking-[0.4em] text-purple-200">{highlight.badge}</p>
                  <p className="text-xl font-semibold">{highlight.title}</p>
                </div>
              </div>

              <div className="grid gap-4">
                {infoCards.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 rounded-2xl border border-border p-5 bg-card/60"
                  >
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                      <Icon className="w-5 h-5" />
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
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
