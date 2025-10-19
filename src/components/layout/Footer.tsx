import Link from "next/link";
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
    { title: "Iniciantes", href: "/cursos?level=beginner" },
    { title: "Intermediário", href: "/cursos?level=intermediate" },
    { title: "Avançado", href: "/cursos?level=advanced" },
    { title: "Por Ferramenta", href: "/cursos/por-ferramenta" },
    { title: "Por Setor", href: "/cursos/por-setor" },
    { title: "Certificações", href: "/certificacoes" },
  ],
  recursos: [
    { title: "Blog", href: "/blog" },
    { title: "Guias Gratuitos", href: "/recursos/guias" },
    { title: "Templates", href: "/recursos/templates" },
    { title: "Calculadora ROI", href: "/recursos/calculadora-roi" },
    { title: "Glossário IA", href: "/recursos/glossario" },
    { title: "API Docs", href: "/api-docs" },
  ],
  empresa: [
    { title: "Sobre Nós", href: "/sobre" },
    { title: "Instrutores", href: "/instrutores" },
    { title: "Carreiras", href: "/carreiras" },
    { title: "Parcerias", href: "/parcerias" },
    { title: "Afiliados", href: "/afiliados" },
    { title: "Contato", href: "/contato" },
  ],
  suporte: [
    { title: "Central de Ajuda", href: "/ajuda" },
    { title: "FAQ", href: "/faq" },
    { title: "Comunidade", href: "/comunidade" },
    { title: "Status", href: "/status" },
    { title: "Termos de Uso", href: "/termos" },
    { title: "Privacidade", href: "/privacidade" },
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
  return (
    <footer className="bg-background border-t border-border">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary/15 to-accent/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              Receba as Novidades de IA Toda Semana
            </h3>
            <p className="text-gray-400 mb-6">
              Junte-se a mais de 5.000 profissionais que recebem nossa newsletter
              com dicas, ferramentas e estratégias de IA.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 bg-input border-border"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Inscrever
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
              A plataforma definitiva para dominar Inteligência Artificial no Brasil.
              Transforme sua carreira com conhecimento prático e aplicado.
            </p>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:contato@fayapoint.com.br" className="hover:text-white">
                  contato@fayapoint.com.br
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+5521999999999" className="hover:text-white">
                  (21) 99999-9999
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Rio de Janeiro, Brasil</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold text-white mb-4">Cursos</h4>
            <ul className="space-y-2">
              {footerLinks.cursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Recursos</h4>
            <ul className="space-y-2">
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Empresa</h4>
            <ul className="space-y-2">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Suporte</h4>
            <ul className="space-y-2">
              {footerLinks.suporte.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition"
                  >
                    {link.title}
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
              © 2025 FayaPoint AI Academy. Todos os direitos reservados.
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
              <span>Pagamento Seguro:</span>
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
