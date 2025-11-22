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
  ArrowRight,
  Sparkles,
  Github,
  Chrome
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";

import { useUser } from "@/contexts/UserContext";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Save token
      localStorage.setItem('fayapoint_token', data.token);
      
      // Update user context
      setUser(data.user);

      toast.success(`Bem-vindo, ${data.user.name}!`);
      router.push("/portal");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.success("Login com Google em desenvolvimento");
  };

  const handleGithubLogin = () => {
    toast.success("Login com GitHub em desenvolvimento");
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
                FayaPoint AI
              </h1>
            </Link>
            <p className="text-gray-400">
              Bem-vindo de volta! Faça login para continuar.
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-popover/50 backdrop-blur-xl rounded-2xl p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
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
                  <span className="text-muted-foreground">Lembrar de mim</span>
                </label>
                <Link 
                  href="/recuperar-senha" 
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Esqueceu a senha?
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
                    Entrando...
                  </div>
                ) : (
                  <>
                    Entrar <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <Separator className="bg-border" />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                ou continue com
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
              Não tem uma conta?{" "}
              <Link 
                href="/registro" 
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Crie sua conta grátis
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Acesso instantâneo
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Certificados gratuitos
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
