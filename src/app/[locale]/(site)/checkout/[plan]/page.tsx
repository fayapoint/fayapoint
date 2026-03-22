"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { toast } from "react-hot-toast";
import { getClientAuthHeaders, getClientBearerToken } from "@/lib/client-auth";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  QrCode,
  FileText,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  RefreshCw,
  Gift,
  Lock,
  Zap,
  Award,
  Star,
  BookOpen,
  ArrowRight,
  Sparkles,
  Timer,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";

// ─── Plan Data ────────────────────────────────────────────────────────────────

const PLAN_DATA: Record<string, {
  name: string; slug: string; monthlyPrice: number; yearlyPrice: number;
  monthlyCredits: number; emoji: string; color: string; gradient: string;
  features: string[]; badge?: string;
}> = {
  explorador: {
    name: "Explorador", slug: "explorador", monthlyPrice: 57, yearlyPrice: 570,
    monthlyCredits: 100, emoji: "🧭", color: "emerald", gradient: "from-emerald-500 to-teal-600",
    features: [
      "3 cursos iniciantes por mês",
      "100 créditos/mês para IA",
      "10% de desconto em certificações",
      "Certificados verificáveis online",
      "Acesso à comunidade",
    ],
  },
  profissional: {
    name: "Profissional", slug: "profissional", monthlyPrice: 97, yearlyPrice: 970,
    monthlyCredits: 300, emoji: "🚀", color: "purple", gradient: "from-purple-500 to-violet-600",
    badge: "Mais Popular",
    features: [
      "8 cursos por mês (todos os níveis)",
      "300 créditos/mês para IA",
      "20% de desconto em certificações",
      "Suporte prioritário",
      "Conteúdo exclusivo antecipado",
    ],
  },
  expert: {
    name: "Expert", slug: "expert", monthlyPrice: 167, yearlyPrice: 1670,
    monthlyCredits: 800, emoji: "👑", color: "amber", gradient: "from-amber-500 to-orange-600",
    features: [
      "14 cursos por mês (todos os níveis)",
      "800 créditos/mês para IA",
      "50% de desconto em certificações",
      "Suporte VIP dedicado",
      "Consultoria mensal com especialista",
    ],
  },
  // Legacy aliases
  starter: { name: "Explorador", slug: "explorador", monthlyPrice: 57, yearlyPrice: 570, monthlyCredits: 100, emoji: "🧭", color: "emerald", gradient: "from-emerald-500 to-teal-600", features: [] },
  pro: { name: "Profissional", slug: "profissional", monthlyPrice: 97, yearlyPrice: 970, monthlyCredits: 300, emoji: "🚀", color: "purple", gradient: "from-purple-500 to-violet-600", features: [] },
  business: { name: "Expert", slug: "expert", monthlyPrice: 167, yearlyPrice: 1670, monthlyCredits: 800, emoji: "👑", color: "amber", gradient: "from-amber-500 to-orange-600", features: [] },
};

// ─── Inline SVG Payment Icons ─────────────────────────────────────────────────

function PixIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none">
      <path d="M382.6 352.7c-12.2 0-23.7-4.8-32.4-13.4l-82.1-82.1c-4.8-4.8-13.1-4.9-17.9 0l-82.5 82.5c-8.6 8.6-20.2 13.4-32.4 13.4h-16.8l103.9 103.9c25 25 65.5 25 90.5 0l103.5-103.5-15.6-.1c-.1-.3-.2-.7-.2-.7z" fill="#32BCAD"/>
      <path d="M135.3 159.3c12.2 0 23.7 4.8 32.4 13.4l82.5 82.5c4.9 4.9 13 4.9 17.9 0l82.1-82.1c8.6-8.6 20.2-13.4 32.4-13.4h15.8L294.5 55.4c-25-25-65.5-25-90.5 0L100.5 158.9l17.2.1c6-.1 11.7.1 17.6.3z" fill="#32BCAD"/>
      <path d="M453.3 214.8l-60.3-60.3c1 .3 1.7.3 2.5.3h-13.1c-8.5 0-17 3.5-23.1 9.6l-82.1 82.1c-7.4 7.4-17.1 11.1-26.9 11.1s-19.5-3.7-26.9-11.1l-82.5-82.5c-6.1-6.1-14.5-9.6-23.1-9.6h-20.1l-57 57c-25 25-25 65.5 0 90.5l57.3 57.3h19.4c8.5 0 17-3.5 23.1-9.6l82.5-82.5c14.3-14.3 39.4-14.3 53.7 0l82.1 82.1c6.1 6.1 14.5 9.6 23.1 9.6h13.6l60-60c25-25 25-65.5 0-90.5-.1 0 .8 3.2-2.2 16.5z" fill="#32BCAD"/>
    </svg>
  );
}

function VisaIcon({ className = "h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none">
      <rect width="780" height="500" rx="40" fill="#1A1F71"/>
      <path d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4z" fill="#fff"/>
      <path d="M524.3 156.3c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.5-90.2 64.5-.3 28.1 26.5 43.7 46.8 53.1 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.7-26.2 93.1-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30-15.1-29.9-24.3 0-8.1 9.7-16.8 30.5-16.8 17.4-.3 30 3.5 39.8 7.5l4.8 2.2 7.2-42.3z" fill="#fff"/>
      <path d="M612.5 152.9h-41.3c-12.8 0-22.4 3.5-28 16.2l-79.4 179.6h56.2s9.2-24.1 11.3-29.4c6.1 0 60.8.1 68.6.1 1.6 6.9 6.5 29.3 6.5 29.3h49.7l-43.6-195.8zm-60 126.4c4.4-11.3 21.4-54.7 21.4-54.7-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 46.9 12.5 56.5h-44.6z" fill="#fff"/>
      <path d="M232.8 152.9l-52.3 133.5-5.6-27c-9.7-31.2-39.8-65.1-73.5-82l47.9 171.2h56.6l84.2-195.7h-57.3z" fill="#fff"/>
      <path d="M147.2 152.9H59.3l-.7 3.7c67.2 16.2 111.7 55.4 130.1 102.4l-18.8-90.2c-3.2-12.4-12.7-15.5-22.7-15.9z" fill="#EC982D"/>
    </svg>
  );
}

function MastercardIcon({ className = "h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none">
      <rect width="780" height="500" rx="40" fill="#16366F"/>
      <circle cx="312" cy="250" r="155" fill="#EB001B"/>
      <circle cx="468" cy="250" r="155" fill="#F79E1B"/>
      <path d="M390 128.2c-38.8 31.7-63.6 79.7-63.6 133.8s24.8 102.1 63.6 133.8c38.8-31.7 63.6-79.7 63.6-133.8s-24.8-102.1-63.6-133.8z" fill="#FF5F00"/>
    </svg>
  );
}

function EloIcon({ className = "h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none">
      <rect width="780" height="500" rx="40" fill="#000"/>
      <text x="390" y="280" textAnchor="middle" fill="#FFCB05" fontSize="180" fontWeight="700" fontFamily="Arial">elo</text>
    </svg>
  );
}

function HipercardIcon({ className = "h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none">
      <rect width="780" height="500" rx="40" fill="#822124"/>
      <text x="390" y="290" textAnchor="middle" fill="#fff" fontSize="120" fontWeight="700" fontFamily="Arial">hipercard</text>
    </svg>
  );
}

function AmexIcon({ className = "h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 780 500" fill="none">
      <rect width="780" height="500" rx="40" fill="#2E77BC"/>
      <text x="390" y="290" textAnchor="middle" fill="#fff" fontSize="120" fontWeight="700" fontFamily="Arial">AMEX</text>
    </svg>
  );
}

function MercadoPagoIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#00B1EA"/>
      <path d="M32 16c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 28c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z" fill="#fff"/>
      <path d="M32 24c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#fff"/>
      <circle cx="32" cy="32" r="2" fill="#fff"/>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "pix" | "boleto" | "credit_card" | "mercadopago" | "undefined";

interface SavedCard {
  id: string; lastFour: string; brand: string; holderName: string;
  expiryMonth: string; expiryYear: string; isDefault: boolean;
}

interface PaymentResult {
  success: boolean; orderNumber: string; paymentId: string;
  status: string; method: PaymentMethod; total: number;
  paymentUrl?: string;
  pixData?: { qrCodeBase64: string; qrCodePayload: string; expirationDate: string; };
  boletoData?: { barCode: string; digitableLine: string; bankSlipUrl: string; dueDate: string; };
  isPaid?: boolean;
}

interface EnrollmentResult { success?: boolean; error?: string; message?: string; }

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const planName = params.plan as string;
  const { user, isLoggedIn } = useUser();
  const { items, cartTotal, clearCart } = useServiceCart();

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");

  // Credit card
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  // Address
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("pix");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Saved cards
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);

  // Subscription
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionCycle, setSubscriptionCycle] = useState<"monthly" | "yearly">("monthly");

  // ─── Derived state ──────────────────────────────────────────────────

  const subscriptionPlans = useMemo(() => ["starter", "pro", "business", "explorador", "profissional", "expert"], []);
  const planInfo = PLAN_DATA[planName] || null;
  const isCartCheckout = planName === "cart";
  const cartItems = Object.values(items);

  // Calculate total — fix the R$0 bug by fetching plan price for subscription checkout
  const total = useMemo(() => {
    if (isCartCheckout) return cartTotal;
    if (planInfo) {
      return subscriptionCycle === "yearly" ? planInfo.yearlyPrice : planInfo.monthlyPrice;
    }
    return 0;
  }, [isCartCheckout, cartTotal, planInfo, subscriptionCycle]);

  const isFreeCourseCheckout = isCartCheckout && cartItems.length > 0 && !isSubscription && total <= 0
    && cartItems.every((item) => item.type === "course" && Boolean(item.slug));

  const effectiveTotal = isFreeCourseCheckout ? 0 : selectedMethod === "boleto" ? total * 0.95 : total;

  const installmentOptions = useMemo(() => {
    const opts = [];
    for (let i = 1; i <= 12; i++) {
      const value = total / i;
      if (value >= 5) {
        opts.push({
          count: i,
          value,
          label: i === 1 ? `À vista - ${formatCurrency(total)}` : `${i}x de ${formatCurrency(value)} sem juros`,
        });
      }
    }
    return opts;
  }, [total]);

  // ─── Effects ────────────────────────────────────────────────────────

  useEffect(() => {
    if (isLoggedIn && user) {
      setName(user.name);
      setEmail(user.email);
      if (user.billing) {
        if (user.billing.phone) setPhone(user.billing.phone);
        if (user.billing.cpfCnpj) setCpfCnpj(formatCpfCnpj(user.billing.cpfCnpj));
        if (user.billing.postalCode) setPostalCode(user.billing.postalCode);
        if (user.billing.addressNumber) setAddressNumber(user.billing.addressNumber);
      }
      fetchSavedCards();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (subscriptionPlans.includes(planName)) setIsSubscription(true);
    if (planName === "cart") {
      const hasSubscription = cartItems.some(item => subscriptionPlans.includes(item.id));
      if (hasSubscription) setIsSubscription(true);
    }
  }, [planName, items, subscriptionPlans, cartItems]);

  useEffect(() => {
    if (paymentResult?.method === "pix" && paymentResult.status === "pending") {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentResult]);

  // ─── Helpers ────────────────────────────────────────────────────────

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  const formatCpfCnpj = (value: string) => {
    const d = value.replace(/\D/g, "");
    if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const d = value.replace(/\D/g, "");
    return d.length <= 10 ? d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3") : d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const formatCardNumber = (value: string) => value.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();

  const formatExpiry = (value: string) => {
    const d = value.replace(/\D/g, "");
    return d.length >= 2 ? d.slice(0, 2) + "/" + d.slice(2, 4) : d;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Erro ao copiar"); }
  };

  // ─── API Calls ──────────────────────────────────────────────────────

  const fetchSavedCards = async () => {
    setLoadingCards(true);
    try {
      const res = await fetch("/api/user/saved-cards", { headers: getClientAuthHeaders(), credentials: "include" });
      if (res.status === 401) { setSavedCards([]); return; }
      if (res.ok) {
        const data = await res.json();
        setSavedCards(data.cards || []);
        const def = data.cards?.find((c: SavedCard) => c.isDefault);
        if (def) { setSelectedCard(def.id); setSelectedMethod("credit_card"); }
      }
    } catch (e) { console.error("Error fetching saved cards:", e); }
    finally { setLoadingCards(false); }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!paymentResult?.paymentId) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/payments/${paymentResult.paymentId}`, { headers: getClientAuthHeaders(), credentials: "include" });
      const data = await res.json();
      if (data.payment?.status === "paid") {
        toast.success("Pagamento confirmado!");
        clearCart();
        router.push(`/pt-BR/checkout/success?order=${paymentResult.orderNumber}`);
      }
    } catch (e) { console.error("Error checking status:", e); }
    finally { setCheckingStatus(false); }
  }, [paymentResult, clearCart, router]);

  const handlePayment = async () => {
    if (!name || !email) { toast.error("Preencha nome e email."); return; }
    if (!isFreeCourseCheckout && (!cpfCnpj || cpfCnpj.replace(/\D/g, "").length < 11)) { toast.error("Informe CPF ou CNPJ válido."); return; }
    if (isCartCheckout && cartItems.length === 0) { toast.error("Carrinho vazio."); return; }
    if (!isFreeCourseCheckout && selectedMethod === "credit_card" && !selectedCard) {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) { toast.error("Preencha os dados do cartão."); return; }
      if (!postalCode || !addressNumber) { toast.error("Informe CEP e número."); return; }
    }
    // MercadoPago only needs name, email, cpf — skip card validation
    if (selectedMethod === "mercadopago" && !isFreeCourseCheckout && !cpfCnpj) {
      // CPF is optional for MP redirect, but we already validated above
    }

    setLoading(true);
    try {
      const token = getClientBearerToken();
      if (!isLoggedIn && !token) { toast.error("Faça login para continuar."); router.push("/pt-BR/login"); return; }

      // MercadoPago redirect flow
      if (selectedMethod === "mercadopago" && !isFreeCourseCheckout) {
        const mpRes = await fetch("/api/payments/mercadopago-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
          credentials: "include",
          body: JSON.stringify({
            planSlug: planInfo?.slug || planName,
            planName: planInfo?.name || planName,
            price: effectiveTotal,
            cycle: subscriptionCycle,
          }),
        });
        const mpData = await mpRes.json();
        if (!mpRes.ok) throw new Error(mpData.error || "Erro ao criar checkout MercadoPago");
        if (mpData.redirectUrl) {
          window.location.href = mpData.redirectUrl;
          return;
        }
        throw new Error("URL de redirecionamento não encontrada");
      }

      if (isFreeCourseCheckout) {
        for (const item of cartItems) {
          const res = await fetch("/api/courses/enroll", {
            method: "POST", headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
            credentials: "include", body: JSON.stringify({ courseSlug: item.slug }),
          });
          const data = (await res.json()) as EnrollmentResult;
          if (!res.ok) throw new Error(data.error || `Não foi possível liberar ${item.name}`);
        }
        clearCart();
        toast.success(cartItems.length === 1 ? "Curso liberado!" : "Cursos liberados!");
        router.push("/pt-BR/portal?tab=cursos");
        return;
      }

      // Build order items
      const orderItems = isCartCheckout
        ? cartItems.map(item => ({ id: item.id, slug: item.slug || item.id, type: item.id.startsWith("store-") ? "product" : item.type, name: item.name, quantity: item.quantity, price: item.price }))
        : [{ id: planInfo?.slug || planName, slug: planInfo?.slug || planName, type: "subscription", name: `Plano ${planInfo?.name || planName}`, quantity: 1, price: total }];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = { items: orderItems, method: selectedMethod, cpfCnpj: cpfCnpj.replace(/\D/g, ""), phone: phone.replace(/\D/g, "") };

      if (selectedMethod === "credit_card") {
        if (selectedCard) { body.savedCardId = selectedCard; }
        else {
          const [expMonth, expYear] = cardExpiry.split("/");
          body.creditCard = { holderName: cardHolder, number: cardNumber.replace(/\D/g, ""), expiryMonth: expMonth, expiryYear: "20" + expYear, ccv: cardCvv };
          body.address = { postalCode: postalCode.replace(/\D/g, ""), number: addressNumber };
          body.saveCard = saveCard;
        }
        body.installments = installments;
      }

      if (isSubscription) {
        body.isSubscription = true;
        body.subscriptionCycle = subscriptionCycle;
        let slug = planName;
        if (planName === "cart") {
          const sub = cartItems.find(item => subscriptionPlans.includes(item.id));
          if (sub) slug = sub.id;
        }
        body.planSlug = slug;
        body.cycle = subscriptionCycle;
        body.billingType = selectedMethod === "credit_card" ? "credit_card" : selectedMethod;
      }

      const endpoint = isSubscription ? "/api/subscriptions" : "/api/payments";
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        credentials: "include", body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao processar pagamento");

      setPaymentResult(data as PaymentResult);
      if (data.isPaid) {
        toast.success("Pagamento aprovado!");
        clearCart();
        router.push(`/pt-BR/checkout/success?order=${data.orderNumber}`);
      } else {
        toast.success("Cobrança criada! Complete o pagamento.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally { setLoading(false); }
  };

  // ─── Payment Result Screen ─────────────────────────────────────────

  if (paymentResult && !paymentResult.isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-purple-500/20">
                <Clock className="w-10 h-10 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Aguardando Pagamento</h1>
              <p className="text-gray-400">Pedido #{paymentResult.orderNumber}</p>
            </div>

            <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-8">
              {/* PIX */}
              {paymentResult.method === "pix" && paymentResult.pixData && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <PixIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Pague com PIX</span>
                  </div>

                  <div className="bg-white p-6 rounded-2xl inline-block mx-auto shadow-2xl">
                    <Image src={`data:image/png;base64,${paymentResult.pixData.qrCodeBase64}`} alt="PIX QR Code" width={220} height={220} className="mx-auto" />
                  </div>

                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    {formatCurrency(paymentResult.total)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">PIX Copia e Cola:</p>
                    <div className="flex gap-2">
                      <input readOnly value={paymentResult.pixData.qrCodePayload} className="flex-1 bg-gray-950/50 border border-gray-700 rounded-xl p-3 text-white text-sm truncate" />
                      <Button onClick={() => copyToClipboard(paymentResult.pixData!.qrCodePayload)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400 bg-gray-800/30 rounded-xl p-3">
                    {checkingStatus ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Verificando pagamento...</>
                    ) : (
                      <><Timer className="w-4 h-4 text-emerald-400" /> Confirmação automática em segundos</>
                    )}
                  </div>
                </div>
              )}

              {/* Boleto */}
              {paymentResult.method === "boleto" && paymentResult.boletoData && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold text-sm">Boleto Bancário</span>
                  </div>

                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    {formatCurrency(paymentResult.total)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Linha Digitável:</p>
                    <div className="flex gap-2">
                      <input readOnly value={paymentResult.boletoData.digitableLine} className="flex-1 bg-gray-950/50 border border-gray-700 rounded-xl p-3 text-white text-sm font-mono" />
                      <Button onClick={() => copyToClipboard(paymentResult.boletoData!.digitableLine)} className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400">Vencimento: {new Date(paymentResult.boletoData.dueDate).toLocaleDateString("pt-BR")}</p>

                  <Button onClick={() => window.open(paymentResult.boletoData?.bankSlipUrl, "_blank")} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-4">
                    <FileText className="w-4 h-4 mr-2" /> Abrir Boleto PDF
                  </Button>
                </div>
              )}

              <Separator className="my-6 bg-gray-800/50" />
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 border-gray-700 rounded-xl" onClick={() => setPaymentResult(null)}>Voltar</Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl" onClick={() => router.push("/pt-BR/portal")}>Meu Portal</Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Main Checkout ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
              <Lock className="w-3.5 h-3.5" />
              Checkout seguro com criptografia SSL
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {isFreeCourseCheckout ? "Liberar Acesso Gratuito" : "Finalizar Assinatura"}
            </h1>
            <p className="text-gray-400">
              {isCartCheckout ? "Revise seus itens e finalize." : `Plano ${planInfo?.name || planName} — comece a aprender hoje.`}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* ─── Left Column ───────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Subscription Cycle Toggle */}
              {isSubscription && planInfo && (
                <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                    Ciclo de Cobrança
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setSubscriptionCycle("monthly")}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        subscriptionCycle === "monthly" ? "border-purple-500 bg-purple-500/10" : "border-gray-700/50 hover:border-gray-600"
                      }`}>
                      {subscriptionCycle === "monthly" && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-purple-400" /></div>}
                      <span className="text-lg font-bold block">{formatCurrency(planInfo.monthlyPrice)}</span>
                      <span className="text-sm text-gray-400">por mês</span>
                    </button>
                    <button type="button" onClick={() => setSubscriptionCycle("yearly")}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        subscriptionCycle === "yearly" ? "border-emerald-500 bg-emerald-500/10" : "border-gray-700/50 hover:border-gray-600"
                      }`}>
                      {subscriptionCycle === "yearly" && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /></div>}
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">-17%</div>
                      <span className="text-lg font-bold block">{formatCurrency(planInfo.yearlyPrice)}</span>
                      <span className="text-sm text-gray-400">por ano ({formatCurrency(planInfo.yearlyPrice / 12)}/mês)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Personal Info */}
              <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  Seus Dados
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Nome completo *</label>
                    <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition disabled:opacity-50" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoggedIn} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Email *</label>
                    <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition disabled:opacity-50" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoggedIn} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">{isFreeCourseCheckout ? "CPF ou CNPJ" : "CPF ou CNPJ *"}</label>
                    <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition" placeholder={isFreeCourseCheckout ? "Opcional" : "000.000.000-00"} value={cpfCnpj} onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))} maxLength={18} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">WhatsApp</label>
                    <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={15} />
                  </div>
                </div>
                {isLoggedIn && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-4"><BadgeCheck className="w-3.5 h-3.5" /> Logado como {user?.name}</p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {isFreeCourseCheckout ? "Liberação do Acesso" : "Forma de Pagamento"}
                </h3>

                {isFreeCourseCheckout ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400"><Gift className="h-5 w-5" /></div>
                      <div>
                        <p className="text-base font-semibold">Curso grátis do mês com certificado incluso</p>
                        <p className="mt-1 text-sm text-gray-400">Sem pagamento. Ao confirmar, o curso é liberado imediatamente.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Method Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {/* PIX */}
                      <button type="button" onClick={() => setSelectedMethod("pix")}
                        className={`group relative p-4 rounded-xl border-2 transition-all text-center ${
                          selectedMethod === "pix" ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5" : "border-gray-700/50 hover:border-gray-600"
                        }`}>
                        {selectedMethod === "pix" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        <PixIcon className="w-10 h-10 mx-auto mb-2" />
                        <span className="text-sm font-semibold block">PIX</span>
                        <span className="text-xs text-emerald-400 font-medium">Aprovação imediata</span>
                      </button>

                      {/* Boleto */}
                      <button type="button" onClick={() => setSelectedMethod("boleto")}
                        className={`group relative p-4 rounded-xl border-2 transition-all text-center ${
                          selectedMethod === "boleto" ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5" : "border-gray-700/50 hover:border-gray-600"
                        }`}>
                        {selectedMethod === "boleto" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        <FileText className={`w-10 h-10 mx-auto mb-2 ${selectedMethod === "boleto" ? "text-blue-400" : "text-gray-400"}`} />
                        <span className="text-sm font-semibold block">Boleto</span>
                        <span className="text-xs text-blue-400 font-medium">5% de desconto</span>
                      </button>

                      {/* Credit Card */}
                      <button type="button" onClick={() => setSelectedMethod("credit_card")}
                        className={`group relative p-4 rounded-xl border-2 transition-all text-center ${
                          selectedMethod === "credit_card" ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/5" : "border-gray-700/50 hover:border-gray-600"
                        }`}>
                        {selectedMethod === "credit_card" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        <CreditCard className={`w-10 h-10 mx-auto mb-2 ${selectedMethod === "credit_card" ? "text-purple-400" : "text-gray-400"}`} />
                        <span className="text-sm font-semibold block">Cartão</span>
                        <span className="text-xs text-purple-400 font-medium">Até 12x sem juros</span>
                      </button>

                      {/* MercadoPago */}
                      <button type="button" onClick={() => setSelectedMethod("mercadopago")}
                        className={`group relative p-4 rounded-xl border-2 transition-all text-center ${
                          selectedMethod === "mercadopago" ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/5" : "border-gray-700/50 hover:border-gray-600"
                        }`}>
                        {selectedMethod === "mercadopago" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        <MercadoPagoIcon className="w-10 h-10 mx-auto mb-2" />
                        <span className="text-sm font-semibold block">MercadoPago</span>
                        <span className="text-xs text-cyan-400 font-medium">Checkout seguro</span>
                      </button>
                    </div>

                    {/* Card Brands Strip */}
                    <div className="flex items-center justify-center gap-3 mb-6 opacity-60">
                      <VisaIcon className="h-7 rounded" />
                      <MastercardIcon className="h-7 rounded" />
                      <EloIcon className="h-7 rounded" />
                      <AmexIcon className="h-7 rounded" />
                      <HipercardIcon className="h-7 rounded" />
                    </div>

                    {/* MercadoPago Info */}
                    {selectedMethod === "mercadopago" && (
                      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <MercadoPagoIcon className="w-8 h-8 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-cyan-300">Checkout MercadoPago</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Você será redirecionado para o ambiente seguro do MercadoPago para completar o pagamento com PIX, cartão de crédito, débito ou boleto.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Credit Card Form */}
                    {selectedMethod === "credit_card" && (
                      <div className="space-y-4 pt-4 border-t border-gray-800/50">
                        {/* Saved Cards */}
                        {savedCards.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2"><Wallet className="w-4 h-4 inline mr-1" /> Cartões Salvos</label>
                            <div className="space-y-2">
                              {savedCards.map((card) => (
                                <button key={card.id} type="button" onClick={() => { setSelectedCard(selectedCard === card.id ? null : card.id); if (selectedCard !== card.id) { setCardNumber(""); setCardHolder(""); setCardExpiry(""); setCardCvv(""); } }}
                                  className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${selectedCard === card.id ? "border-purple-500 bg-purple-500/10" : "border-gray-700/50 hover:border-gray-600"}`}>
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                    <span className="font-mono">•••• {card.lastFour}</span>
                                    <span className="text-xs text-gray-500 capitalize">{card.brand}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">{card.expiryMonth}/{card.expiryYear}</span>
                                </button>
                              ))}
                              <button type="button" onClick={() => setSelectedCard(null)}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-center ${!selectedCard ? "border-purple-500 bg-purple-500/10" : "border-gray-700/50 hover:border-gray-600"}`}>
                                <CreditCard className="w-4 h-4 inline mr-2" /> Usar outro cartão
                              </button>
                            </div>
                          </div>
                        )}

                        {/* New Card Form */}
                        {!selectedCard && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-400 mb-1.5">Número do Cartão *</label>
                              <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition font-mono" placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-400 mb-1.5">Nome no Cartão *</label>
                              <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition uppercase" placeholder="NOME COMO ESTÁ NO CARTÃO" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1.5">Validade *</label>
                              <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition font-mono" placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1.5">CVV *</label>
                              <input type="password" className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition font-mono" placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} maxLength={4} />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1.5">CEP *</label>
                              <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition" placeholder="00000-000" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2"))} maxLength={9} />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-400 mb-1.5">Número *</label>
                              <input className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition" placeholder="123" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm text-gray-400 mb-1.5">Parcelas</label>
                              <select className="w-full bg-gray-950/50 border border-gray-700/50 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none transition" value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))}>
                                {installmentOptions.map((opt) => <option key={opt.count} value={opt.count}>{opt.label}</option>)}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500" />
                                <span className="text-sm text-gray-400">Salvar cartão para compras futuras</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ─── Right Column — Order Summary ──────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6 sticky top-24">

                {/* Plan Summary Header */}
                {planInfo && !isCartCheckout && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{planInfo.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold">Plano {planInfo.name}</h3>
                        {planInfo.badge && (
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{planInfo.badge}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {planInfo.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-gray-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                {isCartCheckout && cartItems.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h3 className="text-lg font-semibold">Seu Pedido</h3>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.type === "course" ? "Curso" : "Serviço"} x {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator className="bg-gray-800/50 mb-4" />

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  {!isFreeCourseCheckout && selectedMethod === "boleto" && (
                    <div className="flex justify-between items-center text-sm text-emerald-400">
                      <span>Desconto Boleto (5%)</span>
                      <span>-{formatCurrency(total * 0.05)}</span>
                    </div>
                  )}
                  <Separator className="bg-gray-800/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                      {formatCurrency(effectiveTotal)}
                    </span>
                  </div>
                  {!isFreeCourseCheckout && selectedMethod === "credit_card" && installments > 1 && (
                    <p className="text-sm text-gray-400 text-center">ou {installments}x de {formatCurrency(total / installments)} sem juros</p>
                  )}
                  {isSubscription && subscriptionCycle === "yearly" && planInfo && (
                    <div className="text-center">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                        Economia de {formatCurrency(planInfo.monthlyPrice * 12 - planInfo.yearlyPrice)}/ano
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full py-6 text-lg font-bold rounded-xl transition-all shadow-lg ${
                    isFreeCourseCheckout
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20"
                      : "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-purple-500/20"
                  }`}
                  onClick={handlePayment}
                  disabled={loading || (isCartCheckout && cartItems.length === 0)}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {isFreeCourseCheckout ? "Liberando..." : selectedMethod === "mercadopago" ? "Redirecionando..." : "Processando..."}</>
                  ) : isFreeCourseCheckout ? (
                    <><Gift className="w-5 h-5 mr-2" /> Liberar Acesso Grátis</>
                  ) : selectedMethod === "mercadopago" ? (
                    <><ArrowRight className="w-5 h-5 mr-2" /> Pagar via MercadoPago — {formatCurrency(effectiveTotal)}</>
                  ) : (
                    <><ArrowRight className="w-5 h-5 mr-2" /> Pagar {formatCurrency(effectiveTotal)}</>
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                    Pagamento 100% seguro — dados criptografados
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800/20">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] text-gray-500 text-center leading-tight">Garantia 7 dias</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800/20">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] text-gray-500 text-center leading-tight">Acesso imediato</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800/20">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] text-gray-500 text-center leading-tight">Certificado incluso</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {["bg-purple-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500"].map((bg, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-white`}>
                        {["RF", "AS", "MK", "JL"][i]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">+230 alunos ativos</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-xs text-gray-400 ml-1">4.9/5</span>
                </div>
                <p className="text-xs text-gray-500 italic">&quot;Melhor investimento que fiz. O conteúdo é atualizado e prático.&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
