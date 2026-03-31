"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  CreditCard,
  Truck,
  Shield,
  Tag,
  X,
  Check,
  Sparkles,
  History,
  BookOpen,
  Wrench,
  Store,
  Receipt,
  Download,
  Printer,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useServiceCart, CartItem } from "@/contexts/ServiceCartContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { getClientAuthHeaders } from "@/lib/client-auth";

interface OrderItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export function CartPanel() {
  const router = useRouter();
  const { items, setItemQuantity, removeItem, clearCart, itemCount, cartTotal } = useServiceCart();
  const [activeTab, setActiveTab] = useState("cart");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Fetch orders when switching to history tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch("/api/orders", {
        headers: getClientAuthHeaders(),
        credentials: "include",
      });

      if (response.status === 401) {
        setOrders([]);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const cartItems = Object.values(items);
  
  // Separate items by type
  const productItems = cartItems.filter(item => item.id.startsWith("store-"));
  const courseItems = cartItems.filter(item => item.type === "course");
  const serviceItems = cartItems.filter(item => item.type === "service" && !item.id.startsWith("store-"));

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      removeItem(item.id);
      toast.success("Item removido");
    } else {
      setItemQuantity(item.id, newQuantity);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (couponCode.toUpperCase() === "FAYA10") {
      setAppliedCoupon({ code: "FAYA10", discount: 10 });
      toast.success("Cupom aplicado: 10% de desconto!");
    } else if (couponCode.toUpperCase() === "FAYA20") {
      setAppliedCoupon({ code: "FAYA20", discount: 20 });
      toast.success("Cupom aplicado: 20% de desconto!");
    } else {
      toast.error("Cupom inválido");
    }
    setIsApplyingCoupon(false);
    setCouponCode("");
  };

  const discountAmount = appliedCoupon ? (cartTotal * appliedCoupon.discount) / 100 : 0;
  const finalTotal = cartTotal - discountAmount;

  // Cart Item Component
  const CartItemCard = ({ item }: { item: CartItem }) => {
    const getTypeIcon = () => {
      if (item.id.startsWith("store-")) return <Store size={14} />;
      if (item.type === "course") return <BookOpen size={14} />;
      return <Wrench size={14} />;
    };
    
    const getTypeLabel = () => {
      if (item.id.startsWith("store-")) return "Produto";
      if (item.type === "course") return "Curso";
      return "Serviço";
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="group relative"
      >
        {/* Glass Card */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-border" />
          
          <div className="relative p-3 md:p-4 flex gap-3 md:gap-4">
            {/* Image */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-gray-800 to-card flex-shrink-0 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={28} className="text-gray-600" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 mb-1">
                    {getTypeIcon()}
                    <span className="ml-1">{getTypeLabel()}</span>
                  </Badge>
                  <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                </div>
                <button
                  onClick={() => {
                    removeItem(item.id);
                    toast.success("Removido");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-500/20 rounded-lg text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3">
                {/* Quantity */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuantityChange(item, -1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item, 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="font-bold text-green-400">{formatPrice(item.price * item.quantity)}</p>
                  {item.quantity > 1 && (
                    <p className="text-[10px] text-muted-foreground">{formatPrice(item.price)} cada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Order Summary Sidebar
  const OrderSummary = () => (
    <div className="relative rounded-2xl overflow-hidden h-fit sticky top-24">
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-border" />
      
      <div className="relative p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Receipt size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-bold">Resumo do Pedido</h3>
            <p className="text-xs text-muted-foreground">{itemCount} itens no carrinho</p>
          </div>
        </div>

        {/* Items breakdown */}
        {cartItems.length > 0 && (
          <div className="space-y-2 text-sm">
            {productItems.length > 0 && (
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span className="flex items-center gap-1.5 min-w-0 truncate"><Store size={14} className="shrink-0" /> Produtos ({productItems.length})</span>
                <span className="shrink-0">{formatPrice(productItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}</span>
              </div>
            )}
            {courseItems.length > 0 && (
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span className="flex items-center gap-1.5 min-w-0 truncate"><BookOpen size={14} className="shrink-0" /> Cursos ({courseItems.length})</span>
                <span className="shrink-0">{formatPrice(courseItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}</span>
              </div>
            )}
            {serviceItems.length > 0 && (
              <div className="flex justify-between gap-2 text-muted-foreground">
                <span className="flex items-center gap-1.5 min-w-0 truncate"><Wrench size={14} className="shrink-0" /> Serviços ({serviceItems.length})</span>
                <span className="shrink-0">{formatPrice(serviceItems.reduce((sum, i) => sum + i.price * i.quantity, 0))}</span>
              </div>
            )}
          </div>
        )}

        {/* Coupon */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Cupom de Desconto</label>
          <div className="flex gap-2">
            <Input
              placeholder="FAYA10"
              className="bg-secondary border-border text-sm h-9"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 h-9"
                onClick={() => { setAppliedCoupon(null); toast.success("Removido"); }}
              >
                <X size={14} />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-400 h-9"
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >
                {isApplyingCoupon ? "..." : "Aplicar"}
              </Button>
            )}
          </div>
          {appliedCoupon && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <Check size={12} /> {appliedCoupon.discount}% de desconto aplicado
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
          {appliedCoupon && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Desconto</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Frete</span>
            <span className="text-green-400">Grátis</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="font-semibold">Total</span>
            <span className="text-xl md:text-2xl font-bold text-green-400">{formatPrice(finalTotal)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-right">
            ou 12x de {formatPrice(finalTotal / 12)} sem juros
          </p>
        </div>

        {/* Checkout */}
        <Button 
          className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base font-bold rounded-xl"
          disabled={cartItems.length === 0}
          onClick={() => router.push("/pt-BR/checkout/cart")}
        >
          <CreditCard size={18} className="mr-2" />
          Finalizar Compra
        </Button>

        {/* Trust */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Truck size={12} className="text-green-400" />
            Frete Grátis
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Shield size={12} className="text-blue-400" />
            Compra Segura
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Tag size={12} className="text-amber-400" />
            Garantia
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CreditCard size={12} className="text-yellow-400" />
            12x sem juros
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-hidden">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary border border-border p-1 h-auto">
            <TabsTrigger value="cart" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm">
              <ShoppingCart size={16} className="shrink-0" />
              <span className="truncate">Carrinho</span>
              {itemCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 ml-1 shrink-0">{itemCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm">
              <History size={16} className="shrink-0" />
              <span className="truncate">Histórico</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                  <ShoppingCart size={36} className="text-gray-600" />
                </div>
                <h2 className="text-lg md:text-xl font-bold mb-2">Carrinho Vazio</h2>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Explore nossa loja e adicione produtos, cursos e serviços ao seu carrinho!
                </p>
                <Button className="bg-gradient-to-r from-amber-600 to-yellow-700 rounded-xl">
                  <Sparkles size={16} className="mr-2" />
                  Explorar Loja
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-3 md:space-y-4 min-w-0">
                  {/* Clear All */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
                      onClick={() => { clearCart(); toast.success("Carrinho limpo"); }}
                    >
                      <Trash2 size={14} />
                      Limpar tudo
                    </Button>
                  </div>

                  {/* Products Section */}
                  {productItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Store size={14} /> Produtos ({productItems.length})
                      </h3>
                      <div className="space-y-3">
                        {productItems.map(item => <CartItemCard key={item.id} item={item} />)}
                      </div>
                    </div>
                  )}

                  {/* Courses Section */}
                  {courseItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <BookOpen size={14} /> Cursos ({courseItems.length})
                      </h3>
                      <div className="space-y-3">
                        {courseItems.map(item => <CartItemCard key={item.id} item={item} />)}
                      </div>
                    </div>
                  )}

                  {/* Services Section */}
                  {serviceItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Wrench size={14} /> Serviços ({serviceItems.length})
                      </h3>
                      <div className="space-y-3">
                        {serviceItems.map(item => <CartItemCard key={item.id} item={item} />)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <OrderSummary />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base md:text-lg font-bold truncate">Histórico de Pedidos</h2>
              <Button variant="outline" size="sm" className="border-border gap-1.5 md:gap-2 shrink-0" onClick={fetchOrders}>
                <Download size={14} />
                Atualizar
              </Button>
            </div>

            {isLoadingOrders ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-4" />
                <p className="text-muted-foreground">Carregando pedidos...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[30vh]">
                <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                  <Receipt size={36} className="text-gray-600" />
                </div>
                <h2 className="text-lg md:text-xl font-bold mb-2">Nenhum Pedido</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                  Você ainda não fez nenhum pedido. Explore nossa loja!
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="relative rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-border" />
                  
                  <div className="relative p-3 md:p-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Receipt size={16} className="text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">#{order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 ml-11 sm:ml-0">
                        <Badge className={cn("border text-xs", statusColors[order.status] || statusColors.pending)}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                        <p className="text-base md:text-lg font-bold text-green-400">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 pt-4 border-t border-border">
                      {order.items.map((item: OrderItem, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-sm min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {item.type === "product" ? <Package size={14} className="text-muted-foreground shrink-0" /> :
                             item.type === "course" ? <BookOpen size={14} className="text-muted-foreground shrink-0" /> :
                             <Wrench size={14} className="text-muted-foreground shrink-0" />}
                            <span className="text-muted-foreground truncate">{item.name}</span>
                            <span className="text-gray-600 shrink-0">x{item.quantity}</span>
                          </div>
                          <span className="text-muted-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
                      <Button variant="outline" size="sm" className="border-border gap-1.5 md:gap-2 flex-1 text-xs md:text-sm">
                        <Receipt size={14} className="shrink-0" />
                        <span className="truncate">Ver Detalhes</span>
                      </Button>
                      <Button variant="outline" size="sm" className="border-border gap-2">
                        <Printer size={14} />
                      </Button>
                      <Button variant="outline" size="sm" className="border-border gap-2">
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
