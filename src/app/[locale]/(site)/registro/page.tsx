"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  ArrowRight,
  CheckCircle,
  Github,
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

export default function RegisterPage() {
  const t = useTranslations("Register");
  const benefits = t.raw("benefits") as string[];
  const router = useRouter();
  const { setUser } = useUser();
  const posthog = usePostHog();
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
      router.push("/portal");
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
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
    window.location.href = authUrl;
  };

  const handleGithubSignup = () => {
    toast.success(t("messages.githubInDev"));
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
                <span className="text-lg">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <div className="bg-popover/50 backdrop-blur-sm rounded-lg p-6 border border-border">
            <p className="text-muted-foreground italic">
              &ldquo;{t("testimonial.quote")}&rdquo;
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600" />
              <div>
                <p className="font-semibold">{t("testimonial.name")}</p>
                <p className="text-sm text-muted-foreground">{t("testimonial.role")}</p>
              </div>
            </div>
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
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-popover/40"
                onClick={handleGithubSignup}
              >
                <Github className="mr-2" size={20} />
                GitHub
              </Button>
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
