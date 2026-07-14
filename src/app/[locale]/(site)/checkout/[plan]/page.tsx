"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { toast } from "react-hot-toast";
import { getClientAuthHeaders, getClientBearerToken } from "@/lib/client-auth";
import { resolvePlan, TIER_CONFIGS, type SubscriptionPlan } from "@/lib/course-tiers";
import {
  CreditCard,
  FileText,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Wallet,
  RefreshCw,
  Gift,
  Lock,
  Zap,
  Award,
  ArrowRight,
  Timer,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";

// ─── Plan Data ────────────────────────────────────────────────────────────────

type PaidSubscriptionPlan = Exclude<SubscriptionPlan, "free">;

const PLAN_VISUALS: Record<PaidSubscriptionPlan, {
  emoji: string; color: string; gradient: string; badge?: string;
}> = {
  explorador: { emoji: "🧭", color: "emerald", gradient: "from-emerald-500 to-teal-600" },
  profissional: { emoji: "🚀", color: "amber", gradient: "from-amber-500 to-yellow-600", badge: "Mais Popular" },
  expert: { emoji: "👑", color: "amber", gradient: "from-amber-500 to-orange-600" },
};

function checkoutPlan(slug: PaidSubscriptionPlan) {
  const tier = TIER_CONFIGS[slug];
  return {
    name: tier.displayName,
    slug,
    monthlyPrice: tier.monthlyPrice,
    yearlyPrice: tier.yearlyPrice,
    monthlyCredits: tier.monthlyCredits,
    features: [...tier.features],
    ...PLAN_VISUALS[slug],
  };
}

const EXPLORADOR_PLAN = checkoutPlan("explorador");
const PROFISSIONAL_PLAN = checkoutPlan("profissional");
const EXPERT_PLAN = checkoutPlan("expert");

const PLAN_DATA: Record<string, {
  name: string; slug: string; monthlyPrice: number; yearlyPrice: number;
  monthlyCredits: number; emoji: string; color: string; gradient: string;
  features: string[]; badge?: string;
}> = {
  explorador: EXPLORADOR_PLAN,
  profissional: PROFISSIONAL_PLAN,
  expert: EXPERT_PLAN,
  starter: EXPLORADOR_PLAN,
  pro: PROFISSIONAL_PLAN,
  business: EXPERT_PLAN,
};

// ─── 3D-Style Payment Method Icons (Warm, friendly, Apple-inspired) ──────────

function PixIcon3D({ active = false }: { active?: boolean }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
      active
        ? "bg-gradient-to-br from-teal-50 to-emerald-100 shadow-lg shadow-emerald-200/50 ring-2 ring-emerald-400"
        : "bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg"
    }`}>
      <svg className="w-7 h-7" viewBox="0 0 512 512" fill="none">
        <path d="M382.6 352.7c-12.2 0-23.7-4.8-32.4-13.4l-82.1-82.1c-4.8-4.8-13.1-4.9-17.9 0l-82.5 82.5c-8.6 8.6-20.2 13.4-32.4 13.4h-16.8l103.9 103.9c25 25 65.5 25 90.5 0l103.5-103.5-15.6-.1c-.1-.3-.2-.7-.2-.7z" fill="#32BCAD"/>
        <path d="M135.3 159.3c12.2 0 23.7 4.8 32.4 13.4l82.5 82.5c4.9 4.9 13 4.9 17.9 0l82.1-82.1c8.6-8.6 20.2-13.4 32.4-13.4h15.8L294.5 55.4c-25-25-65.5-25-90.5 0L100.5 158.9l17.2.1c6-.1 11.7.1 17.6.3z" fill="#32BCAD"/>
        <path d="M453.3 214.8l-60.3-60.3c1 .3 1.7.3 2.5.3h-13.1c-8.5 0-17 3.5-23.1 9.6l-82.1 82.1c-7.4 7.4-17.1 11.1-26.9 11.1s-19.5-3.7-26.9-11.1l-82.5-82.5c-6.1-6.1-14.5-9.6-23.1-9.6h-20.1l-57 57c-25 25-25 65.5 0 90.5l57.3 57.3h19.4c8.5 0 17-3.5 23.1-9.6l82.5-82.5c14.3-14.3 39.4-14.3 53.7 0l82.1 82.1c6.1 6.1 14.5 9.6 23.1 9.6h13.6l60-60c25-25 25-65.5 0-90.5-.1 0 .8 3.2-2.2 16.5z" fill="#32BCAD"/>
      </svg>
    </div>
  );
}

function CardIcon3D({ active = false }: { active?: boolean }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
      active
        ? "bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg shadow-amber-200/50 ring-2 ring-amber-400"
        : "bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg"
    }`}>
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3" fill={active ? "#6366f1" : "#9ca3af"} opacity="0.15"/>
        <rect x="2" y="5" width="20" height="14" rx="3" stroke={active ? "#6366f1" : "#6b7280"} strokeWidth="1.5"/>
        <rect x="2" y="9" width="20" height="3" fill={active ? "#6366f1" : "#9ca3af"} opacity="0.3"/>
        <rect x="5" y="14" width="4" height="2" rx="0.5" fill={active ? "#6366f1" : "#9ca3af"}/>
        <rect x="11" y="14" width="3" height="2" rx="0.5" fill={active ? "#6366f1" : "#d1d5db"}/>
      </svg>
    </div>
  );
}

function BoletoIcon3D({ active = false }: { active?: boolean }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
      active
        ? "bg-gradient-to-br from-blue-50 to-sky-100 shadow-lg shadow-sky-200/50 ring-2 ring-blue-400"
        : "bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg"
    }`}>
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" fill={active ? "#3b82f6" : "#9ca3af"} opacity="0.1"/>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke={active ? "#3b82f6" : "#6b7280"} strokeWidth="1.5"/>
        <rect x="6" y="7" width="1.5" height="10" rx="0.5" fill={active ? "#3b82f6" : "#9ca3af"}/>
        <rect x="9" y="7" width="1" height="10" rx="0.5" fill={active ? "#3b82f6" : "#9ca3af"}/>
        <rect x="11.5" y="7" width="2" height="10" rx="0.5" fill={active ? "#3b82f6" : "#9ca3af"}/>
        <rect x="15" y="7" width="1" height="10" rx="0.5" fill={active ? "#3b82f6" : "#9ca3af"}/>
        <rect x="17.5" y="7" width="1.5" height="10" rx="0.5" fill={active ? "#3b82f6" : "#9ca3af"}/>
      </svg>
    </div>
  );
}

function MercadoPagoIcon3D({ active = false }: { active?: boolean }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
      active
        ? "bg-gradient-to-br from-[#e8f7fd] to-[#d0effa] shadow-lg shadow-sky-200/50 ring-2 ring-[#00b1ea]"
        : "bg-gradient-to-br from-gray-50 to-gray-100 shadow-md hover:shadow-lg"
    }`}>
      {/* Official MercadoPago "handshake" logo mark */}
      <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
        <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z" fill={active ? "#00b1ea" : "#9ca3af"} opacity={active ? 0.12 : 0.08}/>
        <path d="M33.2 19.5c-1.6-2.8-4.6-4.5-8-4.5-3 0-5.7 1.4-7.4 3.5-.3.4-.1.8.3 1 .4.1.8 0 1-.3 1.4-1.8 3.6-2.9 6.1-2.9 2.8 0 5.2 1.4 6.6 3.6.2.3.6.5 1 .3.3-.2.5-.6.4-.9l-.1-.1c.1.1.1.2.1.3z" fill={active ? "#00b1ea" : "#6b7280"}/>
        <path d="M14.8 28.5c1.6 2.8 4.6 4.5 8 4.5 3 0 5.7-1.4 7.4-3.5.3-.4.1-.8-.3-1-.4-.1-.8 0-1 .3-1.4 1.8-3.6 2.9-6.1 2.9-2.8 0-5.2-1.4-6.6-3.6-.2-.3-.6-.5-1-.3-.3.2-.5.6-.4.9l.1.1c-.1-.1-.1-.2-.1-.3z" fill={active ? "#00b1ea" : "#6b7280"}/>
        <path d="M16 24c0-1.5.4-2.9 1.1-4.1.2-.4.1-.8-.3-1-.4-.2-.8-.1-1 .3-.9 1.5-1.3 3.1-1.3 4.8 0 1.7.5 3.3 1.3 4.8.2.4.6.5 1 .3.4-.2.5-.6.3-1C16.4 26.9 16 25.5 16 24z" fill={active ? "#009ee3" : "#9ca3af"}/>
        <path d="M32 24c0 1.5-.4 2.9-1.1 4.1-.2.4-.1.8.3 1 .4.2.8.1 1-.3.9-1.5 1.3-3.1 1.3-4.8 0-1.7-.5-3.3-1.3-4.8-.2-.4-.6-.5-1-.3-.4.2-.5.6-.3 1 .7 1.2 1.1 2.6 1.1 4.1z" fill={active ? "#009ee3" : "#9ca3af"}/>
        <circle cx="24" cy="24" r="3.5" fill={active ? "#00b1ea" : "#9ca3af"}/>
      </svg>
    </div>
  );
}

// ─── Inline Brand Logos (no external CDN — always renders) ───────────────────

function VisaLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 30" fill="none">
      <rect width="48" height="30" rx="4" fill="#1A1F71"/>
      <path d="M19.5 20.5l2.2-11.5h3.5l-2.2 11.5h-3.5z" fill="#fff"/>
      <path d="M32.2 9.3c-.7-.3-1.8-.5-3.1-.5-3.5 0-5.9 1.7-5.9 4.2 0 1.8 1.7 2.9 3.1 3.5 1.4.6 1.8 1 1.8 1.6 0 .9-1.1 1.3-2.1 1.3-1.4 0-2.1-.2-3.3-.7l-.5-.2-.5 2.9c.8.4 2.3.7 3.9.7 3.7 0 6.1-1.7 6.1-4.4 0-1.5-.9-2.6-2.9-3.5-1.2-.6-2-1-2-1.6s.6-1.1 2-1.1c1.2 0 2 .2 2.6.5l.3.1.5-2.8z" fill="#fff"/>
      <path d="M37.5 9h-2.7c-.8 0-1.5.2-1.8 1.1l-5.2 11.4h3.7s.6-1.5.7-1.9h4.5c.1.4.4 1.9.4 1.9h3.3L37.5 9zm-4 8.3c.3-.7 1.4-3.6 1.4-3.6l.5-1.2.2 1.1s.7 3.1.8 3.7h-2.9z" fill="#fff"/>
      <path d="M17.6 9l-3.4 8.8-.4-1.8c-.6-2.1-2.6-4.3-4.8-5.4l3.1 10.9h3.7l5.5-12.5h-3.7z" fill="#fff"/>
      <path d="M11.9 9H6.1l-.1.2c4.4 1.1 7.3 3.6 8.5 6.7l-1.2-5.9c-.2-.8-.8-1-.8-1l.4.1-.1-.1z" fill="#EC982D"/>
    </svg>
  );
}

function MastercardLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 30" fill="none">
      <rect width="48" height="30" rx="4" fill="#252525"/>
      <circle cx="19" cy="15" r="9" fill="#EB001B"/>
      <circle cx="29" cy="15" r="9" fill="#F79E1B"/>
      <path d="M24 8.1A8.96 8.96 0 0 0 20.1 15c0 2.8 1.3 5.4 3.3 6.9a8.96 8.96 0 0 0 3.3-6.9c0-2.8-1.3-5.4-3.3-6.9h.6z" fill="#FF5F00"/>
    </svg>
  );
}

function EloLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 30" fill="none">
      <rect width="48" height="30" rx="4" fill="#000"/>
      <text x="24" y="20" textAnchor="middle" fill="#FFCB05" fontSize="14" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">elo</text>
    </svg>
  );
}

function AmexLogo({ className = "h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 30" fill="none">
      <rect width="48" height="30" rx="4" fill="#006FCF"/>
      <text x="24" y="19" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">AMEX</text>
    </svg>
  );
}

function MercadoPagoLogo({ className = "h-5", muted = false }: { className?: string; muted?: boolean }) {
  // Official MercadoPago wordmark — the recognizable light-blue "mercadopago" text
  const color = muted ? "#94a3b8" : "#00b1ea";
  return (
    <svg className={className} viewBox="0 0 180 28" fill="none">
      <path d="M15.4 7.3c-2.3 0-4.2.8-5.5 2.3C8.8 8.1 7 7.3 4.9 7.3 2 7.3 0 9.5 0 12.8v8.5h3.5v-8.1c0-1.7.9-2.7 2.2-2.7 1.3 0 2.1 1 2.1 2.7v8.1h3.5v-8.1c0-1.7.9-2.7 2.2-2.7 1.3 0 2.1 1 2.1 2.7v8.1h3.5v-8.5c0-3.3-2-5.5-3.7-5.5z" fill={color}/>
      <path d="M27 17.6c-1.5 0-2.5-1.2-2.5-3.1 0-1.9 1-3.1 2.5-3.1 1.2 0 2 .7 2.3 1.8h3.5c-.4-2.9-2.6-4.9-5.8-4.9-3.6 0-6.1 2.5-6.1 6.2 0 3.7 2.5 6.2 6.1 6.2 3.2 0 5.4-2 5.8-4.9h-3.5c-.3 1.1-1.1 1.8-2.3 1.8z" fill={color}/>
      <path d="M39.5 7.3c-3.6 0-6.2 2.5-6.2 6.2 0 3.7 2.5 6.2 6.3 6.2 2.8 0 4.8-1.3 5.6-3.5h-3.7c-.4.6-1.1 1-2 1-1.3 0-2.3-.7-2.6-2.1h8.6c.1-.5.1-1 .1-1.5 0-3.8-2.4-6.3-6.1-6.3zm-2.6 4.9c.3-1.3 1.2-2 2.5-2s2.2.7 2.5 2h-5z" fill={color}/>
      <path d="M50 7.3c-1.6 0-2.8.6-3.5 1.7V7.5h-3.4v13.8h3.5V13c0-1.6.9-2.6 2.2-2.6.5 0 1 .1 1.4.3l.7-3.2c-.3-.1-.6-.2-.9-.2z" fill={color}/>
      <path d="M56.8 17.6c-1.5 0-2.5-1.2-2.5-3.1 0-1.9 1-3.1 2.5-3.1 1.2 0 2 .7 2.3 1.8h3.5c-.4-2.9-2.6-4.9-5.8-4.9-3.6 0-6.1 2.5-6.1 6.2 0 3.7 2.5 6.2 6.1 6.2 3.2 0 5.4-2 5.8-4.9h-3.5c-.3 1.1-1.1 1.8-2.3 1.8z" fill={color}/>
      <path d="M69 7.3c-1.5 0-2.7.6-3.4 1.7V7.5h-3.4v13.8h3.5v-7.9c0-1.5.9-2.6 2.2-2.6 1.3 0 2.1 1 2.1 2.6v7.9h3.5v-8.6c0-3.2-1.9-5.4-4.5-5.4z" fill={color}/>
      <path d="M81.3 7.3c-3.7 0-6.2 2.5-6.2 6.2 0 3.7 2.5 6.2 6.2 6.2s6.2-2.5 6.2-6.2c0-3.7-2.5-6.2-6.2-6.2zm0 9.3c-1.5 0-2.6-1.2-2.6-3.1 0-1.9 1.1-3.1 2.6-3.1 1.5 0 2.6 1.2 2.6 3.1 0 1.9-1.1 3.1-2.6 3.1z" fill={color}/>
    </svg>
  );
}

function AsaasLogo({ className = "h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 28" fill="none">
      <text x="0" y="21" fill="#94a3b8" fontSize="20" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.5">ASAAS</text>
    </svg>
  );
}

function CardBrandStrip() {
  return (
    <div className="flex items-center justify-center gap-4 mb-6 py-3 px-5 bg-gray-50/80 rounded-xl border border-gray-100">
      <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Aceitamos</span>
      <div className="flex items-center gap-2">
        <VisaLogo className="h-7 w-auto rounded" />
        <MastercardLogo className="h-7 w-auto rounded" />
        <EloLogo className="h-7 w-11 rounded" />
        <AmexLogo className="h-7 w-11 rounded" />
      </div>
    </div>
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
  subscriptionId?: string;
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
  const cartItems = useMemo(() => Object.values(items), [items]);
  const activePurchaseDiscount = user?.subscription?.status === "active"
    ? TIER_CONFIGS[resolvePlan(user.subscription.plan)].purchaseDiscount
    : 0;
  const courseDiscountAmount = useMemo(() => Math.round(cartItems.reduce(
    (sum, item) => item.type === "course"
      ? sum + item.price * item.quantity * activePurchaseDiscount
      : sum,
    0,
  ) * 100) / 100, [cartItems, activePurchaseDiscount]);

  const total = useMemo(() => {
    if (isCartCheckout) return Math.round((cartTotal - courseDiscountAmount) * 100) / 100;
    if (planInfo) {
      return subscriptionCycle === "yearly" ? planInfo.yearlyPrice : planInfo.monthlyPrice;
    }
    return 0;
  }, [isCartCheckout, cartTotal, courseDiscountAmount, planInfo, subscriptionCycle]);

  const isFreeCourseCheckout = isCartCheckout && cartItems.length > 0 && !isSubscription && total <= 0
    && cartItems.every((item) => item.type === "course" && Boolean(item.slug));

  const effectiveTotal = isFreeCourseCheckout ? 0 : total;

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
      const statusUrl = paymentResult.subscriptionId
        ? `/api/subscriptions/${paymentResult.subscriptionId}`
        : `/api/payments/${paymentResult.paymentId}`;
      const res = await fetch(statusUrl, { headers: getClientAuthHeaders(), credentials: "include" });
      const data = await res.json();
      const paid = paymentResult.subscriptionId
        ? data.subscription?.status === "active"
        : data.payment?.status === "paid";
      if (paid) {
        toast.success("Pagamento confirmado!");
        clearCart();
        router.push(`/pt-BR/checkout/success?order=${paymentResult.orderNumber}`);
      }
    } catch (e) { console.error("Error checking status:", e); }
    finally { setCheckingStatus(false); }
  }, [paymentResult, clearCart, router]);

  useEffect(() => {
    if (paymentResult?.method === "pix" && paymentResult.status === "pending") {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentResult, checkPaymentStatus]);

  const handlePayment = async () => {
    if (!name || !email) { toast.error("Preencha nome e email."); return; }
    if (!isFreeCourseCheckout && (!cpfCnpj || cpfCnpj.replace(/\D/g, "").length < 11)) { toast.error("Informe CPF ou CNPJ válido."); return; }
    if (isCartCheckout && cartItems.length === 0) { toast.error("Carrinho vazio."); return; }
    if (!isFreeCourseCheckout && selectedMethod === "credit_card" && !selectedCard) {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) { toast.error("Preencha os dados do cartão."); return; }
      if (!postalCode || !addressNumber) { toast.error("Informe CEP e número."); return; }
    }
    if (selectedMethod === "mercadopago" && !isFreeCourseCheckout && !cpfCnpj) {
      // CPF is optional for MP redirect
    }

    setLoading(true);
    try {
      const token = getClientBearerToken();
      if (!isLoggedIn && !token) { toast.error("Faça login para continuar."); router.push("/pt-BR/login"); return; }

      // Send identifiers and the displayed price snapshot. The server resolves
      // the actual name, availability and charge amount from its own catalog.
      const orderItems = isCartCheckout
        ? cartItems.map(item => ({
            id: item.id,
            slug: item.slug,
            type: item.id.startsWith("store-") ? "product" : item.type,
            quantity: item.quantity,
            serviceSlug: item.serviceSlug,
            unitLabel: item.unitLabel,
            track: item.track,
            expectedUnitPrice: item.price,
          }))
        : [{ id: planInfo?.slug || planName, slug: planInfo?.slug || planName, type: "subscription", quantity: 1, expectedUnitPrice: total }];

      // MercadoPago redirect flow
      if (selectedMethod === "mercadopago" && !isFreeCourseCheckout) {
        const mpRes = await fetch("/api/payments/mercadopago-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
          credentials: "include",
          body: JSON.stringify({
            items: isCartCheckout ? orderItems : undefined,
            planSlug: planInfo?.slug || planName,
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

  // ─── Shared Input Style ─────────────────────────────────────────────

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all disabled:bg-gray-50 disabled:text-muted-foreground";
  const labelClass = "block text-sm font-medium text-gray-600 mb-1.5";

  // ─── Payment Result Screen (Light Theme) ────────────────────────────

  if (paymentResult && !paymentResult.isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            {/* Status Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-100/50">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Aguardando Pagamento</h1>
              <p className="text-muted-foreground">Pedido #{paymentResult.orderNumber}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-100/50 p-8">
              {/* PIX */}
              {paymentResult.method === "pix" && paymentResult.pixData && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <PixIcon3D active />
                    <span className="font-semibold text-sm">Pague com PIX</span>
                  </div>

                  <div className="bg-white p-6 rounded-2xl inline-block mx-auto shadow-lg border border-gray-100">
                    <Image src={`data:image/png;base64,${paymentResult.pixData.qrCodeBase64}`} alt="PIX QR Code" width={220} height={220} className="mx-auto" />
                  </div>

                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(paymentResult.total)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">PIX Copia e Cola:</p>
                    <div className="flex gap-2">
                      <input readOnly value={paymentResult.pixData.qrCodePayload} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 text-sm truncate" />
                      <Button onClick={() => copyToClipboard(paymentResult.pixData!.qrCodePayload)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 shadow-md">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    {checkingStatus ? (
                      <><Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Verificando pagamento...</>
                    ) : (
                      <><Timer className="w-4 h-4 text-emerald-600" /> Confirmação automática em segundos</>
                    )}
                  </div>
                </div>
              )}

              {/* Boleto */}
              {paymentResult.method === "boleto" && paymentResult.boletoData && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold text-sm">Boleto Bancário</span>
                  </div>

                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(paymentResult.total)}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Linha Digitável:</p>
                    <div className="flex gap-2">
                      <input readOnly value={paymentResult.boletoData.digitableLine} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 text-sm font-mono" />
                      <Button onClick={() => copyToClipboard(paymentResult.boletoData!.digitableLine)} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 shadow-md">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">Vencimento: {new Date(paymentResult.boletoData.dueDate).toLocaleDateString("pt-BR")}</p>

                  <Button onClick={() => window.open(paymentResult.boletoData?.bankSlipUrl, "_blank")} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 shadow-md">
                    <FileText className="w-4 h-4 mr-2" /> Abrir Boleto PDF
                  </Button>
                </div>
              )}

              <div className="h-px bg-gray-100 my-6" />
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl" onClick={() => setPaymentResult(null)}>Voltar</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md" onClick={() => router.push("/pt-BR/portal")}>Meu Portal</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── Main Checkout (Light, Clean, PostHog/Apple-Inspired) ──────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* ── Checkout Header ─────────────────────────────────────── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-4">
              <Lock className="w-3.5 h-3.5" />
              Checkout seguro com criptografia SSL 256-bit
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {isFreeCourseCheckout ? "Liberar Acesso Gratuito" : "Finalizar Compra"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isCartCheckout ? "Revise seus itens e finalize com segurança." : `Plano ${planInfo?.name || planName} — comece a aprender hoje.`}
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* ─── Left Column: Forms ─────────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Subscription Cycle Toggle */}
              {isSubscription && planInfo && (
                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-indigo-500" />
                    Ciclo de Cobrança
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setSubscriptionCycle("monthly")}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        subscriptionCycle === "monthly" ? "border-indigo-500 bg-indigo-50/50 shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                      {subscriptionCycle === "monthly" && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /></div>}
                      <span className="text-lg font-bold text-gray-900 block">{formatCurrency(planInfo.monthlyPrice)}</span>
                      <span className="text-sm text-muted-foreground">por mês</span>
                    </button>
                    <button type="button" onClick={() => setSubscriptionCycle("yearly")}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        subscriptionCycle === "yearly" ? "border-emerald-500 bg-emerald-50/50 shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                      {subscriptionCycle === "yearly" && <div className="absolute top-3 right-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>}
                      <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">Economize 17%</div>
                      <span className="text-lg font-bold text-gray-900 block">{formatCurrency(planInfo.yearlyPrice)}</span>
                      <span className="text-sm text-muted-foreground">por ano ({formatCurrency(planInfo.yearlyPrice / 12)}/mês)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Personal Info */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  </div>
                  Seus Dados
                </h3>
                <p className="text-sm text-muted-foreground mb-5">Informações protegidas e não compartilhadas.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nome completo *</label>
                    <input className={inputClass} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoggedIn} />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input className={inputClass} placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoggedIn} />
                  </div>
                  <div>
                    <label className={labelClass}>{isFreeCourseCheckout ? "CPF ou CNPJ" : "CPF ou CNPJ *"}</label>
                    <input className={inputClass} placeholder={isFreeCourseCheckout ? "Opcional" : "000.000.000-00"} value={cpfCnpj} onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))} maxLength={18} />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp</label>
                    <input className={inputClass} placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} maxLength={15} />
                  </div>
                </div>
                {isLoggedIn && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5 mt-4 font-medium"><BadgeCheck className="w-4 h-4" /> Logado como {user?.name}</p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {isFreeCourseCheckout ? "Liberação do Acesso" : "Forma de Pagamento"}
                </h3>
                {!isFreeCourseCheckout && <p className="text-sm text-muted-foreground mb-5">Escolha como prefere pagar.</p>}

                {isFreeCourseCheckout ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><Gift className="h-5 w-5" /></div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">Curso grátis do mês com certificado incluso</p>
                        <p className="mt-1 text-sm text-muted-foreground">Sem pagamento. Ao confirmar, o curso é liberado imediatamente.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 3D Payment Method Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {/* PIX */}
                      <button type="button" onClick={() => setSelectedMethod("pix")}
                        className={`group relative p-4 rounded-2xl border-2 transition-all text-center ${
                          selectedMethod === "pix" ? "border-emerald-400 bg-emerald-50/30 shadow-md" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                        }`}>
                        {selectedMethod === "pix" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm"><Check className="w-3 h-3 text-white" /></div>}
                        <div className="flex justify-center mb-2">
                          <PixIcon3D active={selectedMethod === "pix"} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 block">PIX</span>
                        <span className="text-xs text-emerald-600 font-medium">Aprovação imediata</span>
                      </button>

                      {/* Boleto */}
                      <button type="button" onClick={() => setSelectedMethod("boleto")}
                        className={`group relative p-4 rounded-2xl border-2 transition-all text-center ${
                          selectedMethod === "boleto" ? "border-blue-400 bg-blue-50/30 shadow-md" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                        }`}>
                        {selectedMethod === "boleto" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm"><Check className="w-3 h-3 text-white" /></div>}
                        <div className="flex justify-center mb-2">
                          <BoletoIcon3D active={selectedMethod === "boleto"} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 block">Boleto</span>
                        <span className="text-xs text-blue-600 font-medium">Vencimento claro</span>
                      </button>

                      {/* Credit Card */}
                      <button type="button" onClick={() => setSelectedMethod("credit_card")}
                        className={`group relative p-4 rounded-2xl border-2 transition-all text-center ${
                          selectedMethod === "credit_card" ? "border-indigo-400 bg-indigo-50/30 shadow-md" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                        }`}>
                        {selectedMethod === "credit_card" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm"><Check className="w-3 h-3 text-white" /></div>}
                        <div className="flex justify-center mb-2">
                          <CardIcon3D active={selectedMethod === "credit_card"} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 block">Cartão</span>
                        <span className="text-xs text-indigo-600 font-medium">Até 12x sem juros</span>
                      </button>

                      {/* MercadoPago */}
                      <button type="button" onClick={() => setSelectedMethod("mercadopago")}
                        className={`group relative p-4 rounded-2xl border-2 transition-all text-center ${
                          selectedMethod === "mercadopago" ? "border-cyan-400 bg-cyan-50/30 shadow-md" : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                        }`}>
                        {selectedMethod === "mercadopago" && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-sm"><Check className="w-3 h-3 text-white" /></div>}
                        <div className="flex justify-center mb-2">
                          <MercadoPagoIcon3D active={selectedMethod === "mercadopago"} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 block">MercadoPago</span>
                        <span className="text-xs text-cyan-600 font-medium">Checkout seguro</span>
                      </button>
                    </div>

                    {/* Card Brands Strip */}
                    <CardBrandStrip />

                    {/* MercadoPago Info */}
                    {selectedMethod === "mercadopago" && (
                      <div className="rounded-xl border border-[#00b1ea]/20 bg-gradient-to-r from-[#00b1ea]/5 to-[#009ee3]/5 p-4 mb-4">
                        <div className="flex flex-col gap-2">
                          <MercadoPagoLogo className="h-5" />
                          <p className="text-xs text-muted-foreground">
                            Você será redirecionado para o ambiente seguro do MercadoPago para completar o pagamento com PIX, cartão de crédito, débito ou boleto.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Credit Card Form */}
                    {selectedMethod === "credit_card" && (
                      <div className="space-y-4 pt-5 border-t border-gray-100">
                        {/* Saved Cards */}
                        {savedCards.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2"><Wallet className="w-4 h-4 inline mr-1.5 text-indigo-500" /> Cartões Salvos</label>
                            <div className="space-y-2">
                              {savedCards.map((card) => (
                                <button key={card.id} type="button" onClick={() => { setSelectedCard(selectedCard === card.id ? null : card.id); if (selectedCard !== card.id) { setCardNumber(""); setCardHolder(""); setCardExpiry(""); setCardCvv(""); } }}
                                  className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${selectedCard === card.id ? "border-indigo-400 bg-indigo-50/50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
                                  <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                                    <span className="font-mono text-gray-900">•••• {card.lastFour}</span>
                                    <span className="text-xs text-muted-foreground capitalize">{card.brand}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{card.expiryMonth}/{card.expiryYear}</span>
                                </button>
                              ))}
                              <button type="button" onClick={() => setSelectedCard(null)}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-center ${!selectedCard ? "border-indigo-400 bg-indigo-50/50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
                                <CreditCard className="w-4 h-4 inline mr-2 text-muted-foreground" /> <span className="text-gray-700">Usar outro cartão</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* New Card Form */}
                        {!selectedCard && (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className={labelClass}>Número do Cartão *</label>
                              <input className={`${inputClass} font-mono`} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={(e) => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} />
                            </div>
                            <div className="md:col-span-2">
                              <label className={labelClass}>Nome no Cartão *</label>
                              <input className={`${inputClass} uppercase`} placeholder="NOME COMO ESTÁ NO CARTÃO" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} />
                            </div>
                            <div>
                              <label className={labelClass}>Validade *</label>
                              <input className={`${inputClass} font-mono`} placeholder="MM/AA" value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
                            </div>
                            <div>
                              <label className={labelClass}>CVV *</label>
                              <input type="password" className={`${inputClass} font-mono`} placeholder="•••" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))} maxLength={4} />
                            </div>
                            <div>
                              <label className={labelClass}>CEP *</label>
                              <input className={inputClass} placeholder="00000-000" value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2"))} maxLength={9} />
                            </div>
                            <div>
                              <label className={labelClass}>Número *</label>
                              <input className={inputClass} placeholder="123" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} />
                            </div>
                            <div className="md:col-span-2">
                              <label className={labelClass}>Parcelas</label>
                              <select className={inputClass} value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))}>
                                {installmentOptions.map((opt) => <option key={opt.count} value={opt.count}>{opt.label}</option>)}
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500" />
                                <span className="text-sm text-gray-600">Salvar cartão para compras futuras</span>
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

            {/* ─── Right Column — Order Summary ────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/50 p-6 sticky top-24">

                {/* Plan Summary Header */}
                {planInfo && !isCartCheckout && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{planInfo.emoji}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Plano {planInfo.name}</h3>
                        {planInfo.badge && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-medium">{planInfo.badge}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {planInfo.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cart Items */}
                {isCartCheckout && cartItems.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Seu Pedido</h3>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start py-2">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.type === "course" ? "Curso" : "Serviço"} x {item.quantity}</p>
                        </div>
                        <span className="font-semibold text-sm text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="h-px bg-gray-100 mb-4" />

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-gray-700">{formatCurrency(isCartCheckout ? cartTotal : total)}</span>
                  </div>
                  {isCartCheckout && courseDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm text-emerald-600">
                      <span>Benefício do plano ({Math.round(activePurchaseDiscount * 100)}%)</span>
                      <span>-{formatCurrency(courseDiscountAmount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(effectiveTotal)}
                    </span>
                  </div>
                  {!isFreeCourseCheckout && selectedMethod === "credit_card" && installments > 1 && (
                    <p className="text-sm text-muted-foreground text-center">ou {installments}x de {formatCurrency(total / installments)} sem juros</p>
                  )}
                  {isSubscription && subscriptionCycle === "yearly" && planInfo && (
                    <div className="text-center">
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
                        Economia de {formatCurrency(planInfo.monthlyPrice * 12 - planInfo.yearlyPrice)}/ano
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full py-6 text-base font-bold rounded-xl transition-all shadow-lg cursor-pointer ${
                    isFreeCourseCheckout
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/40"
                      : "bg-card hover:bg-secondary text-white shadow-gray-300/30"
                  }`}
                  onClick={handlePayment}
                  disabled={loading || (isCartCheckout && cartItems.length === 0)}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {isFreeCourseCheckout ? "Liberando..." : selectedMethod === "mercadopago" ? "Redirecionando..." : "Processando..."}</>
                  ) : isFreeCourseCheckout ? (
                    <><Gift className="w-5 h-5 mr-2" /> Liberar Acesso Grátis</>
                  ) : selectedMethod === "mercadopago" ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-5 h-5 shrink-0" />
                      <span className="truncate">Pagar {formatCurrency(effectiveTotal)}</span>
                    </span>
                  ) : (
                    <><Lock className="w-5 h-5 mr-2" /> Pagar {formatCurrency(effectiveTotal)}</>
                  )}
                </Button>
                {selectedMethod === "mercadopago" && !isFreeCourseCheckout && (
                  <p className="text-xs text-center text-muted-foreground mt-1.5">via MercadoPago — ambiente seguro</p>
                )}

                {/* Trust & Security Section */}
                <div className="mt-6 space-y-4">
                  {/* Security line */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    Pagamento 100% seguro — dados criptografados
                  </div>

                  {/* Trust badges */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-[11px] text-muted-foreground text-center leading-tight font-medium">Garantia 7 dias</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-[11px] text-muted-foreground text-center leading-tight font-medium">Acesso imediato</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Award className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-[11px] text-muted-foreground text-center leading-tight font-medium">Certificado incluso</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust & Processing Partners */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Processado com segurança por</p>
                <div className="flex items-center gap-5 mb-4">
                  <AsaasLogo className="h-5" />
                  <MercadoPagoLogo className="h-4" muted />
                </div>
                <div className="h-px bg-gray-100 mb-3" />
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Dados protegidos com criptografia de ponta a ponta</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Não armazenamos dados do seu cartão</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Cancele quando quiser, sem burocracia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
