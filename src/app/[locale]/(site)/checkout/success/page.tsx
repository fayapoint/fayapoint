"use client";

import { useEffect, useState, Suspense } from "react";
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
  Loader2,
  FileText,
} from "lucide-react";
import { getClientAuthHeaders } from "@/lib/client-auth";
import confetti from "canvas-confetti";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNumber = searchParams.get("order");
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  // Try to find the receipt for this order
  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch("/api/receipts?limit=1", {
          headers: getClientAuthHeaders(),
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.receipts?.length > 0) {
            setReceiptId(data.receipts[0]._id);
          }
        }
      } catch { /* ignore */ }
    }
    // Small delay to allow receipt generation
    const timer = setTimeout(fetchReceipt, 2000);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="min-h-screen bg-background text-foreground">
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
            <p className="text-muted-foreground text-lg">
              Obrigado pela sua compra. Seu pedido foi processado com sucesso.
            </p>
          </div>

          {/* Order Details */}
          <Card className="p-6 bg-card/50 border-border mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold">Detalhes do Pedido</h2>
            </div>

            <div className="space-y-3">
              {orderNumber && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Número do Pedido</span>
                  <span className="font-mono font-bold text-amber-400">{orderNumber}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <span className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Pago
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Data</span>
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
          <Card className="p-6 bg-amber-900/20 border-amber-800/50 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Confirmação enviada por email</h3>
                <p className="text-sm text-muted-foreground">
                  Enviamos um email com os detalhes do seu pedido e instruções de acesso. 
                  Verifique também sua caixa de spam.
                </p>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="p-6 bg-card/50 border-border mb-6">
            <h3 className="font-semibold mb-4">Próximos Passos</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-400">1</span>
                </div>
                <div>
                  <p className="font-medium">Acesse seu Dashboard</p>
                  <p className="text-sm text-muted-foreground">
                    Seus cursos e recursos já estão disponíveis no seu portal.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-400">2</span>
                </div>
                <div>
                  <p className="font-medium">Comece a aprender</p>
                  <p className="text-sm text-muted-foreground">
                    Explore os conteúdos e comece sua jornada de aprendizado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-400">3</span>
                </div>
                <div>
                  <p className="font-medium">Ganhe XP</p>
                  <p className="text-sm text-muted-foreground">
                    Complete lições e desafios para subir de nível e ganhar recompensas.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 py-6"
              onClick={() => router.push("/pt-BR/portal")}
            >
              Acessar Meu Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {receiptId && (
              <Button
                variant="outline"
                className="flex-1 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/30 py-6"
                onClick={() => router.push(`/pt-BR/receipt/${receiptId}`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Comprovante
              </Button>
            )}

            <Button
              variant="outline"
              className="flex-1 border-border py-6"
              onClick={() => router.push("/pt-BR/portal?tab=carrinho")}
            >
              <Download className="w-4 h-4 mr-2" />
              Ver Meus Pedidos
            </Button>
          </div>

          {/* Support */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Precisa de ajuda? Entre em contato pelo email{" "}
            <a href="mailto:suporte@fayai.com.br" className="text-amber-400 hover:underline">
              suporte@fayai.com.br
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Main export with Suspense boundary
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
