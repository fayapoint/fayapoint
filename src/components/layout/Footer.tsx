import Link from "next/link";
import { useTranslations } from "next-intl";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube,
  Mail,
  MapPin,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  cursos: [
    { key: "links.courses.items.beginner", href: "/cursos?level=beginner" },
    { key: "links.courses.items.intermediate", href: "/cursos?level=intermediate" },
    { key: "links.courses.items.advanced", href: "/cursos?level=advanced" },
    { key: "links.courses.items.byTool", href: "/cursos/por-ferramenta" },
    { key: "links.courses.items.byIndustry", href: "/cursos/por-setor" },
    { key: "links.courses.items.certifications", href: "/certificacoes" },
  ],
  recursos: [
    { key: "links.resources.items.blog", href: "/blog" },
    { key: "links.resources.items.guides", href: "/recursos/guias" },
    { key: "links.resources.items.templates", href: "/recursos/templates" },
    { key: "links.resources.items.roiCalculator", href: "/recursos/calculadora-roi" },
    { key: "links.resources.items.glossary", href: "/recursos/glossario" },
    { key: "links.resources.items.apiDocs", href: "/api-docs" },
  ],
  empresa: [
    { key: "links.company.items.about", href: "/sobre" },
    { key: "links.company.items.instructors", href: "/instrutores" },
    { key: "links.company.items.careers", href: "/carreiras" },
    { key: "links.company.items.partnerships", href: "/parcerias" },
    { key: "links.company.items.affiliates", href: "/afiliados" },
    { key: "links.company.items.contact", href: "/contato" },
  ],
  suporte: [
    { key: "links.support.items.helpCenter", href: "/ajuda" },
    { key: "links.support.items.faq", href: "/faq" },
    { key: "links.support.items.community", href: "/comunidade" },
    { key: "links.support.items.status", href: "/status" },
    { key: "links.support.items.terms", href: "/termos" },
    { key: "links.support.items.privacy", href: "/privacidade" },
  ],
};

const socialLinks = [
  { icon: Youtube, href: "https://youtube.com/@fayapoint", label: "YouTube" },
  { icon: Instagram, href: "https://instagram.com/fayapoint", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/fayapoint", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/fayapoint", label: "Twitter" },
  { icon: Facebook, href: "https://facebook.com/fayapoint", label: "Facebook" },
];

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-background border-t border-border">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary/15 to-accent/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              {t("newsletter.title")}
            </h3>
            <p className="text-gray-400 mb-6">
              {t("newsletter.description")}
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1 bg-input border-border"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {t("newsletter.cta")}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                FayaPoint AI Academy
              </h2>
            </Link>
            <p className="text-gray-400 mb-4">
              {t("company.tagline")}
            </p>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:ricardofaya@gmail.com" className="hover:text-white">
                  ricardofaya@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+5521971908530" className="hover:text-white">
                  (21) 97190-8530
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t("company.location")}</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.courses.title")}</h4>
            <ul className="space-y-2">
              {footerLinks.cursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.resources.title")}</h4>
            <ul className="space-y-2">
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.company.title")}</h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.support.title")}</h4>
            <ul className="space-y-2">
              {footerLinks.suporte.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              {t("bottom.rights")}
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span>{t("bottom.paymentsLabel")}</span>
              <div className="flex gap-2">
                <span>Visa</span>
                <span>Master</span>
                <span>PIX</span>
                <span>Boleto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
