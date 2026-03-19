"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  Github,
  Chrome
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";

import { useUser } from "@/contexts/UserContext";
import { HoneypotField } from "@/components/security/HoneypotField";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const t = useTranslations("Login");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/portal";
  const { setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isBotDetected, setIsBotDetected] = useState(false);

  const resolveRedirectPath = () => {
    const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/portal";
    if (safeRedirect.startsWith(`/${locale}/`)) {
      return safeRedirect;
    }
    return `/${locale}${safeRedirect === "/" ? "" : safeRedirect}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection - silently fail
    if (isBotDetected) {
      console.warn('[SECURITY] Bot login attempt blocked');
      toast.error(t("messages.loginError"));
      return;
    }
    
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("messages.loginError"));
      }

      // Save token
      localStorage.setItem('fayai_token', data.token);
      
      // Update user context
      setUser(data.user);

      toast.success(t("messages.welcomeBack", { name: data.user.name }));
      window.location.assign(resolveRedirectPath());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("messages.unexpectedError");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Load Google Identity Services if not already loaded
      if (!(window as unknown as Record<string, unknown>).google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Falha ao carregar Google Sign-In"));
          document.head.appendChild(script);
        });
      }

      // Initialize Google Sign-In and get credential
      const google = (window as unknown as Record<string, unknown>).google as {
        accounts: {
          id: {
            initialize: (config: Record<string, unknown>) => void;
            prompt: (callback: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          };
        };
      };

      await new Promise<void>((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "167078774916-ktdd044k8l528goetmjc7pdqkgrbranc.apps.googleusercontent.com",
          callback: async (response: { credential: string }) => {
            try {
              const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: response.credential }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Erro no login Google");

              localStorage.setItem("fayai_token", data.token);
              setUser(data.user);
              toast.success(`Bem-vindo, ${data.user.name}!`);
              window.location.assign(resolveRedirectPath());
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });

        google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: open Google OAuth popup directly
            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "167078774916-ktdd044k8l528goetmjc7pdqkgrbranc.apps.googleusercontent.com";
            const redirectUri = `${window.location.origin}/api/auth/google/callback`;
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
            window.location.href = authUrl;
          }
        });
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro no login Google";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = () => {
    toast.success(t("messages.githubInDev"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
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
          className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                {t("title")}
              </h1>
            </Link>
            <p className="text-gray-400">
              {t("subtitle")}
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-popover/50 backdrop-blur-xl rounded-2xl p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot for bot detection */}
              <HoneypotField onBotDetected={() => setIsBotDetected(true)} />
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

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("fields.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="rounded border-border bg-input"
                  />
                  <span className="text-muted-foreground">{t("rememberMe")}</span>
                </label>
                <Link 
                  href="/recuperar-senha" 
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
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
                {t("orContinueWith")}
              </span>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-popover/40"
                onClick={handleGoogleLogin}
              >
                <Chrome className="mr-2" size={20} />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-border hover:bg-popover/40"
                onClick={handleGithubLogin}
              >
                <Github className="mr-2" size={20} />
                GitHub
              </Button>
            </div>

            {/* Sign Up Link */}
            <p className="text-center mt-6 text-gray-400">
              {t("noAccount")}{" "}
              <Link 
                href="/onboarding" 
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {t("createAccount")}
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {t("features.instantAccess")}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                {t("features.freeCertificates")}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
