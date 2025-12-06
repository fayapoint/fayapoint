"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const planName = params.plan as string;
  
  const { user, isLoggedIn } = useUser();
  const { items, cartTotal, clearCart } = useServiceCart();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [isLoggedIn, user]);

  const handlePayment = async () => {
    if (!name || !email) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    if (isCartCheckout && cartItems.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    setLoading(true);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        toast.error("Você precisa estar logado para finalizar a compra.");
        setLoading(false);
        return;
      }

      // Prepare order items
      const orderItems = cartItems.map(item => ({
        id: item.id,
        type: item.id.startsWith("store-") ? "product" : item.type,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }));

      // Create order via API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: cartTotal,
          paymentMethod: "pending", // Will be set when payment is implemented
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar pedido");
      }

      toast.success("Pedido realizado com sucesso!");
      
      if (data.xpAwarded > 0) {
        toast.success(`+${data.xpAwarded} XP ganhos!`, { icon: "🎉" });
      }

      clearCart();
      
      // Redirect to portal orders
      router.push("/pt-BR/portal?tab=carrinho");
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  const cartItems = Object.values(items);
  const isCartCheckout = planName === 'cart';

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-400 mb-8">
            {isCartCheckout 
              ? "Revise seus itens e finalize seu pedido." 
              : `Finalize sua assinatura do plano ${planName}.`}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="p-6 bg-gray-900/50 border-gray-800">
                <h3 className="text-xl font-semibold mb-4">Resumo do Pedido</h3>
                {isCartCheckout ? (
                  cartItems.length > 0 ? (
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-400">
                              {item.type === 'course' ? 'Curso' : 'Serviço'} x {item.quantity}
                            </p>
                          </div>
                          <span className="font-semibold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <Separator className="bg-gray-800 my-4" />
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-purple-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Seu carrinho está vazio.</p>
                  )
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">Plano {planName}</span>
                    <span className="text-gray-400">Preço a confirmar</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Customer Info & Payment */}
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Seus Dados</h3>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome completo</label>
                  <input 
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Nome completo" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoggedIn} // Lock if logged in
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input 
                    className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggedIn} // Lock if logged in
                  />
                </div>

                {isLoggedIn && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Logado como {user?.name}
                  </p>
                )}
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                 <h3 className="text-xl font-semibold mb-4">Pagamento</h3>
                 <div className="bg-gray-950 border border-gray-800 rounded p-4 text-gray-400 text-sm mb-4">
                   Integração com Stripe/MercadoPago em breve via API.
                 </div>
                 
                 <Button 
                   className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg font-bold"
                   onClick={handlePayment}
                   disabled={loading || (isCartCheckout && cartItems.length === 0)}
                 >
                   {loading ? "Processando..." : "Confirmar Pagamento"}
                 </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
