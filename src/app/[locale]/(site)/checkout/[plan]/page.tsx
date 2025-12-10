"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import Image from "next/image";

type PaymentMethod = "pix" | "boleto" | "credit_card" | "undefined";

interface SavedCard {
  id: string;
  lastFour: string;
  brand: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

interface PaymentResult {
  success: boolean;
  orderNumber: string;
  paymentId: string;
  status: string;
  method: PaymentMethod;
  total: number;
  paymentUrl?: string;
  pixData?: {
    qrCodeBase64: string;
    qrCodePayload: string;
    expirationDate: string;
  };
  boletoData?: {
    barCode: string;
    digitableLine: string;
    bankSlipUrl: string;
    dueDate: string;
  };
  isPaid?: boolean;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const planName = params.plan as string;
  
  const { user, isLoggedIn } = useUser();
  const { items, cartTotal, clearCart } = useServiceCart();
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  
  // Credit card state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);
  
  // Address state (for credit card)
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("pix");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  
  // Subscription mode
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionCycle, setSubscriptionCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    if (isLoggedIn && user) {
      setName(user.name);
      setEmail(user.email);
      
      // Autofill billing info if available
      if (user.billing) {
        if (user.billing.phone) setPhone(user.billing.phone);
        if (user.billing.cpfCnpj) setCpfCnpj(formatCpfCnpj(user.billing.cpfCnpj));
        if (user.billing.postalCode) setPostalCode(user.billing.postalCode);
        if (user.billing.addressNumber) setAddressNumber(user.billing.addressNumber);
      }
      
      // Fetch saved cards
      fetchSavedCards();
    }
  }, [isLoggedIn, user]);
  
  // Check if this is a subscription plan checkout
  useEffect(() => {
    const subscriptionPlans = ["starter", "pro", "business"];
    if (subscriptionPlans.includes(planName)) {
      setIsSubscription(true);
    }
    
    // Also check if cart contains subscription items
    if (planName === "cart") {
      const cartItemsArray = Object.values(items);
      const hasSubscription = cartItemsArray.some(item => 
        subscriptionPlans.includes(item.id)
      );
      if (hasSubscription) {
        setIsSubscription(true);
      }
    }
  }, [planName, items]);

  // Fetch saved cards
  const fetchSavedCards = async () => {
    setLoadingCards(true);
    try {
      const token = localStorage.getItem("fayapoint_token");
      if (!token) return;
      
      const response = await fetch("/api/user/saved-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSavedCards(data.cards || []);
        
        // Auto-select default card if available
        const defaultCard = data.cards?.find((c: SavedCard) => c.isDefault);
        if (defaultCard) {
          setSelectedCard(defaultCard.id);
          setSelectedMethod("credit_card");
        }
      }
    } catch (error) {
      console.error("Error fetching saved cards:", error);
    } finally {
      setLoadingCards(false);
    }
  };

  // Format CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  // Format phone
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  // Format expiry
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length >= 2) {
      return digits.slice(0, 2) + "/" + digits.slice(2, 4);
    }
    return digits;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!paymentResult?.paymentId) return;
    
    setCheckingStatus(true);
    try {
      const token = localStorage.getItem("fayapoint_token");
      const response = await fetch(`/api/payments/${paymentResult.paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.payment?.status === "paid") {
        toast.success("Pagamento confirmado! 🎉");
        clearCart();
        router.push(`/pt-BR/checkout/success?order=${paymentResult.orderNumber}`);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setCheckingStatus(false);
    }
  }, [paymentResult, clearCart, router]);

  // Auto-check PIX payment status
  useEffect(() => {
    if (paymentResult?.method === "pix" && paymentResult.status === "pending") {
      const interval = setInterval(checkPaymentStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [paymentResult, checkPaymentStatus]);

  const handlePayment = async () => {
    // Validation
    if (!name || !email) {
      toast.error("Por favor, preencha nome e email.");
      return;
    }

    if (!cpfCnpj || cpfCnpj.replace(/\D/g, "").length < 11) {
      toast.error("Por favor, informe um CPF ou CNPJ válido.");
      return;
    }

    if (isCartCheckout && cartItems.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    if (selectedMethod === "credit_card") {
      // If using saved card, don't require card details
      if (!selectedCard) {
        if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
          toast.error("Preencha todos os dados do cartão.");
          return;
        }
        if (!postalCode || !addressNumber) {
          toast.error("Informe CEP e número do endereço para pagamento com cartão.");
          return;
        }
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("fayapoint_token");
      
      if (!token) {
        toast.error("Você precisa estar logado para finalizar a compra.");
        router.push("/pt-BR/login");
        return;
      }

      // Prepare order items
      const orderItems = cartItems.map(item => ({
        id: item.id,
        slug: item.id,
        type: item.id.startsWith("store-") ? "product" : item.type,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      // Build request body
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestBody: any = {
        items: orderItems,
        method: selectedMethod,
        cpfCnpj: cpfCnpj.replace(/\D/g, ""),
        phone: phone.replace(/\D/g, ""),
      };

      // Add credit card data if applicable
      if (selectedMethod === "credit_card") {
        // Check if using saved card
        if (selectedCard) {
          const card = savedCards.find(c => c.id === selectedCard);
          if (card) {
            requestBody.savedCardId = selectedCard;
          }
        } else {
          const [expMonth, expYear] = cardExpiry.split("/");
          requestBody.creditCard = {
            holderName: cardHolder,
            number: cardNumber.replace(/\D/g, ""),
            expiryMonth: expMonth,
            expiryYear: "20" + expYear,
            ccv: cardCvv,
          };
          requestBody.address = {
            postalCode: postalCode.replace(/\D/g, ""),
            number: addressNumber,
          };
          requestBody.saveCard = saveCard;
        }
        requestBody.installments = installments;
      }

      // Handle subscription checkout
      if (isSubscription) {
        requestBody.isSubscription = true;
        requestBody.subscriptionCycle = subscriptionCycle;
        
        // Get plan slug - either from URL or from cart item
        let subscriptionPlanSlug = planName;
        if (planName === "cart") {
          // Find subscription plan in cart
          const subscriptionPlans = ["starter", "pro", "business"];
          const subItem = cartItems.find(item => subscriptionPlans.includes(item.id));
          if (subItem) {
            subscriptionPlanSlug = subItem.id;
          }
        }
        requestBody.planSlug = subscriptionPlanSlug;
        requestBody.cycle = subscriptionCycle;
        requestBody.billingType = selectedMethod === "credit_card" ? "credit_card" : selectedMethod;
      }

      // Create payment via API
      const apiEndpoint = isSubscription ? "/api/subscriptions" : "/api/payments";
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      // Set payment result
      setPaymentResult(data as PaymentResult);

      // If paid immediately (credit card), redirect
      if (data.isPaid) {
        toast.success("Pagamento aprovado! 🎉");
        clearCart();
        router.push(`/pt-BR/checkout/success?order=${data.orderNumber}`);
      } else {
        toast.success("Cobrança criada! Complete o pagamento.");
      }

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const cartItems = Object.values(items);
  const isCartCheckout = planName === "cart";
  const total = cartTotal;

  // Calculate installment options
  const installmentOptions = [];
  for (let i = 1; i <= 12; i++) {
    const value = total / i;
    if (value >= 5) { // Minimum R$5 per installment
      installmentOptions.push({
        count: i,
        value,
        label: i === 1 
          ? `À vista - ${formatCurrency(total)}`
          : `${i}x de ${formatCurrency(value)} sem juros`,
      });
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(value);
  }

  // If we have a payment result, show the payment screen
  if (paymentResult && !paymentResult.isPaid) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Aguardando Pagamento</h1>
              <p className="text-gray-400">
                Pedido #{paymentResult.orderNumber}
              </p>
            </div>

            <Card className="p-6 bg-gray-900/50 border-gray-800">
              {/* PIX Payment */}
              {paymentResult.method === "pix" && paymentResult.pixData && (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <QrCode className="w-5 h-5" />
                    <span className="font-semibold">Pague com PIX</span>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                    <Image
                      src={`data:image/png;base64,${paymentResult.pixData.qrCodeBase64}`}
                      alt="PIX QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>

                  <div className="text-2xl font-bold text-purple-400">
                    {formatCurrency(paymentResult.total)}
                  </div>

                  {/* Pix Copia e Cola */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">PIX Copia e Cola:</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={paymentResult.pixData.qrCodePayload}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm truncate"
                      />
                      <Button
                        onClick={() => copyToClipboard(paymentResult.pixData!.qrCodePayload)}
                        variant="outline"
                        className="border-gray-700"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    {checkingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando pagamento...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        O pagamento será confirmado automaticamente
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Boleto Payment */}
              {paymentResult.method === "boleto" && paymentResult.boletoData && (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">Boleto Bancário</span>
                  </div>

                  <div className="text-2xl font-bold text-purple-400">
                    {formatCurrency(paymentResult.total)}
                  </div>

                  {/* Linha Digitável */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Linha Digitável:</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={paymentResult.boletoData.digitableLine}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded p-3 text-white text-sm font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(paymentResult.boletoData!.digitableLine)}
                        variant="outline"
                        className="border-gray-700"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400">
                    Vencimento: {new Date(paymentResult.boletoData.dueDate).toLocaleDateString("pt-BR")}
                  </p>

                  <Button
                    onClick={() => window.open(paymentResult.boletoData?.bankSlipUrl, "_blank")}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Abrir Boleto PDF
                  </Button>
                </div>
              )}

              <Separator className="my-6 bg-gray-800" />

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-700"
                  onClick={() => setPaymentResult(null)}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={() => router.push("/pt-BR/portal?tab=carrinho")}
                >
                  Meus Pedidos
                </Button>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-gray-400 mb-8">
            {isCartCheckout 
              ? "Revise seus itens e finalize seu pedido." 
              : `Finalize sua assinatura do plano ${planName}.`}
          </p>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-3 space-y-6">
              {/* Personal Info */}
              <Card className="p-6 bg-gray-900/50 border-gray-800">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  Seus Dados
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Nome completo *</label>
                    <input 
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition disabled:opacity-50" 
                      placeholder="Nome completo" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoggedIn}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email *</label>
                    <input 
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition disabled:opacity-50" 
                      placeholder="email@exemplo.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoggedIn}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">CPF ou CNPJ *</label>
                    <input 
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition" 
                      placeholder="000.000.000-00" 
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                      maxLength={18}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Telefone/WhatsApp</label>
                    <input 
                      className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition" 
                      placeholder="(11) 99999-9999" 
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      maxLength={15}
                    />
                  </div>
                </div>

                {isLoggedIn && (
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-4">
                    <CheckCircle2 className="w-3 h-3" />
                    Logado como {user?.name}
                  </p>
                )}
              </Card>

              {/* Payment Method Selection */}
              <Card className="p-6 bg-gray-900/50 border-gray-800">
                <h3 className="text-xl font-semibold mb-4">Forma de Pagamento</h3>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("pix")}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedMethod === "pix"
                        ? "border-green-500 bg-green-500/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <QrCode className={`w-8 h-8 mx-auto mb-2 ${
                      selectedMethod === "pix" ? "text-green-400" : "text-gray-400"
                    }`} />
                    <span className="text-sm font-medium">PIX</span>
                    <p className="text-xs text-gray-500 mt-1">Aprovação imediata</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("boleto")}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedMethod === "boleto"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${
                      selectedMethod === "boleto" ? "text-blue-400" : "text-gray-400"
                    }`} />
                    <span className="text-sm font-medium">Boleto</span>
                    <p className="text-xs text-gray-500 mt-1">Até 3 dias úteis</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("credit_card")}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      selectedMethod === "credit_card"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                      selectedMethod === "credit_card" ? "text-purple-400" : "text-gray-400"
                    }`} />
                    <span className="text-sm font-medium">Cartão</span>
                    <p className="text-xs text-gray-500 mt-1">Até 12x sem juros</p>
                  </button>
                </div>

                {/* Credit Card Form */}
                {selectedMethod === "credit_card" && (
                  <div className="space-y-4 pt-4 border-t border-gray-800">
                    {/* Saved Cards Section */}
                    {savedCards.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">
                          <Wallet className="w-4 h-4 inline mr-2" />
                          Cartões Salvos
                        </label>
                        <div className="space-y-2">
                          {savedCards.map((card) => (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => {
                                setSelectedCard(selectedCard === card.id ? null : card.id);
                                if (selectedCard !== card.id) {
                                  // Clear manual card entry
                                  setCardNumber("");
                                  setCardHolder("");
                                  setCardExpiry("");
                                  setCardCvv("");
                                }
                              }}
                              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                                selectedCard === card.id
                                  ? "border-purple-500 bg-purple-500/10"
                                  : "border-gray-700 hover:border-gray-600"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                <span className="font-mono">•••• {card.lastFour}</span>
                                <span className="text-xs text-gray-500 capitalize">{card.brand}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {card.expiryMonth}/{card.expiryYear}
                              </span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedCard(null)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-center ${
                              !selectedCard
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            <CreditCard className="w-4 h-4 inline mr-2" />
                            Usar outro cartão
                          </button>
                        </div>
                      </div>
                    )}

                    {/* New Card Form - only show if no saved card selected */}
                    {!selectedCard && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Número do Cartão *</label>
                        <input 
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition font-mono" 
                          placeholder="0000 0000 0000 0000" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          maxLength={19}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Nome no Cartão *</label>
                        <input 
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition uppercase" 
                          placeholder="NOME COMO ESTÁ NO CARTÃO" 
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Validade *</label>
                        <input 
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition font-mono" 
                          placeholder="MM/AA" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">CVV *</label>
                        <input 
                          type="password"
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition font-mono" 
                          placeholder="•••" 
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          maxLength={4}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">CEP *</label>
                        <input 
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition" 
                          placeholder="00000-000" 
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2"))}
                          maxLength={9}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Número *</label>
                        <input 
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition" 
                          placeholder="123" 
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Parcelas</label>
                        <select
                          className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white focus:border-purple-500 focus:outline-none transition"
                          value={installments}
                          onChange={(e) => setInstallments(parseInt(e.target.value))}
                        >
                          {installmentOptions.map((opt) => (
                            <option key={opt.count} value={opt.count}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Save card option */}
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-400">
                            Salvar cartão para compras futuras
                          </span>
                        </label>
                      </div>
                    </div>
                    )}
                    
                    {/* Subscription Cycle (if subscription) */}
                    {isSubscription && (
                      <div className="mt-4 p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                        <label className="block text-sm text-gray-400 mb-2">
                          <RefreshCw className="w-4 h-4 inline mr-2" />
                          Ciclo de Cobrança
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSubscriptionCycle("monthly")}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              subscriptionCycle === "monthly"
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            <span className="text-sm font-medium block">Mensal</span>
                            <span className="text-xs text-gray-500">Cobrado todo mês</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubscriptionCycle("yearly")}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              subscriptionCycle === "yearly"
                                ? "border-purple-500 bg-purple-500/10"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            <span className="text-sm font-medium block">Anual</span>
                            <span className="text-xs text-green-400">Economize 17%</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-gray-900/50 border-gray-800 sticky top-24">
                <h3 className="text-xl font-semibold mb-4">Resumo do Pedido</h3>
                
                {isCartCheckout ? (
                  cartItems.length > 0 ? (
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.type === "course" ? "Curso" : "Serviço"} x {item.quantity}
                            </p>
                          </div>
                          <span className="font-semibold text-sm">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      
                      <Separator className="bg-gray-800" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Subtotal</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                      
                      {selectedMethod === "boleto" && (
                        <div className="flex justify-between items-center text-green-400">
                          <span>Desconto PIX/Boleto (5%)</span>
                          <span>-{formatCurrency(total * 0.05)}</span>
                        </div>
                      )}

                      <Separator className="bg-gray-800" />
                      
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span className="text-purple-400">
                          {formatCurrency(selectedMethod === "boleto" ? total * 0.95 : total)}
                        </span>
                      </div>

                      {selectedMethod === "credit_card" && installments > 1 && (
                        <p className="text-sm text-gray-400 text-center">
                          {installments}x de {formatCurrency(total / installments)} sem juros
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">Seu carrinho está vazio.</p>
                  )
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">Plano {planName}</span>
                    <span className="text-gray-400">Preço a confirmar</span>
                  </div>
                )}

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg font-bold mt-6"
                  onClick={handlePayment}
                  disabled={loading || (isCartCheckout && cartItems.length === 0)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      {selectedMethod === "pix" && <QrCode className="w-5 h-5 mr-2" />}
                      {selectedMethod === "boleto" && <FileText className="w-5 h-5 mr-2" />}
                      {selectedMethod === "credit_card" && <CreditCard className="w-5 h-5 mr-2" />}
                      Pagar {formatCurrency(selectedMethod === "boleto" ? total * 0.95 : total)}
                    </>
                  )}
                </Button>

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-4 h-4" />
                    Pagamento 100% seguro via Asaas
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
