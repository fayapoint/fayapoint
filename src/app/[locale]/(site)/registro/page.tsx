"use client";
import { useT } from "@/i18n/dicionario";

import { Suspense, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  ArrowRight,
  CheckCircle,
  Chrome
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { useUser } from "@/contexts/UserContext";
import { usePostHog } from "posthog-js/react";
import { PaginaCarregando } from "@/components/marca/LoaderFayai";

/**
 * `useSearchParams` obriga fronteira de Suspense — sem ela o build do Next
 * reprova a página inteira. Mesmo desenho do `/login`, que já resolvia assim.
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<PaginaCarregando />}>
      <FormularioDeRegistro />
    </Suspense>
  );
}

function FormularioDeRegistro() {
  const T = useT();
  const t = useTranslations("Register");
  const benefits = t.raw("benefits") as string[];
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();
  const posthog = usePostHog();

  /**
   * PARA ONDE A PESSOA VOLTA DEPOIS DE CRIAR A CONTA (06/09/2026).
   *
   * Antes, todo cadastro terminava em `/portal` — inclusive o de quem clicou
   * "comprar" numa página de curso e foi mandado para criar conta. A pessoa
   * punha o curso no carrinho, criava a conta, e era largada no portal sem o
   * carrinho na frente: o passo seguinte da compra simplesmente sumia.
   *
   * ⚠️ O destino é sanitizado dos dois lados. Aqui, só caminho interno começando
   * com uma barra (e nunca `//`, que o navegador lê como outro domínio). No
   * caminho do Google, quem sanitiza de novo é `sanitizeRedirectPath()` em
   * `api/auth/google-callback` — que já existia e já tratava o `state`; a tela
   * de registro é que nunca mandava um.
   */
  const proximo = (() => {
    const bruto = searchParams?.get("proximo") || "";
    if (!bruto.startsWith("/") || bruto.startsWith("//")) return "/portal";
    return bruto;
  })();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("messages.passwordMismatch"));
      return;
    }

    if (!formData.acceptTerms) {
      toast.error(t("messages.acceptTerms"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.registerError"));
      }

      // Save token and user
      localStorage.setItem("fayai_token", data.token);
      if (data.user) setUser(data.user);

      // Track signup for CRO measurement
      posthog?.capture("user_signed_up", {
        method: "email",
        source: document.referrer || "direct",
      });
      posthog?.identify(data.user?.email, { name: data.user?.name });

      toast.success(t("messages.success"));
      router.push(proximo);
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("messages.unexpectedError");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Track Google signup attempt for CRO measurement
    posthog?.capture("signup_google_clicked");
    // Redirect to Google OAuth flow (same as login — creates account if needed)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "167078774916-ktdd044k8l528goetmjc7pdqkgrbranc.apps.googleusercontent.com";
    // Use flat path to avoid Next.js 16 Turbopack nested route resolution bug
    const redirectUri = `${window.location.origin}/api/auth/google-callback`;
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("include_granted_scopes", "true");
    // O `state` é o destino pós-login. O callback já o lia e sanitizava desde
    // sempre; era esta tela que nunca mandava um — então quem se cadastrava
    // pelo Google caía no destino padrão, e não de volta no que estava fazendo.
    authUrl.searchParams.set("state", proximo);
    window.location.assign(authUrl.toString());
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-black to-yellow-900/20" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-amber-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <h2 className="text-4xl font-bold mb-6">
            {t("heroTitle")}{" "}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              {t("heroHighlight")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t("heroDescription")}
          </p>
          
          <div className="space-y-4 mb-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="text-green-400" size={24} />
                <span className="text-lg">{T(benefit)}</span>
              </motion.div>
            ))}
          </div>

          {/* O que havia aqui era um DEPOIMENTO INVENTADO — "Maria Silva, CEO,
              TechStartup", com bolinha de gradiente no lugar do rosto — ao lado
              de "junte-se a mais de 5.000 profissionais". Prova social fabricada
              na página que fecha a conta: o pior lugar possível para uma
              afirmação que não se sustenta. Saiu em 06/09/2026 junto com o
              número. No lugar entra o que de fato acontece a seguir — e isso é
              conferível abrindo o portal. */}
          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <p className="font-semibold mb-2">{t("depois.titulo")}</p>
            <p className="text-muted-foreground">{t("depois.texto")}</p>
          </div>
        </motion.div>

        {/* Right Side - Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8 lg:text-left">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent mb-2">
                {t("title")}
              </h1>
            </Link>
            <p className="text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {/* Register Form */}
          <div className="bg-popover/50 backdrop-blur-xl rounded-2xl p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("fields.fullName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("fields.fullNamePlaceholder")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("fields.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("fields.emailPlaceholder")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("fields.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("fields.passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10 bg-input border-border"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("fields.confirmPassword")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("fields.passwordPlaceholder")}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 bg-input border-border"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="mt-1 rounded border-border bg-input"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  {t("terms.accept")}{" "}
                  <Link href="/termos" className="text-amber-400 hover:text-amber-300">
                    {t("terms.termsOfUse")}
                  </Link>{" "}
                  {t("terms.and")}{" "}
                  <Link href="/privacidade" className="text-amber-400 hover:text-amber-300">
                    {t("terms.privacyPolicy")}
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("submitting")}
                  </div>
                ) : (
                  <>
                    {t("submit")} <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <Separator className="bg-border" />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                {t("orSignUpWith")}
              </span>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-popover/40"
                onClick={handleGoogleSignup}
              >
                <Chrome className="mr-2" size={20} />
                
                {T("Google")}
              </Button>
              {/* O BOTÃO DE GITHUB SAIU EM 06/09/2026.

                  Ele nunca autenticou ninguém: o clique chamava
                  `toast.success("Login com GitHub em desenvolvimento")` e
                  acabava ali. Numa tela de conta, um botão que parece uma opção
                  e não é custa mais do que a ausência dele — a pessoa escolhe o
                  caminho que não existe, recebe um aviso, e recomeça achando
                  que errou. Volta quando houver OAuth do GitHub de verdade; o
                  desenho de duas colunas continua aqui embaixo esperando. */}
            </div>

            {/* Login Link */}
            <p className="text-center mt-6 text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link 
                href="/login" 
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                {t("login")}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
