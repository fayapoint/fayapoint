"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Search, Filter, ShoppingCart, Truck, DollarSign, Clock,
  Image as ImageIcon, CheckCircle, AlertCircle, ChevronRight, ChevronLeft,
  Globe, Loader2, X, Star, Upload, Frame, Palette, Smartphone, Coffee,
  Calendar, BookOpen, Mail, Square, Gem, ExternalLink, RefreshCw, Info,
  ArrowRight, Sparkles, TrendingUp, MapPin, CreditCard, ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface ProdigiProduct {
  sku: string;
  name: string;
  size: string;
  category: string;
  estimatedBaseCostBRL: number;
  suggestedSellingPriceBRL: number;
}

interface ProdigiCategory {
  key: string;
  name: string;
  namePT: string;
  description: string;
  descriptionPT: string;
  icon: string;
  image: string;
  baseMargin: number;
  productCount: number;
  products: ProdigiProduct[];
}

interface ProdigiQuote {
  shippingMethod: string;
  shippingMethodLabel: string;
  costsBRL: { items: number; shipping: number; total: number };
  suggestedPricing: { items: number; shipping: number; total: number; profit: number; profitMargin: number };
  delivery: { minDays: number; maxDays: number; estimatedMinDate: string; estimatedMaxDate: string };
  shipments: { carrier: { name: string; service: string }; fulfillmentLocation: { countryCode: string } }[];
}

interface ProdigiOrder {
  _id: string;
  orderNumber: string;
  prodigiOrderId: string;
  status: string;
  grandTotalBRL: number;
  totalProfitBRL: number;
  createdAt: string;
  estimatedDeliveryMin: string;
  estimatedDeliveryMax: string;
  items: { sku: string; name: string; copies: number; sellingPriceBRL: number }[];
  shipments?: { trackingUrl?: string; carrier?: string; status: string }[];
}

interface CartItem {
  sku: string;
  name: string;
  size: string;
  category: string;
  copies: number;
  designUrl: string;
  baseCostBRL: number;
  sellingPriceBRL: number;
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, typeof Package> = {
  Frame: Frame,
  Palette: Palette,
  Image: ImageIcon,
  Square: Square,
  Gem: Gem,
  Smartphone: Smartphone,
  Coffee: Coffee,
  Mail: Mail,
  Calendar: Calendar,
  Book: BookOpen,
};

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending: { label: "Pendente", color: "bg-yellow-500", icon: Clock },
  processing: { label: "Processando", color: "bg-blue-500", icon: Loader2 },
  in_production: { label: "Em Produção", color: "bg-purple-500", icon: Package },
  shipped: { label: "Enviado", color: "bg-green-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-emerald-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: X },
  failed: { label: "Falhou", color: "bg-red-600", icon: AlertCircle },
};

export default function ProdigiStorePanel() {
  // State
  const [activeTab, setActiveTab] = useState<"catalog" | "cart" | "orders">("catalog");
  const [categories, setCategories] = useState<ProdigiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProdigiProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<ProdigiOrder[]>([]);
  const [quotes, setQuotes] = useState<ProdigiQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<ProdigiQuote | null>(null);
  
  // Loading states
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  // Form states
  const [searchQuery, setSearchQuery] = useState("");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [copies, setCopies] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);
  
  // Checkout form
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch catalog
  const fetchCatalog = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;

    setIsLoadingCatalog(true);
    try {
      const res = await fetch("/api/pod/prodigi/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.catalog || []);
      }
    } catch (e) {
      console.error("Error fetching catalog:", e);
      toast.error("Erro ao carregar catálogo");
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;

    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/pod/prodigi/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Fetch quote
  const fetchQuote = useCallback(async (items: { sku: string; copies: number }[]) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token || items.length === 0) return;

    setIsLoadingQuote(true);
    try {
      const res = await fetch("/api/pod/prodigi/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          destinationCountryCode: "BR",
          includeAllMethods: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
        if (data.quotes?.length > 0) {
          // Select Standard by default
          const standardQuote = data.quotes.find((q: ProdigiQuote) => q.shippingMethod === "Standard");
          setSelectedQuote(standardQuote || data.quotes[0]);
        }
      }
    } catch (e) {
      console.error("Error fetching quote:", e);
      toast.error("Erro ao calcular frete");
    } finally {
      setIsLoadingQuote(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Fetch orders when tab changes
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Fetch quote when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      fetchQuote(cart.map(item => ({ sku: item.sku, copies: item.copies })));
    } else {
      setQuotes([]);
      setSelectedQuote(null);
    }
  }, [cart, fetchQuote]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Use PNG, JPG ou WebP");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Máximo 50MB");
      return;
    }

    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
  };

  // Upload design
  const uploadDesign = async (): Promise<string | null> => {
    if (!designFile) return null;

    const token = localStorage.getItem("fayapoint_token");
    if (!token) return null;

    const formData = new FormData();
    formData.append("file", designFile);
    formData.append("folder", "prodigi-designs");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.error("Upload error:", e);
    }
    return null;
  };

  // Add to cart
  const addToCart = async () => {
    if (!selectedProduct || !designPreview) {
      toast.error("Selecione um produto e faça upload do design");
      return;
    }

    // Upload design first
    const designUrl = await uploadDesign();
    if (!designUrl) {
      toast.error("Erro ao fazer upload do design");
      return;
    }

    const sellingPrice = customPrice > 0 ? customPrice : selectedProduct.suggestedSellingPriceBRL;

    setCart(prev => [
      ...prev,
      {
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        size: selectedProduct.size,
        category: selectedProduct.category,
        copies,
        designUrl,
        baseCostBRL: selectedProduct.estimatedBaseCostBRL,
        sellingPriceBRL: sellingPrice,
      },
    ]);

    // Reset form
    setSelectedProduct(null);
    setDesignFile(null);
    setDesignPreview(null);
    setCopies(1);
    setCustomPrice(0);

    toast.success("Produto adicionado ao carrinho!");
    setActiveTab("cart");
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Create order
  const createOrder = async () => {
    if (cart.length === 0 || !selectedQuote) {
      toast.error("Carrinho vazio ou frete não selecionado");
      return;
    }

    if (!recipientName || !addressLine1 || !addressCity || !addressState || !addressPostalCode) {
      toast.error("Preencha os dados de entrega");
      return;
    }

    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;

    setIsCreatingOrder(true);
    try {
      const res = await fetch("/api/pod/prodigi/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            sku: item.sku,
            imageUrl: item.designUrl,
            copies: item.copies,
            name: item.name,
            sellingPriceBRL: item.sellingPriceBRL,
            baseCostGBP: item.baseCostBRL / 6.30, // Convert back to GBP estimate
          })),
          recipient: {
            name: recipientName,
            email: recipientEmail,
            phone: recipientPhone,
            address: {
              line1: addressLine1,
              line2: addressLine2,
              city: addressCity,
              state: addressState,
              postalCode: addressPostalCode,
              countryCode: "BR",
              country: "Brasil",
            },
          },
          shippingMethod: selectedQuote.shippingMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Pedido ${data.order.orderNumber} criado com sucesso!`);
        
        // Clear cart and checkout
        setCart([]);
        setShowCheckout(false);
        setRecipientName("");
        setRecipientEmail("");
        setRecipientPhone("");
        setAddressLine1("");
        setAddressLine2("");
        setAddressCity("");
        setAddressState("");
        setAddressPostalCode("");
        
        // Go to orders tab
        setActiveTab("orders");
        fetchOrders();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar pedido");
      }
    } catch (e) {
      console.error("Create order error:", e);
      toast.error("Erro ao criar pedido");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.sellingPriceBRL * item.copies, 0);
  const cartProfit = cart.reduce((sum, item) => sum + (item.sellingPriceBRL - item.baseCostBRL) * item.copies, 0);
  const shippingCost = selectedQuote?.suggestedPricing.shipping || 0;
  const cartTotal = cartSubtotal + shippingCost;

  // Filter products by search
  const filteredCategories = categories.map(cat => ({
    ...cat,
    products: cat.products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => searchQuery === "" || cat.products.length > 0);

  // Get category products
  const currentCategory = selectedCategory
    ? filteredCategories.find(c => c.key === selectedCategory)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Prodigi Wall Art
              <Badge className="bg-blue-600 text-xs">PREMIUM</Badge>
            </h2>
            <p className="text-sm text-gray-400">Canvas, Metal Prints, Fine Art e mais</p>
          </div>
        </div>

        {/* Cart Badge */}
        <div className="flex items-center gap-3">
          <Button
            variant={activeTab === "cart" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("cart")}
            className="relative"
          >
            <ShoppingCart size={16} className="mr-2" />
            Carrinho
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-500 rounded-full text-xs flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: "catalog", label: "Catálogo", icon: Package },
          { id: "cart", label: "Carrinho", icon: ShoppingCart, badge: cart.length },
          { id: "orders", label: "Pedidos", icon: Truck },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:bg-gray-800"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <Badge className="bg-purple-500 text-xs">{tab.badge}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {/* Catalog Tab */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700"
              />
            </div>

            {/* Categories Grid */}
            {!selectedCategory && !selectedProduct && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoadingCatalog ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-800 animate-pulse rounded-xl" />
                  ))
                ) : (
                  filteredCategories.map(category => {
                    const Icon = CATEGORY_ICONS[category.icon] || Package;
                    return (
                      <motion.div
                        key={category.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.key)}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={category.image}
                          alt={category.namePT}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={16} className="text-purple-400" />
                            <h3 className="font-bold text-white">{category.namePT}</h3>
                          </div>
                          <p className="text-xs text-gray-300">{category.productCount} produtos</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* Products List */}
            {selectedCategory && !selectedProduct && currentCategory && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                >
                  <ChevronLeft size={18} />
                  Voltar ao catálogo
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold text-white">{currentCategory.namePT}</h3>
                  <Badge className="bg-gray-700">{currentCategory.products.length} produtos</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentCategory.products.map(product => (
                    <Card
                      key={product.sku}
                      className="bg-gray-800 border-gray-700 p-4 cursor-pointer hover:border-purple-500 transition-all"
                      onClick={() => {
                        setSelectedProduct(product);
                        setCustomPrice(product.suggestedSellingPriceBRL);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{product.name}</h4>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                        <Badge className="bg-purple-600">{product.size}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Custo base:</span>
                          <span className="text-white">R$ {product.estimatedBaseCostBRL.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Venda sugerida:</span>
                          <span className="text-green-400 font-semibold">
                            R$ {product.suggestedSellingPriceBRL.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lucro estimado:</span>
                          <span className="text-purple-400">
                            R$ {(product.suggestedSellingPriceBRL - product.estimatedBaseCostBRL).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Product Detail / Add to Cart */}
            {selectedProduct && (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                >
                  <ChevronLeft size={18} />
                  Voltar aos produtos
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Design Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">{selectedProduct.name}</h3>
                    <p className="text-gray-400">Tamanho: {selectedProduct.size}</p>

                    {/* Upload Area */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center",
                        designPreview
                          ? "border-purple-500 bg-gray-800"
                          : "border-gray-600 hover:border-purple-500 bg-gray-800/50"
                      )}
                    >
                      {designPreview ? (
                        <img
                          src={designPreview}
                          alt="Design"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center p-8">
                          <Upload size={48} className="mx-auto text-gray-500 mb-4" />
                          <p className="text-white font-medium">Clique para fazer upload</p>
                          <p className="text-sm text-gray-500 mt-1">PNG, JPG ou WebP até 50MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />

                    {designPreview && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDesignFile(null);
                          setDesignPreview(null);
                        }}
                        className="w-full"
                      >
                        <X size={16} className="mr-2" />
                        Remover design
                      </Button>
                    )}
                  </div>

                  {/* Right: Configuration */}
                  <div className="space-y-6">
                    {/* Pricing Card */}
                    <Card className="bg-gray-800 border-gray-700 p-6">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-green-400" />
                        Precificação
                      </h4>

                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Custo base Prodigi:</span>
                          <span className="text-white">R$ {selectedProduct.estimatedBaseCostBRL.toFixed(2)}</span>
                        </div>

                        <div>
                          <Label className="text-gray-400">Quantidade</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCopies(Math.max(1, copies - 1))}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={copies}
                              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 text-center bg-gray-900 border-gray-600"
                              min={1}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCopies(copies + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-400">Preço de venda (R$)</Label>
                          <Input
                            type="number"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                            className="mt-1 bg-gray-900 border-gray-600"
                            step="0.01"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Sugerido: R$ {selectedProduct.suggestedSellingPriceBRL.toFixed(2)} (45% margem)
                          </p>
                        </div>

                        <div className="border-t border-gray-700 pt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Custo total:</span>
                            <span className="text-white">
                              R$ {(selectedProduct.estimatedBaseCostBRL * copies).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Venda total:</span>
                            <span className="text-white font-semibold">
                              R$ {(customPrice * copies).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-lg">
                            <span className="text-purple-400">Lucro:</span>
                            <span className="text-green-400 font-bold">
                              R$ {((customPrice - selectedProduct.estimatedBaseCostBRL) * copies).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Info Card */}
                    <Card className="bg-gray-800/50 border-gray-700 p-4">
                      <div className="flex items-start gap-3">
                        <Info size={18} className="text-blue-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-white font-medium mb-1">Sobre Prodigi</p>
                          <ul className="text-gray-400 space-y-1">
                            <li>• Produção em UK, USA, EU e Austrália</li>
                            <li>• Envio para Brasil em 10-20 dias úteis</li>
                            <li>• Rastreamento completo</li>
                            <li>• Qualidade premium garantida</li>
                          </ul>
                        </div>
                      </div>
                    </Card>

                    {/* Add to Cart Button */}
                    <Button
                      onClick={addToCart}
                      disabled={!designPreview || customPrice <= selectedProduct.estimatedBaseCostBRL}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      size="lg"
                    >
                      <ShoppingCart size={18} className="mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Cart Tab */}
        {activeTab === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {cart.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-12 text-center">
                <ShoppingCart size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Carrinho vazio</h3>
                <p className="text-gray-400 mb-4">Adicione produtos do catálogo para começar</p>
                <Button onClick={() => setActiveTab("catalog")}>
                  Ver Catálogo
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-white">
                    Itens ({cart.length})
                  </h3>

                  {cart.map((item, index) => (
                    <Card key={index} className="bg-gray-800 border-gray-700 p-4">
                      <div className="flex gap-4">
                        <img
                          src={item.designUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.sku}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-400">Qtd: {item.copies}</span>
                            <span className="text-gray-400">
                              Custo: R$ {(item.baseCostBRL * item.copies).toFixed(2)}
                            </span>
                            <span className="text-green-400 font-semibold">
                              Venda: R$ {(item.sellingPriceBRL * item.copies).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700 p-6">
                    <h3 className="font-bold text-white mb-4">Resumo</h3>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Subtotal:</span>
                        <span className="text-white">R$ {cartSubtotal.toFixed(2)}</span>
                      </div>

                      {/* Shipping Options */}
                      {isLoadingQuote ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="animate-spin" size={16} />
                          <span className="text-gray-400">Calculando frete...</span>
                        </div>
                      ) : quotes.length > 0 ? (
                        <div className="space-y-2">
                          <Label className="text-gray-400">Frete:</Label>
                          <Select
                            value={selectedQuote?.shippingMethod || ""}
                            onValueChange={(value) => {
                              const quote = quotes.find(q => q.shippingMethod === value);
                              setSelectedQuote(quote || null);
                            }}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {quotes.map(quote => (
                                <SelectItem key={quote.shippingMethod} value={quote.shippingMethod}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{quote.shippingMethodLabel}</span>
                                    <span className="text-gray-500 ml-4">
                                      R$ {quote.suggestedPricing.shipping.toFixed(2)}
                                      <span className="text-xs ml-1">
                                        ({quote.delivery.minDays}-{quote.delivery.maxDays} dias)
                                      </span>
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      {selectedQuote && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Frete ({selectedQuote.shippingMethodLabel}):</span>
                          <span className="text-white">R$ {shippingCost.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="border-t border-gray-700 pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-white font-bold">Total:</span>
                          <span className="text-white font-bold">R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>Seu lucro:</span>
                          <span className="font-semibold">R$ {cartProfit.toFixed(2)}</span>
                        </div>
                      </div>

                      {selectedQuote && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <Truck size={14} />
                          Entrega estimada: {selectedQuote.delivery.minDays}-{selectedQuote.delivery.maxDays} dias úteis
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => setShowCheckout(true)}
                      disabled={!selectedQuote}
                      className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      Finalizar Pedido
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* Checkout Modal */}
            <AnimatePresence>
              {showCheckout && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                  onClick={() => setShowCheckout(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-white">Dados de Entrega</h3>
                      <button onClick={() => setShowCheckout(false)}>
                        <X size={24} className="text-gray-500" />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <Label>Nome completo *</Label>
                        <Input
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="mt-1 bg-gray-800 border-gray-700"
                          placeholder="João da Silva"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>E-mail</Label>
                          <Input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700"
                          />
                        </div>
                        <div>
                          <Label>Telefone</Label>
                          <Input
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Endereço *</Label>
                        <Input
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          className="mt-1 bg-gray-800 border-gray-700"
                          placeholder="Rua, número"
                        />
                      </div>

                      <div>
                        <Label>Complemento</Label>
                        <Input
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          className="mt-1 bg-gray-800 border-gray-700"
                          placeholder="Apto, bloco, etc."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cidade *</Label>
                          <Input
                            value={addressCity}
                            onChange={(e) => setAddressCity(e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700"
                          />
                        </div>
                        <div>
                          <Label>Estado *</Label>
                          <Input
                            value={addressState}
                            onChange={(e) => setAddressState(e.target.value)}
                            className="mt-1 bg-gray-800 border-gray-700"
                            placeholder="SP"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>CEP *</Label>
                        <Input
                          value={addressPostalCode}
                          onChange={(e) => setAddressPostalCode(e.target.value)}
                          className="mt-1 bg-gray-800 border-gray-700"
                          placeholder="00000-000"
                        />
                      </div>

                      <div className="bg-gray-800 rounded-lg p-4 mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Total do pedido:</span>
                          <span className="text-white font-bold">R$ {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-400">
                          <span>Seu lucro:</span>
                          <span>R$ {cartProfit.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={createOrder}
                        disabled={isCreatingOrder || !recipientName || !addressLine1 || !addressCity || !addressState || !addressPostalCode}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                      >
                        {isCreatingOrder ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Criando pedido...
                          </>
                        ) : (
                          <>
                            <CreditCard size={16} className="mr-2" />
                            Confirmar Pedido
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Meus Pedidos Prodigi</h3>
              <Button variant="outline" size="sm" onClick={fetchOrders}>
                <RefreshCw size={14} className="mr-2" />
                Atualizar
              </Button>
            </div>

            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-purple-500" size={32} />
              </div>
            ) : orders.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700 p-12 text-center">
                <Package size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Nenhum pedido ainda</h3>
                <p className="text-gray-400">Seus pedidos Prodigi aparecerão aqui</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map(order => {
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={order._id} className="bg-gray-800 border-gray-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{order.orderNumber}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <Badge className={cn(statusConfig.color, "flex items-center gap-1")}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Itens:</span>
                          <span className="text-white ml-2">{order.items?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <span className="text-white ml-2">R$ {order.grandTotalBRL?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Lucro:</span>
                          <span className="text-green-400 ml-2">R$ {order.totalProfitBRL?.toFixed(2)}</span>
                        </div>
                      </div>

                      {order.estimatedDeliveryMin && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Truck size={14} />
                          Previsão: {new Date(order.estimatedDeliveryMin).toLocaleDateString("pt-BR")} - {new Date(order.estimatedDeliveryMax).toLocaleDateString("pt-BR")}
                        </div>
                      )}

                      {order.shipments?.[0]?.trackingUrl && (
                        <a
                          href={order.shipments[0].trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-400 text-sm mt-2 hover:underline"
                        >
                          <ExternalLink size={14} />
                          Rastrear pedido
                        </a>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
