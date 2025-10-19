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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";

const benefits = [
  "Acesso a aulas gratuitas",
  "Certificado de conclusão",
  "Comunidade exclusiva",
  "Atualizações semanais",
];

export default function RegisterPage() {
  const router = useRouter();
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
      toast.error("As senhas não coincidem");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }

    setIsLoading(true);

    // Simulate registration
    setTimeout(() => {
      toast.success("Conta criada com sucesso! Bem-vindo à FayaPoint!");
      router.push("/portal");
      setIsLoading(false);
    }, 2000);
  };

  const handleGoogleSignup = () => {
    toast.success("Cadastro com Google em desenvolvimento");
  };

  const handleGithubSignup = () => {
    toast.success("Cadastro com GitHub em desenvolvimento");
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

      <div className="w-full max-w-6xl relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:block"
        >
          <h2 className="text-4xl font-bold mb-6">
            Junte-se a mais de{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              5.000 profissionais
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Crie sua conta gratuita e comece sua jornada para dominar a Inteligência Artificial hoje mesmo.
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
            <p className="text-gray-300 italic">
              &ldquo;A FayaPoint mudou completamente minha forma de trabalhar com IA. 
              Em apenas 2 meses, já automatizei 80% das minhas tarefas repetitivas.&rdquo;
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <div>
                <p className="font-semibold">Maria Silva</p>
                <p className="text-sm text-gray-400">CEO, TechStartup</p>
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                FayaPoint AI
              </h1>
            </Link>
            <p className="text-gray-400">
              Crie sua conta gratuita
            </p>
          </div>

          {/* Register Form */}
          <div className="bg-popover/50 backdrop-blur-xl rounded-2xl p-8 border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="name"
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
              </div>

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

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
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
                  Eu aceito os{" "}
                  <Link href="/termos" className="text-purple-400 hover:text-purple-300">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-purple-400 hover:text-purple-300">
                    Política de Privacidade
                  </Link>
                </label>
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
                    Criando conta...
                  </div>
                ) : (
                  <>
                    Criar Conta Grátis <ArrowRight className="ml-2" size={20} />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <Separator className="bg-border" />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
                ou cadastre-se com
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
            <p className="text-center mt-6 text-gray-400">
              Já tem uma conta?{" "}
              <Link 
                href="/login" 
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Faça login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
