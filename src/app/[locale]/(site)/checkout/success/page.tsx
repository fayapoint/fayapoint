"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  Download,
  Sparkles,
  Mail,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order");
  
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    if (!showConfetti) {
      setShowConfetti(true);
      
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
            
            <h1 className="text-4xl font-bold mb-2">Pagamento Confirmado!</h1>
            <p className="text-gray-400 text-lg">
              Obrigado pela sua compra. Seu pedido foi processado com sucesso.
            </p>
          </div>

          {/* Order Details */}
          <Card className="p-6 bg-gray-900/50 border-gray-800 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">Detalhes do Pedido</h2>
            </div>

            <div className="space-y-3">
              {orderNumber && (
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-gray-400">Número do Pedido</span>
                  <span className="font-mono font-bold text-purple-400">{orderNumber}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-gray-800">
                <span className="text-gray-400">Status</span>
                <span className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Pago
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Data</span>
                <span>{new Date().toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </Card>

          {/* Email Confirmation */}
          <Card className="p-6 bg-purple-900/20 border-purple-800/50 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Confirmação enviada por email</h3>
                <p className="text-sm text-gray-400">
                  Enviamos um email com os detalhes do seu pedido e instruções de acesso. 
                  Verifique também sua caixa de spam.
                </p>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-6 bg-gray-900/50 border-gray-800 mb-6">
            <h3 className="font-semibold mb-4">Próximos Passos</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">1</span>
                </div>
                <div>
                  <p className="font-medium">Acesse seu Dashboard</p>
                  <p className="text-sm text-gray-400">
                    Seus cursos e recursos já estão disponíveis no seu portal.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">2</span>
                </div>
                <div>
                  <p className="font-medium">Comece a aprender</p>
                  <p className="text-sm text-gray-400">
                    Explore os conteúdos e comece sua jornada de aprendizado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-400">3</span>
                </div>
                <div>
                  <p className="font-medium">Ganhe XP</p>
                  <p className="text-sm text-gray-400">
                    Complete lições e desafios para subir de nível e ganhar recompensas.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 py-6"
              onClick={() => router.push("/pt-BR/portal")}
            >
              Acessar Meu Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              className="flex-1 border-gray-700 py-6"
              onClick={() => router.push("/pt-BR/portal?tab=carrinho")}
            >
              <Download className="w-4 h-4 mr-2" />
              Ver Meus Pedidos
            </Button>
          </div>

          {/* Support */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Precisa de ajuda? Entre em contato pelo email{" "}
            <a href="mailto:suporte@fayapoint.com" className="text-purple-400 hover:underline">
              suporte@fayapoint.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
