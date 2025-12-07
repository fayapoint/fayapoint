"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Play, Pause,
  Package, DollarSign, ShoppingBag, Sparkles, Shirt, Home, Frame, Coffee,
  Smartphone, Upload, Image as ImageIcon, CheckCircle, Clock, AlertCircle,
  ChevronRight, ChevronLeft, Globe, Loader2, X, Star, Lock, Trophy, ArrowRight, Save, Send, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface PrintifyBlueprint { id: number; title: string; description: string; brand: string; model: string; images: string[]; }
interface PrintifyProvider { id: number; title: string; location: { country: string; city?: string }; }
interface PrintifyVariant { 
  id: number; title: string; options: Record<string, string>; 
  placeholders: { position: string; height: number; width: number }[];
  price?: number; cost?: number; is_available?: boolean;
}
interface PrintifyShipping {
  handling_time: { value: number; unit: string };
  profiles: { variant_ids: number[]; first_item: { cost: number; currency: string }; countries: string[] }[];
}

// Pricing constants
const MARGIN_PERCENTAGE = 35; // 35% profit margin
const USD_TO_BRL = 5.50; // Exchange rate (should ideally be fetched)
const BRAZIL_SHIPPING_DAYS = { min: 15, max: 30 }; // Delivery estimate to Brazil

// Print area configurations for different product types
// Values are percentages of the product image dimensions
const PRINT_AREAS: Record<string, { x: number; y: number; width: number; height: number; blend: string }> = {
  // Apparel
  'tshirt': { x: 25, y: 20, width: 50, height: 45, blend: 'multiply' },
  'hoodie': { x: 25, y: 25, width: 50, height: 40, blend: 'multiply' },
  'tanktop': { x: 25, y: 15, width: 50, height: 50, blend: 'multiply' },
  'sweatshirt': { x: 25, y: 22, width: 50, height: 42, blend: 'multiply' },
  // Wall Art & Posters (design fills the frame/canvas area)
  'poster': { x: 10, y: 10, width: 80, height: 80, blend: 'source-over' },
  'canvas': { x: 8, y: 8, width: 84, height: 84, blend: 'source-over' },
  'frame': { x: 12, y: 12, width: 76, height: 76, blend: 'source-over' },
  'art': { x: 10, y: 10, width: 80, height: 80, blend: 'source-over' },
  // Bags
  'tote': { x: 25, y: 30, width: 50, height: 40, blend: 'multiply' },
  'bag': { x: 28, y: 32, width: 44, height: 36, blend: 'multiply' },
  'backpack': { x: 28, y: 25, width: 44, height: 45, blend: 'multiply' },
  // Drinkware
  'mug': { x: 20, y: 25, width: 60, height: 50, blend: 'multiply' },
  'tumbler': { x: 15, y: 20, width: 70, height: 60, blend: 'multiply' },
  'bottle': { x: 25, y: 20, width: 50, height: 55, blend: 'multiply' },
  // Tech & Accessories
  'phone': { x: 10, y: 10, width: 80, height: 80, blend: 'source-over' },
  'case': { x: 10, y: 10, width: 80, height: 80, blend: 'source-over' },
  'mousepad': { x: 5, y: 5, width: 90, height: 90, blend: 'source-over' },
  // Home
  'pillow': { x: 15, y: 15, width: 70, height: 70, blend: 'multiply' },
  'blanket': { x: 10, y: 10, width: 80, height: 80, blend: 'multiply' },
  // Default for unknown products
  'default': { x: 20, y: 20, width: 60, height: 60, blend: 'multiply' },
};

// Detect product type from title
function detectProductType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  // Check each product type
  for (const type of Object.keys(PRINT_AREAS)) {
    if (type !== 'default' && lowerTitle.includes(type)) {
      return type;
    }
  }
  
  // Additional keyword matching
  if (lowerTitle.includes('shirt') || lowerTitle.includes('tee')) return 'tshirt';
  if (lowerTitle.includes('hood') || lowerTitle.includes('sweat')) return 'hoodie';
  if (lowerTitle.includes('print') || lowerTitle.includes('wall') || lowerTitle.includes('framed')) return 'frame';
  if (lowerTitle.includes('cup') || lowerTitle.includes('drink')) return 'mug';
  if (lowerTitle.includes('cushion')) return 'pillow';
  
  return 'default';
}

// Enhanced Mockup Preview Component
function MockupPreview({ 
  productImage, 
  designImage, 
  productTitle = '',
  className 
}: { 
  productImage: string; 
  designImage: string | null; 
  productTitle?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !productImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoading(true);

    const productImg = new Image();
    productImg.crossOrigin = 'anonymous';
    
    productImg.onload = () => {
      // Determine canvas size based on image aspect ratio
      const aspectRatio = productImg.width / productImg.height;
      let canvasWidth = 400;
      let canvasHeight = 400;
      
      if (aspectRatio > 1) {
        canvasHeight = 400 / aspectRatio;
      } else if (aspectRatio < 1) {
        canvasWidth = 400 * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Draw product image to fill canvas
      ctx.drawImage(productImg, 0, 0, canvasWidth, canvasHeight);
      
      if (designImage) {
        const designImg = new Image();
        designImg.crossOrigin = 'anonymous';
        
        designImg.onload = () => {
          // Get print area based on product type
          const productType = detectProductType(productTitle);
          const printArea = PRINT_AREAS[productType] || PRINT_AREAS.default;
          
          // Calculate actual pixel positions from percentages
          const printX = (printArea.x / 100) * canvasWidth;
          const printY = (printArea.y / 100) * canvasHeight;
          const printWidth = (printArea.width / 100) * canvasWidth;
          const printHeight = (printArea.height / 100) * canvasHeight;
          
          // Calculate design dimensions maintaining aspect ratio
          const designAspect = designImg.width / designImg.height;
          const printAspect = printWidth / printHeight;
          
          let drawWidth: number;
          let drawHeight: number;
          
          if (designAspect > printAspect) {
            // Design is wider than print area
            drawWidth = printWidth;
            drawHeight = printWidth / designAspect;
          } else {
            // Design is taller than print area
            drawHeight = printHeight;
            drawWidth = printHeight * designAspect;
          }
          
          // Center the design within the print area
          const drawX = printX + (printWidth - drawWidth) / 2;
          const drawY = printY + (printHeight - drawHeight) / 2;
          
          // Apply blend mode based on product type
          ctx.globalCompositeOperation = printArea.blend as GlobalCompositeOperation;
          ctx.drawImage(designImg, drawX, drawY, drawWidth, drawHeight);
          
          // Reset and add subtle shadow for depth on non-frame products
          ctx.globalCompositeOperation = 'source-over';
          if (printArea.blend === 'multiply') {
            ctx.fillStyle = 'rgba(0,0,0,0.03)';
            ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
          }
          
          setIsLoading(false);
        };
        
        designImg.onerror = () => {
          console.error('Failed to load design image');
          setIsLoading(false);
        };
        designImg.src = designImage;
      } else {
        setIsLoading(false);
      }
    };
    
    productImg.onerror = () => {
      console.error('Failed to load product image');
      setIsLoading(false);
    };
    productImg.src = productImage;
  }, [productImage, designImage, productTitle]);

  return (
    <div className={cn("relative bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center", className)}>
      <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      )}
      {designImage && !isLoading && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-500/80 rounded text-xs font-medium text-white flex items-center gap-1">
          <CheckCircle size={12} /> Mockup
        </div>
      )}
    </div>
  );
}
interface PODProduct {
  _id: string; title: string; slug: string; description: string; category: string; templateId: string; templateName: string;
  baseProductType: string; designFiles: { url: string; width: number; height: number }[]; mockupImages: string[];
  primaryMockup?: string; variants: { id: string; name: string; sellingPrice: number; basePrice: number }[];
  baseCost: number; suggestedPrice: number; status: "draft" | "pending_review" | "active" | "paused" | "rejected" | "archived";
  isPublished: boolean; views: number; sales: number; revenue: number; rating: number; createdAt: string;
}
interface UserData { progress?: { xp?: number; level?: number }; subscription?: { plan?: string }; }

const CATEGORY_ICONS: Record<string, typeof Package> = { apparel: Shirt, wallArt: Frame, drinkware: Coffee, accessories: ShoppingBag, tech: Smartphone, home: Home };
const STATUS_CONFIG = {
  draft: { label: "Rascunho", color: "bg-gray-500", icon: Edit },
  pending_review: { label: "Em Revisão", color: "bg-yellow-500", icon: Clock },
  active: { label: "Ativo", color: "bg-green-500", icon: CheckCircle },
  paused: { label: "Pausado", color: "bg-orange-500", icon: Pause },
  rejected: { label: "Rejeitado", color: "bg-red-500", icon: AlertCircle },
  archived: { label: "Arquivado", color: "bg-gray-600", icon: Package },
};
const MIN_XP_TO_PUBLISH = 500;
const BLUEPRINT_CATEGORIES = [
  { key: "t-shirt", label: "Camisetas", icon: Shirt }, { key: "hoodie", label: "Moletons", icon: Shirt },
  { key: "mug", label: "Canecas", icon: Coffee }, { key: "poster", label: "Posters", icon: Frame },
  { key: "canvas", label: "Canvas", icon: Frame }, { key: "phone case", label: "Capinhas", icon: Smartphone },
  { key: "tote bag", label: "Bolsas", icon: ShoppingBag }, { key: "pillow", label: "Almofadas", icon: Home },
];

interface PODStorePanelProps {
  isCompact?: boolean;
}

export default function PODStorePanel({ isCompact }: PODStorePanelProps) {
  // isCompact can be used for responsive layout adjustments
  void isCompact;
  const [activeTab, setActiveTab] = useState<"products" | "create">("products");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<PODProduct[]>([]);
  const [stats, setStats] = useState<{ total: number; active: number; draft: number; totalSales: number; totalRevenue: number } | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<PODProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<PODProduct | null>(null);
  const [createStep, setCreateStep] = useState(1);
  const [blueprintSearch, setBlueprintSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [blueprints, setBlueprints] = useState<PrintifyBlueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<PrintifyBlueprint | null>(null);
  const [providers, setProviders] = useState<PrintifyProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PrintifyProvider | null>(null);
  const [variants, setVariants] = useState<PrintifyVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  const [shippingInfo, setShippingInfo] = useState<PrintifyShipping | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [uploadedDesignUrl, setUploadedDesignUrl] = useState<string | null>(null);
  const [printifyMockups, setPrintifyMockups] = useState<{ src: string; variantIds: number[]; position: string; isDefault: boolean }[]>([]);
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false);
  const [mockupProductId, setMockupProductId] = useState<string | null>(null);
  const [mockupShopId, setMockupShopId] = useState<number | null>(null);
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [baseCost, setBaseCost] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isFetchingBlueprints, setIsFetchingBlueprints] = useState(false);
  const [isFetchingProviders, setIsFetchingProviders] = useState(false);
  const [isFetchingVariants, setIsFetchingVariants] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    try {
      const res = await fetch("/api/user/dashboard", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setUserData(data.user); }
    } catch (e) { console.error("Error:", e); }
  }, []);

  const fetchProducts = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/pod/products?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProducts(data.products || []); setStats(data.stats); }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao carregar produtos"); }
    finally { setIsLoading(false); }
  }, [statusFilter]);

  const fetchBlueprints = useCallback(async (category?: string, search?: string) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsFetchingBlueprints(true);
    try {
      const params = new URLSearchParams({ action: "catalog" });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/pod/blueprints?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.results) setBlueprints(data.results);
        else if (data.featured) setBlueprints(data.featured);
        else {
          const allBps: PrintifyBlueprint[] = [];
          Object.values(data.blueprintsByCategory || {}).forEach((bps) => allBps.push(...(bps as PrintifyBlueprint[]).slice(0, 5)));
          setBlueprints(allBps.slice(0, 24));
        }
      }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao carregar catálogo"); }
    finally { setIsFetchingBlueprints(false); }
  }, []);

  const fetchProviders = useCallback(async (blueprintId: number) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsFetchingProviders(true);
    try {
      const res = await fetch(`/api/pod/blueprints?action=blueprint&blueprintId=${blueprintId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProviders(data.providers || []); }
    } catch (e) { console.error("Error:", e); }
    finally { setIsFetchingProviders(false); }
  }, []);

  const fetchVariants = useCallback(async (blueprintId: number, providerId: number) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsFetchingVariants(true);
    try {
      const res = await fetch(`/api/pod/blueprints?action=variants&blueprintId=${blueprintId}&providerId=${providerId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const variantList = data.variants || [];
        setVariants(variantList);
        setShippingInfo(data.shipping || null);
        
        // Auto-select first 3 available variants
        const availableVariants = variantList.filter((v: PrintifyVariant) => v.is_available !== false);
        if (availableVariants.length > 0) {
          setSelectedVariants(availableVariants.slice(0, 3).map((v: PrintifyVariant) => v.id));
          
          // Calculate base cost from first variant (convert from cents USD to BRL)
          const firstVariant = availableVariants[0];
          const costInCents = firstVariant.price || firstVariant.cost || 1200; // Default $12.00
          const costInBRL = (costInCents / 100) * USD_TO_BRL;
          setBaseCost(Math.round(costInBRL * 100) / 100);
          
          // Set selling price with margin
          const sellPrice = costInBRL * (1 + MARGIN_PERCENTAGE / 100);
          setSellingPrice(Math.round(sellPrice * 100) / 100);
        }
      }
    } catch (e) { console.error("Error:", e); }
    finally { setIsFetchingVariants(false); }
  }, []);

  useEffect(() => { fetchUserData(); fetchProducts(); }, [fetchUserData, fetchProducts]);
  useEffect(() => { if (activeTab === "create" && blueprints.length === 0) fetchBlueprints(); }, [activeTab, blueprints.length, fetchBlueprints]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) { toast.error("Use PNG, JPG ou SVG"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Max 50MB"); return; }
    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
  };

  const uploadDesign = async (): Promise<string | null> => {
    if (!designFile) return null;
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return null;
    const formData = new FormData();
    formData.append("file", designFile);
    formData.append("folder", "pod-designs");
    formData.append("saveToGallery", "true"); // Save to user's gallery
    formData.append("description", designFile.name || "Design POD");
    try {
      const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (res.ok) { const data = await res.json(); return data.url; }
    } catch (e) { console.error("Upload error:", e); }
    return null;
  };

  // Generate real Printify mockups
  const generatePrintifyMockups = useCallback(async (designUrl: string) => {
    if (!selectedBlueprint || !selectedProvider || !selectedVariants.length) {
      toast.error("Selecione produto, fornecedor e variantes primeiro");
      return;
    }
    
    setIsGeneratingMockups(true);
    setPrintifyMockups([]); // Clear old mockups
    
    // Get placeholder dimensions from first selected variant
    const firstVariant = variants.find(v => selectedVariants.includes(v.id));
    const placeholder = firstVariant?.placeholders?.[0];
    const placeholderWidth = placeholder?.width || 4500;
    const placeholderHeight = placeholder?.height || 5100;
    
    console.log('[POD] Generating mockups with placeholder:', placeholderWidth, 'x', placeholderHeight);
    
    try {
      const res = await fetch("/api/pod/mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designUrl,
          blueprintId: selectedBlueprint.id,
          printProviderId: selectedProvider.id,
          variantIds: selectedVariants,
          productTitle: selectedBlueprint.title,
          placeholderWidth,
          placeholderHeight
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.mockups?.length) {
          setPrintifyMockups(data.mockups);
          setMockupProductId(data.productId);
          setMockupShopId(data.shopId);
          toast.success(`${data.mockups.length} mockups gerados!`);
        } else {
          toast.error("Nenhum mockup retornado");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao gerar mockups");
      }
    } catch (error) {
      console.error("Mockup generation error:", error);
      toast.error("Erro ao conectar com Printify");
    } finally {
      setIsGeneratingMockups(false);
    }
  }, [selectedBlueprint, selectedProvider, selectedVariants]);

  const inferCategory = (title: string): string => {
    const l = title.toLowerCase();
    if (l.includes("shirt") || l.includes("hoodie")) return "apparel";
    if (l.includes("mug") || l.includes("cup")) return "drinkware";
    if (l.includes("poster") || l.includes("canvas")) return "wallArt";
    if (l.includes("phone") || l.includes("case")) return "tech";
    if (l.includes("pillow") || l.includes("blanket")) return "home";
    return "accessories";
  };

  const createProduct = async (publish: boolean = false) => {
    if (!selectedBlueprint || !selectedProvider || !designPreview) { toast.error("Preencha todos os campos"); return; }
    const userXP = userData?.progress?.xp || 0;
    if (publish && userXP < MIN_XP_TO_PUBLISH) { toast.error(`Precisa ${MIN_XP_TO_PUBLISH} XP para publicar. Atual: ${userXP}`); return; }
    setIsCreating(true);
    const token = localStorage.getItem("fayapoint_token");
    try {
      let designUrl = uploadedDesignUrl;
      if (!designUrl && designFile) { designUrl = await uploadDesign(); if (!designUrl) { toast.error("Erro no upload"); setIsCreating(false); return; } setUploadedDesignUrl(designUrl); }
      // Use Printify mockups if available, otherwise use blueprint images
      const mockupUrls = printifyMockups.length > 0 
        ? printifyMockups.map(m => m.src) 
        : selectedBlueprint.images;
      const primaryMockupUrl = printifyMockups.length > 0 
        ? (printifyMockups.find(m => m.isDefault)?.src || printifyMockups[0]?.src)
        : selectedBlueprint.images[0];

      const productData = {
        title: productTitle || selectedBlueprint.title, description: productDescription || selectedBlueprint.description,
        category: inferCategory(selectedBlueprint.title), templateId: String(selectedBlueprint.id),
        templateName: selectedBlueprint.title, baseProductType: selectedBlueprint.model,
        designFiles: [{ url: designUrl, width: 4000, height: 4000, format: designFile?.type.split("/")[1] || "png", sizeBytes: designFile?.size || 0 }],
        mockupImages: mockupUrls, primaryMockup: primaryMockupUrl,
        variants: selectedVariants.map(vId => {
          const v = variants.find(x => x.id === vId);
          return { id: String(vId), providerVariantId: String(vId), name: v?.title || "Variant", options: v?.options || {}, sku: `POD-${selectedBlueprint.id}-${vId}`, basePrice: baseCost, sellingPrice, profit: sellingPrice - baseCost, isActive: true };
        }),
        baseCost, suggestedPrice: sellingPrice, minimumPrice: baseCost * 1.2,
        providers: [{ providerId: String(selectedProvider.id), providerSlug: "printify", syncStatus: "pending" as const }],
        primaryProvider: "printify",
      };
      const res = await fetch("/api/pod/products", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(productData) });
      if (res.ok) {
        const data = await res.json();
        if (publish && data.product?._id) {
          await fetch("/api/pod/products", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: data.product._id, status: "active" }) });
        }
        toast.success(publish ? "Publicado!" : "Salvo!");
        resetCreateWizard(); setActiveTab("products"); fetchProducts();
      } else { const err = await res.json(); toast.error(err.error || "Erro"); }
    } catch (e) { console.error(e); toast.error("Erro ao criar"); }
    finally { setIsCreating(false); }
  };

  const updateProduct = async (productId: string, updates: Partial<PODProduct>) => {
    const token = localStorage.getItem("fayapoint_token");
    try {
      const res = await fetch("/api/pod/products", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId, ...updates }) });
      if (res.ok) { toast.success("Atualizado"); fetchProducts(); setEditingProduct(null); setSelectedProduct(null); }
    } catch (e) { console.error(e); toast.error("Erro"); }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Excluir?")) return;
    const token = localStorage.getItem("fayapoint_token");
    try {
      const res = await fetch(`/api/pod/products?productId=${productId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success("Excluído"); fetchProducts(); }
    } catch (e) { console.error(e); toast.error("Erro"); }
  };

  const publishProduct = async (productId: string) => {
    const userXP = userData?.progress?.xp || 0;
    if (userXP < MIN_XP_TO_PUBLISH) { toast.error(`Precisa ${MIN_XP_TO_PUBLISH} XP. Atual: ${userXP}`); return; }
    await updateProduct(productId, { status: "active" });
  };

  const resetCreateWizard = () => {
    setCreateStep(1); setSelectedBlueprint(null); setSelectedProvider(null); setProviders([]); setVariants([]);
    setSelectedVariants([]); setDesignFile(null); setDesignPreview(null); setUploadedDesignUrl(null);
    setPrintifyMockups([]); setIsGeneratingMockups(false); setMockupProductId(null); setMockupShopId(null);
    setProductTitle(""); setProductDescription(""); setSellingPrice(0); setBaseCost(0);
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const userXP = userData?.progress?.xp || 0;
  const canPublish = userXP >= MIN_XP_TO_PUBLISH;

  // CONTINUED IN NEXT EDIT - Component render functions
  return (
    <div className="min-h-full">
      {/* Main content will be rendered here */}
      <PODPanelContent
        activeTab={activeTab} setActiveTab={setActiveTab} isLoading={isLoading} products={products}
        stats={stats} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter}
        setStatusFilter={setStatusFilter} selectedProduct={selectedProduct} setSelectedProduct={setSelectedProduct}
        editingProduct={editingProduct} setEditingProduct={setEditingProduct} createStep={createStep} setCreateStep={setCreateStep}
        blueprintSearch={blueprintSearch} setBlueprintSearch={setBlueprintSearch} selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory} blueprints={blueprints} selectedBlueprint={selectedBlueprint}
        setSelectedBlueprint={setSelectedBlueprint} providers={providers} selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider} variants={variants} selectedVariants={selectedVariants}
        setSelectedVariants={setSelectedVariants} designPreview={designPreview} setDesignPreview={setDesignPreview} productTitle={productTitle}
        setProductTitle={setProductTitle} productDescription={productDescription} setProductDescription={setProductDescription}
        sellingPrice={sellingPrice} setSellingPrice={setSellingPrice} baseCost={baseCost} setBaseCost={setBaseCost}
        isCreating={isCreating} isFetchingBlueprints={isFetchingBlueprints} isFetchingProviders={isFetchingProviders}
        isFetchingVariants={isFetchingVariants} fileInputRef={fileInputRef} handleFileSelect={handleFileSelect}
        fetchBlueprints={fetchBlueprints} fetchProviders={fetchProviders} fetchVariants={fetchVariants}
        createProduct={createProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} publishProduct={publishProduct}
        resetCreateWizard={resetCreateWizard} formatCurrency={formatCurrency} userXP={userXP} canPublish={canPublish}
        printifyMockups={printifyMockups} isGeneratingMockups={isGeneratingMockups} generatePrintifyMockups={generatePrintifyMockups}
        uploadDesign={uploadDesign} uploadedDesignUrl={uploadedDesignUrl} setUploadedDesignUrl={setUploadedDesignUrl}
      />
    </div>
  );
}

// Separate content component for cleaner organization
function PODPanelContent(props: {
  activeTab: string; setActiveTab: (t: "products" | "create") => void; isLoading: boolean; products: PODProduct[];
  stats: { total: number; active: number; draft: number; totalSales: number; totalRevenue: number } | null;
  searchQuery: string; setSearchQuery: (s: string) => void; statusFilter: string; setStatusFilter: (s: string) => void;
  selectedProduct: PODProduct | null; setSelectedProduct: (p: PODProduct | null) => void;
  editingProduct: PODProduct | null; setEditingProduct: (p: PODProduct | null) => void;
  createStep: number; setCreateStep: (n: number) => void; blueprintSearch: string; setBlueprintSearch: (s: string) => void;
  selectedCategory: string | null; setSelectedCategory: (c: string | null) => void; blueprints: PrintifyBlueprint[];
  selectedBlueprint: PrintifyBlueprint | null; setSelectedBlueprint: (b: PrintifyBlueprint | null) => void;
  providers: PrintifyProvider[]; selectedProvider: PrintifyProvider | null; setSelectedProvider: (p: PrintifyProvider | null) => void;
  variants: PrintifyVariant[]; selectedVariants: number[]; setSelectedVariants: (v: number[]) => void;
  designPreview: string | null; setDesignPreview: (s: string | null) => void; productTitle: string; setProductTitle: (s: string) => void;
  productDescription: string; setProductDescription: (s: string) => void; sellingPrice: number; setSellingPrice: (n: number) => void;
  baseCost: number; setBaseCost: (n: number) => void; isCreating: boolean; isFetchingBlueprints: boolean;
  isFetchingProviders: boolean; isFetchingVariants: boolean; fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchBlueprints: (c?: string, s?: string) => void; fetchProviders: (id: number) => void;
  fetchVariants: (bId: number, pId: number) => void; createProduct: (p: boolean) => void;
  updateProduct: (id: string, u: Partial<PODProduct>) => void; deleteProduct: (id: string) => void;
  publishProduct: (id: string) => void; resetCreateWizard: () => void; formatCurrency: (v: number) => string;
  userXP: number; canPublish: boolean;
  printifyMockups: { src: string; variantIds: number[]; position: string; isDefault: boolean }[];
  isGeneratingMockups: boolean; generatePrintifyMockups: (designUrl: string) => Promise<void>;
  uploadDesign: () => Promise<string | null>; uploadedDesignUrl: string | null; setUploadedDesignUrl: (url: string | null) => void;
}) {
  const { activeTab, setActiveTab, isLoading, products, stats, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    selectedProduct, setSelectedProduct, editingProduct, setEditingProduct, createStep, setCreateStep,
    blueprintSearch, setBlueprintSearch, selectedCategory, setSelectedCategory, blueprints, selectedBlueprint,
    setSelectedBlueprint, providers, selectedProvider, setSelectedProvider, variants, selectedVariants, setSelectedVariants,
    designPreview, setDesignPreview, productTitle, setProductTitle, productDescription, setProductDescription, sellingPrice, setSellingPrice,
    baseCost, setBaseCost, isCreating, isFetchingBlueprints, isFetchingProviders, isFetchingVariants, fileInputRef,
    handleFileSelect, fetchBlueprints, fetchProviders, fetchVariants, createProduct, updateProduct, deleteProduct,
    publishProduct, resetCreateWizard, formatCurrency, userXP, canPublish,
    printifyMockups, isGeneratingMockups, generatePrintifyMockups, uploadDesign, uploadedDesignUrl, setUploadedDesignUrl } = props;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="text-purple-400" />Minha Loja POD</h1>
          <p className="text-gray-400 text-sm">Crie produtos personalizados com Printify</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("border-gray-700", canPublish ? "text-green-400" : "text-yellow-400")}>
            <Trophy size={14} className="mr-1" />{userXP} XP {!canPublish && `/ ${MIN_XP_TO_PUBLISH}`}
          </Badge>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setActiveTab("create"); resetCreateWizard(); }}>
            <Plus size={16} className="mr-2" />Criar Produto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2", activeTab === "products" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => setActiveTab("products")}>
          <Package size={16} className="mr-2" />Meus Produtos
        </Button>
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2", activeTab === "create" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => { setActiveTab("create"); if (blueprints.length === 0) fetchBlueprints(); }}>
          <Sparkles size={16} className="mr-2" />Criar Novo
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "products" && (
          <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
                <div className="flex items-center gap-3"><Package className="text-purple-400" size={24} /><div><p className="text-2xl font-bold">{stats?.total || 0}</p><p className="text-xs text-gray-400">Produtos</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 p-4">
                <div className="flex items-center gap-3"><CheckCircle className="text-green-400" size={24} /><div><p className="text-2xl font-bold">{stats?.active || 0}</p><p className="text-xs text-gray-400">Ativos</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
                <div className="flex items-center gap-3"><ShoppingBag className="text-blue-400" size={24} /><div><p className="text-2xl font-bold">{stats?.totalSales || 0}</p><p className="text-xs text-gray-400">Vendas</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-4">
                <div className="flex items-center gap-3"><DollarSign className="text-yellow-400" size={24} /><div><p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p><p className="text-xs text-gray-400">Receita</p></div></div>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><Input placeholder="Buscar..." className="pl-10 bg-white/5 border-gray-700" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-white/5 border-gray-700"><Filter size={16} className="mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  <SelectItem value="all">Todos</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="paused">Pausados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products */}
            {isLoading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
                  <ProductCard key={product._id} product={product} setSelectedProduct={setSelectedProduct} setEditingProduct={setEditingProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} publishProduct={publishProduct} canPublish={canPublish} formatCurrency={formatCurrency} />
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Package size={64} className="mx-auto mb-4 text-gray-600" /><h3 className="text-xl font-semibold mb-2">Nenhum produto</h3><p className="text-gray-400 mb-6">Crie seu primeiro produto!</p>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setActiveTab("create"); fetchBlueprints(); }}><Plus size={16} className="mr-2" />Criar Produto</Button>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === "create" && (
          <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CreateWizard
              step={createStep} setStep={setCreateStep} blueprintSearch={blueprintSearch} setBlueprintSearch={setBlueprintSearch}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} blueprints={blueprints}
              selectedBlueprint={selectedBlueprint} setSelectedBlueprint={setSelectedBlueprint} providers={providers}
              selectedProvider={selectedProvider} setSelectedProvider={setSelectedProvider} variants={variants}
              selectedVariants={selectedVariants} setSelectedVariants={setSelectedVariants} designPreview={designPreview} setDesignPreview={setDesignPreview}
              productTitle={productTitle} setProductTitle={setProductTitle} productDescription={productDescription}
              setProductDescription={setProductDescription} sellingPrice={sellingPrice} setSellingPrice={setSellingPrice}
              baseCost={baseCost} setBaseCost={setBaseCost} isCreating={isCreating} isFetchingBlueprints={isFetchingBlueprints}
              isFetchingProviders={isFetchingProviders} isFetchingVariants={isFetchingVariants} fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect} fetchBlueprints={fetchBlueprints} fetchProviders={fetchProviders}
              fetchVariants={fetchVariants} createProduct={createProduct} userXP={userXP} canPublish={canPublish} formatCurrency={formatCurrency}
              printifyMockups={printifyMockups} isGeneratingMockups={isGeneratingMockups} generatePrintifyMockups={generatePrintifyMockups}
              uploadDesign={uploadDesign} uploadedDesignUrl={uploadedDesignUrl} setUploadedDesignUrl={setUploadedDesignUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedProduct && <DetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} setEditingProduct={setEditingProduct} publishProduct={publishProduct} canPublish={canPublish} formatCurrency={formatCurrency} />}
        {editingProduct && <EditModal product={editingProduct} onClose={() => setEditingProduct(null)} updateProduct={updateProduct} />}
      </AnimatePresence>
    </>
  );
}

// Product Card Component
function ProductCard({ product, setSelectedProduct, setEditingProduct, updateProduct, deleteProduct, publishProduct, canPublish, formatCurrency }: {
  product: PODProduct; setSelectedProduct: (p: PODProduct) => void; setEditingProduct: (p: PODProduct) => void;
  updateProduct: (id: string, u: Partial<PODProduct>) => void; deleteProduct: (id: string) => void;
  publishProduct: (id: string) => void; canPublish: boolean; formatCurrency: (v: number) => string;
}) {
  const statusInfo = STATUS_CONFIG[product.status];
  const StatusIcon = statusInfo.icon;
  const CategoryIcon = CATEGORY_ICONS[product.category] || Package;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
        <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900">
          {product.primaryMockup ? <img src={product.primaryMockup} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><CategoryIcon size={48} className="text-gray-600" /></div>}
          <Badge className={cn("absolute top-2 left-2", statusInfo.color, "text-white")}><StatusIcon size={12} className="mr-1" />{statusInfo.label}</Badge>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" className="h-8 w-8"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                <DropdownMenuItem onClick={() => setSelectedProduct(product)}><Eye size={14} className="mr-2" />Ver</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingProduct(product)}><Edit size={14} className="mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                {product.status === "draft" && <DropdownMenuItem onClick={() => publishProduct(product._id)} className={!canPublish ? "opacity-50" : ""}><Send size={14} className="mr-2" />{canPublish ? "Publicar" : `${MIN_XP_TO_PUBLISH} XP`}</DropdownMenuItem>}
                {product.status === "active" && <DropdownMenuItem onClick={() => updateProduct(product._id, { status: "paused" })}><Pause size={14} className="mr-2" />Pausar</DropdownMenuItem>}
                {product.status === "paused" && <DropdownMenuItem onClick={() => updateProduct(product._id, { status: "active" })}><Play size={14} className="mr-2" />Reativar</DropdownMenuItem>}
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem onClick={() => deleteProduct(product._id)} className="text-red-400"><Trash2 size={14} className="mr-2" />Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold truncate">{product.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-400">{formatCurrency(product.suggestedPrice)}</span>
            <span className="text-xs text-gray-500">Custo: {formatCurrency(product.baseCost)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
            <span><Eye size={12} className="inline mr-1" />{product.views}</span>
            <span><ShoppingBag size={12} className="inline mr-1" />{product.sales}</span>
            <span><Star size={12} className="inline mr-1" />{product.rating.toFixed(1)}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Pagination constants
const ITEMS_PER_PAGE = 8;

// Create Wizard Component
function CreateWizard(props: {
  step: number; setStep: (n: number) => void; blueprintSearch: string; setBlueprintSearch: (s: string) => void;
  selectedCategory: string | null; setSelectedCategory: (c: string | null) => void; blueprints: PrintifyBlueprint[];
  selectedBlueprint: PrintifyBlueprint | null; setSelectedBlueprint: (b: PrintifyBlueprint | null) => void;
  providers: PrintifyProvider[]; selectedProvider: PrintifyProvider | null; setSelectedProvider: (p: PrintifyProvider | null) => void;
  variants: PrintifyVariant[]; selectedVariants: number[]; setSelectedVariants: (v: number[]) => void;
  designPreview: string | null; setDesignPreview: (s: string | null) => void; productTitle: string; setProductTitle: (s: string) => void;
  productDescription: string; setProductDescription: (s: string) => void; sellingPrice: number; setSellingPrice: (n: number) => void;
  baseCost: number; setBaseCost: (n: number) => void; isCreating: boolean; isFetchingBlueprints: boolean;
  isFetchingProviders: boolean; isFetchingVariants: boolean; fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; fetchBlueprints: (c?: string, s?: string) => void;
  fetchProviders: (id: number) => void; fetchVariants: (bId: number, pId: number) => void;
  createProduct: (p: boolean) => void; userXP: number; canPublish: boolean; formatCurrency: (v: number) => string;
  printifyMockups: { src: string; variantIds: number[]; position: string; isDefault: boolean }[];
  isGeneratingMockups: boolean; generatePrintifyMockups: (designUrl: string) => Promise<void>;
  uploadDesign: () => Promise<string | null>; uploadedDesignUrl: string | null; setUploadedDesignUrl: (url: string | null) => void;
}) {
  const { step, setStep, blueprintSearch, setBlueprintSearch, selectedCategory, setSelectedCategory, blueprints,
    selectedBlueprint, setSelectedBlueprint, providers, selectedProvider, setSelectedProvider, variants,
    selectedVariants, setSelectedVariants, designPreview, setDesignPreview, productTitle, setProductTitle, productDescription,
    setProductDescription, sellingPrice, setSellingPrice, baseCost, setBaseCost, isCreating, isFetchingBlueprints,
    isFetchingProviders, isFetchingVariants, fileInputRef, handleFileSelect, fetchBlueprints, fetchProviders,
    fetchVariants, createProduct, userXP, canPublish, formatCurrency,
    printifyMockups, isGeneratingMockups, generatePrintifyMockups, uploadDesign, uploadedDesignUrl, setUploadedDesignUrl } = props;

  // Pagination state for blueprints
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(blueprints.length / ITEMS_PER_PAGE);
  const paginatedBlueprints = blueprints.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  // Reset page when category/search changes
  useEffect(() => { setCurrentPage(0); }, [selectedCategory, blueprintSearch]);

  // Gallery state for Step 3 - MUST be at top level, not conditional
  const [designTab, setDesignTab] = useState<'upload' | 'creations' | 'uploads' | 'public'>('upload');
  const [galleryImages, setGalleryImages] = useState<{ _id: string; imageUrl: string; prompt: string; userName?: string; likes?: number }[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [selectedProductImageIndex, setSelectedProductImageIndex] = useState(0);

  // Reset selected image when blueprint changes
  useEffect(() => {
    setSelectedProductImageIndex(0);
  }, [selectedBlueprint?.id]);

  // Fetch gallery images
  const fetchGalleryImages = useCallback(async (type: string) => {
    setIsLoadingGallery(true);
    try {
      const token = localStorage.getItem('fayapoint_token');
      const res = await fetch(`/api/gallery?type=${type}&limit=12`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data.images || []);
      }
    } catch (e) { console.error('Gallery fetch error:', e); }
    finally { setIsLoadingGallery(false); }
  }, []);

  // Fetch gallery when tab changes
  useEffect(() => {
    if (step === 3 && designTab !== 'upload') {
      const typeMap: Record<string, string> = {
        'creations': 'my-creations',
        'uploads': 'my-uploads',
        'public': 'public'
      };
      fetchGalleryImages(typeMap[designTab] || designTab);
    }
  }, [step, designTab, fetchGalleryImages]);

  if (step === 1) {
    return (
      <div className="relative pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Escolha o Produto Base</h2>
          <p className="text-gray-400">Selecione o tipo de produto que deseja criar</p>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar produtos..." 
              className="pl-10 bg-white/5 border-gray-700" 
              value={blueprintSearch} 
              onChange={(e) => setBlueprintSearch(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && fetchBlueprints(selectedCategory || undefined, blueprintSearch)} 
            />
          </div>
          <Button variant="outline" className="border-gray-700" onClick={() => fetchBlueprints(selectedCategory || undefined, blueprintSearch)}>
            <Search size={16} className="mr-2" />Buscar
          </Button>
        </div>

        {/* Categories - Horizontal scroll on mobile */}
        <div className="flex gap-2 justify-start overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {BLUEPRINT_CATEGORIES.map((cat) => (
            <Button 
              key={cat.key} 
              variant={selectedCategory === cat.key ? "default" : "outline"} 
              size="sm" 
              className={cn(
                "shrink-0",
                selectedCategory === cat.key ? "bg-purple-600" : "border-gray-700"
              )} 
              onClick={() => { 
                setSelectedCategory(selectedCategory === cat.key ? null : cat.key); 
                fetchBlueprints(selectedCategory === cat.key ? undefined : cat.key); 
              }}
            >
              <cat.icon size={14} className="mr-1" />{cat.label}
            </Button>
          ))}
        </div>

        {/* Blueprints Grid with Pagination */}
        {isFetchingBlueprints ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-purple-500" size={40} />
          </div>
        ) : blueprints.length > 0 ? (
          <>
            {/* Pagination Info */}
            <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
              <span>Mostrando {currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, blueprints.length)} de {blueprints.length}</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 h-8 w-8 p-0" 
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="px-2">{currentPage + 1} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 h-8 w-8 p-0" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paginatedBlueprints.map((bp) => (
                <motion.div
                  key={bp.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className={cn(
                      "bg-white/5 border-white/10 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:border-purple-500/50", 
                      selectedBlueprint?.id === bp.id && "ring-2 ring-purple-500 border-purple-500"
                    )} 
                    onClick={() => { 
                      setSelectedBlueprint(bp); 
                      setProductTitle(bp.title); 
                      setProductDescription(bp.description); 
                    }}
                  >
                    <div className="aspect-square bg-gray-800 relative overflow-hidden">
                      {bp.images?.[0] ? (
                        <img 
                          src={bp.images[0]} 
                          alt={bp.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-gray-600" />
                        </div>
                      )}
                      {selectedBlueprint?.id === bp.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate">{bp.title}</h4>
                      <p className="text-xs text-gray-400 truncate">{bp.brand}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      currentPage === i ? "bg-purple-500 w-6" : "bg-gray-600 hover:bg-gray-500"
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-400 mb-4">Tente outra categoria ou termo de busca</p>
            <Button onClick={() => fetchBlueprints()}>Carregar Catálogo</Button>
          </Card>
        )}

        {/* Sticky Bottom Bar */}
        <AnimatePresence>
          {selectedBlueprint && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4 z-30"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                    {selectedBlueprint.images?.[0] && (
                      <img src={selectedBlueprint.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{selectedBlueprint.title}</p>
                    <p className="text-xs text-gray-400">{selectedBlueprint.brand}</p>
                  </div>
                </div>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 shrink-0" 
                  onClick={() => { setStep(2); fetchProviders(selectedBlueprint.id); }}
                >
                  Próximo: Fornecedor
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft size={16} className="mr-2" />Voltar</Button>
        <div className="text-center"><h2 className="text-2xl font-bold mb-2">Escolha o Fornecedor</h2><p className="text-gray-400">Quem produzirá seu {selectedBlueprint?.title}</p></div>
        {isFetchingProviders ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
        : providers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {providers.map((p) => (<Card key={p.id} className={cn("bg-white/5 border-white/10 p-4 cursor-pointer transition-all hover:border-purple-500/50", selectedProvider?.id === p.id && "ring-2 ring-purple-500")} onClick={() => setSelectedProvider(p)}><h4 className="font-semibold mb-2">{p.title}</h4><p className="text-sm text-gray-400 flex items-center gap-1"><Globe size={14} />{p.location?.country || "Global"}</p></Card>))}
          </div>
        ) : <Card className="bg-white/5 border-white/10 p-12 text-center"><AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" /><h3 className="text-lg font-semibold">Nenhum fornecedor</h3></Card>}
        {selectedProvider && <div className="flex justify-center"><Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setStep(3); fetchVariants(selectedBlueprint!.id, selectedProvider.id); }}>Próximo: Upload<ArrowRight size={16} className="ml-2" /></Button></div>}
      </div>
    );
  }

  // Helper function for gallery image selection (moved from conditional block)
  const selectGalleryImage = (imageUrl: string) => {
    setDesignPreview(imageUrl);
    setUploadedDesignUrl(imageUrl); // Already uploaded, so set URL directly
    toast.success('Design selecionado!');
  };

  if (step === 3) {
    return (
      <div className="space-y-6 pb-24">
        <Button variant="ghost" onClick={() => setStep(2)}><ChevronLeft size={16} className="mr-2" />Voltar</Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Escolha seu Design</h2>
          <p className="text-gray-400">Faça upload, use suas criações ou escolha da galeria pública</p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Design Selection */}
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                {[
                  { id: 'upload', label: 'Upload', icon: Upload },
                  { id: 'creations', label: 'Minhas Criações', icon: Sparkles },
                  { id: 'uploads', label: 'Meus Uploads', icon: ImageIcon },
                  { id: 'public', label: 'Galeria', icon: Globe },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDesignTab(tab.id as typeof designTab)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all",
                      designTab === tab.id 
                        ? "bg-purple-600 text-white" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Upload Tab */}
              {designTab === 'upload' && (
                <Card 
                  className={cn(
                    "bg-white/5 border-white/10 border-dashed p-8 text-center cursor-pointer transition-all hover:border-purple-500/50", 
                    designPreview && "border-green-500/50 border-solid"
                  )} 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFileSelect} />
                  {designPreview ? (
                    <div className="space-y-4">
                      <img src={designPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
                      <p className="text-green-400 flex items-center justify-center gap-2">
                        <CheckCircle size={16} />Design carregado!
                      </p>
                      <Button variant="outline" size="sm" className="border-gray-600">
                        <ImageIcon size={14} className="mr-2" />Trocar imagem
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload size={48} className="mx-auto mb-4 text-purple-400" />
                      <h3 className="font-semibold mb-2">Arraste seu design aqui</h3>
                      <p className="text-sm text-gray-400 mb-4">PNG, JPG, SVG até 50MB</p>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <ImageIcon size={16} className="mr-2" />Escolher Arquivo
                      </Button>
                    </>
                  )}
                </Card>
              )}

              {/* Gallery Tabs (Creations, Uploads, Public) */}
              {designTab !== 'upload' && (
                <div className="space-y-3">
                  {isLoadingGallery ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-purple-500" size={32} />
                    </div>
                  ) : galleryImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1">
                      {galleryImages.map((img) => (
                        <motion.div
                          key={img._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden cursor-pointer relative group border-2 transition-all",
                            designPreview === img.imageUrl 
                              ? "border-purple-500 ring-2 ring-purple-500/50" 
                              : "border-transparent hover:border-purple-500/50"
                          )}
                          onClick={() => selectGalleryImage(img.imageUrl)}
                        >
                          <img 
                            src={img.imageUrl} 
                            alt={img.prompt} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                            <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                            {designTab === 'public' && img.userName && (
                              <p className="text-xs text-gray-400 mt-1">por {img.userName}</p>
                            )}
                          </div>
                          {/* Selection indicator */}
                          {designPreview === img.imageUrl && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <CheckCircle size={12} className="text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-white/5 border-white/10 p-8 text-center">
                      <ImageIcon size={40} className="mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-400 mb-2">
                        {designTab === 'creations' && "Nenhuma criação encontrada"}
                        {designTab === 'uploads' && "Nenhum upload encontrado"}
                        {designTab === 'public' && "Galeria vazia"}
                      </p>
                      {designTab === 'creations' && (
                        <p className="text-sm text-gray-500">Crie imagens no Studio AI para usar aqui</p>
                      )}
                    </Card>
                  )}
                </div>
              )}
              
              {/* Variants & Pricing */}
              <div className="mt-4 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package size={18} className="text-purple-400" />
                  Variantes Disponíveis
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-white/5 rounded-lg p-3">
                  {isFetchingVariants ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="animate-spin text-purple-500" />
                    </div>
                  ) : variants.filter(v => v.is_available !== false).slice(0, 10).map((v) => (
                    <label key={v.id} className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                      selectedVariants.includes(v.id) ? "bg-purple-500/20 border border-purple-500/50" : "bg-white/5 hover:bg-white/10"
                    )}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={selectedVariants.includes(v.id)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVariants([...selectedVariants, v.id]);
                            } else {
                              setSelectedVariants(selectedVariants.filter(id => id !== v.id));
                            }
                          }} 
                          className="rounded border-gray-600 text-purple-500" 
                        />
                        <span className="text-sm">{v.title}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Pricing Summary Card */}
                {selectedVariants.length > 0 && (
                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 p-4">
                    <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <DollarSign size={16} className="text-green-400" />
                      Resumo do Preço
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Custo base (Printify)</span>
                        <span>{formatCurrency(baseCost)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Frete estimado (Brasil)</span>
                        <span>Incluso</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Sua margem ({MARGIN_PERCENTAGE}%)</span>
                        <span className="text-green-400">+{formatCurrency(sellingPrice - baseCost)}</span>
                      </div>
                      <div className="h-px bg-gray-700 my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Preço de Venda</span>
                        <span className="text-green-400">{formatCurrency(sellingPrice)}</span>
                      </div>
                    </div>
                    
                    {/* Delivery Info */}
                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-400">
                      <Truck size={14} />
                      <span>Entrega: {BRAZIL_SHIPPING_DAYS.min}-{BRAZIL_SHIPPING_DAYS.max} dias úteis para o Brasil</span>
                    </div>
                    
                    {/* Profit Highlight */}
                    <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center">
                      <p className="text-xs text-gray-400">Seu lucro por venda</p>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(sellingPrice - baseCost)}</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Right: Mockup Preview */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                Preview do Produto
              </h4>
              {selectedBlueprint && (
                <div className="space-y-4">
                  {/* Main Mockup - Show Printify mockups if available */}
                  {printifyMockups.length > 0 ? (
                    <div className="aspect-square w-full rounded-xl overflow-hidden bg-white">
                      <img 
                        src={printifyMockups[selectedProductImageIndex]?.src || printifyMockups[0]?.src} 
                        alt="Printify Mockup" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : isGeneratingMockups ? (
                    <div className="aspect-square w-full rounded-xl bg-gray-800 flex flex-col items-center justify-center">
                      <Loader2 className="animate-spin text-purple-500 mb-3" size={48} />
                      <p className="text-purple-400 font-medium">Gerando mockups profissionais...</p>
                      <p className="text-xs text-gray-500 mt-1">Printify está processando seu design</p>
                    </div>
                  ) : (
                    <MockupPreview 
                      productImage={selectedBlueprint.images[selectedProductImageIndex] || selectedBlueprint.images[0]} 
                      designImage={designPreview}
                      productTitle={selectedBlueprint.title}
                      className="aspect-square w-full"
                    />
                  )}
                  
                  {/* Generate Mockups Button */}
                  {designPreview && selectedVariants.length > 0 && printifyMockups.length === 0 && !isGeneratingMockups && (
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={async () => {
                        let url = uploadedDesignUrl;
                        if (!url) {
                          toast.loading("Fazendo upload...");
                          url = await uploadDesign();
                          if (url) setUploadedDesignUrl(url);
                          toast.dismiss();
                        }
                        if (url) {
                          generatePrintifyMockups(url);
                        } else {
                          toast.error("Erro no upload do design");
                        }
                      }}
                    >
                      <Sparkles size={16} className="mr-2" />
                      Gerar Mockups Profissionais
                    </Button>
                  )}
                  
                  {/* Info Card */}
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h5 className="font-semibold mb-1">{selectedBlueprint.title}</h5>
                    <p className="text-sm text-gray-400 mb-3">{selectedBlueprint.brand}</p>
                    
                    {printifyMockups.length > 0 ? (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle size={16} />
                        <span>Mockups profissionais gerados pelo Printify!</span>
                      </div>
                    ) : designPreview ? (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle size={16} />
                        <span>Clique em &quot;Gerar Mockups&quot; para ver resultado real</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <AlertCircle size={16} />
                        <span>Faça upload do seu design para começar</span>
                      </div>
                    )}
                  </Card>
                  
                  {/* Printify Mockup Thumbnails */}
                  {printifyMockups.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Mockups gerados ({printifyMockups.length}):</p>
                      <div className="grid grid-cols-4 gap-2">
                        {printifyMockups.slice(0, 8).map((mockup, idx) => (
                          <motion.div 
                            key={idx} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedProductImageIndex(idx)}
                            className={cn(
                              "aspect-square bg-white rounded-lg overflow-hidden cursor-pointer transition-all border-2",
                              selectedProductImageIndex === idx 
                                ? "border-purple-500 ring-2 ring-purple-500/50" 
                                : "border-transparent opacity-70 hover:opacity-100"
                            )}
                          >
                            <img src={mockup.src} alt={`Mockup ${idx + 1}`} className="w-full h-full object-contain" loading="lazy" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Fallback to product images if no printify mockups */}
                  {printifyMockups.length === 0 && selectedBlueprint.images.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Imagens do produto:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedBlueprint.images.slice(0, 4).map((img, idx) => (
                          <motion.div 
                            key={idx} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedProductImageIndex(idx)}
                            className={cn(
                              "aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all border-2",
                              selectedProductImageIndex === idx 
                                ? "border-purple-500 opacity-100 ring-2 ring-purple-500/50" 
                                : "border-transparent opacity-70 hover:opacity-100"
                            )}
                          >
                            <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sticky Bottom Bar */}
        <AnimatePresence>
          {designPreview && selectedVariants.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4 z-30"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white overflow-hidden">
                    {printifyMockups.length > 0 ? (
                      <img src={printifyMockups[0].src} alt="Mockup" className="w-full h-full object-contain" />
                    ) : (
                      <MockupPreview productImage={selectedBlueprint?.images[0] || ''} designImage={designPreview} productTitle={selectedBlueprint?.title || ''} className="w-full h-full" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedVariants.length} variante(s)</p>
                    <p className="text-xs text-gray-400">{printifyMockups.length > 0 ? 'Mockups prontos!' : 'Pronto para configurar preços'}</p>
                  </div>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setStep(4)}>
                  Próximo: Preços
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Step 4: Pricing & Final Review
  return (
    <div className="space-y-6 pb-24">
      <Button variant="ghost" onClick={() => setStep(3)}><ChevronLeft size={16} className="mr-2" />Voltar</Button>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Finalize Seu Produto</h2>
        <p className="text-gray-400">Configure título, descrição e preço de venda</p>
      </div>
      
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: Mockup Preview (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              Seu Produto Final
            </h4>
            
            {/* Main Mockup - Use Printify mockups if available */}
            {selectedBlueprint && (
              printifyMockups.length > 0 ? (
                <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl bg-white">
                  <img 
                    src={printifyMockups.find(m => m.isDefault)?.src || printifyMockups[0]?.src} 
                    alt="Product Mockup" 
                    className="w-full h-full object-contain"
                  />
                  <Badge className="absolute bottom-3 right-3 bg-green-600">
                    <CheckCircle size={12} className="mr-1" />
                    Mockup
                  </Badge>
                </div>
              ) : (
                <MockupPreview 
                  productImage={selectedBlueprint.images[0]} 
                  designImage={designPreview}
                  productTitle={selectedBlueprint.title}
                  className="aspect-square w-full rounded-xl shadow-2xl"
                />
              )
            )}
            
            {/* Product Summary */}
            <Card className="bg-white/5 border-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package size={14} className="text-gray-400" />
                <span className="text-gray-400">Produto:</span>
                <span className="font-medium">{selectedBlueprint?.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe size={14} className="text-gray-400" />
                <span className="text-gray-400">Fornecedor:</span>
                <span className="font-medium">{selectedProvider?.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shirt size={14} className="text-gray-400" />
                <span className="text-gray-400">Variantes:</span>
                <span className="font-medium">{selectedVariants.length} selecionada(s)</span>
              </div>
            </Card>
          </div>
          
          {/* Right: Form (3 cols) */}
          <div className="md:col-span-3 space-y-6">
            {/* Product Highlights */}
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star size={18} className="text-purple-400" />
                  </div>
                  <p className="text-sm font-medium">Qualidade Premium</p>
                  <p className="text-xs text-gray-500">Material de alta qualidade</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Truck size={18} className="text-green-400" />
                  </div>
                  <p className="text-sm font-medium">{BRAZIL_SHIPPING_DAYS.min}-{BRAZIL_SHIPPING_DAYS.max} dias</p>
                  <p className="text-xs text-gray-500">Entrega para Brasil</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle size={18} className="text-blue-400" />
                  </div>
                  <p className="text-sm font-medium">Sob Demanda</p>
                  <p className="text-xs text-gray-500">Feito quando vendido</p>
                </div>
              </div>
            </Card>
            
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">Título do Produto</Label>
                <Input 
                  value={productTitle} 
                  onChange={(e) => setProductTitle(e.target.value)} 
                  className="bg-white/5 border-gray-700 h-12 text-lg" 
                  placeholder="Ex: Camiseta Design Exclusivo" 
                />
              </div>
              <div>
                <Label className="text-base font-semibold mb-2 block">Descrição</Label>
                <Textarea 
                  value={productDescription} 
                  onChange={(e) => setProductDescription(e.target.value)} 
                  className="bg-white/5 border-gray-700" 
                  rows={4} 
                  placeholder="Descreva seu produto..."
                />
              </div>
            </div>
            
            {/* Pricing Card */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/30 p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-lg">
                <DollarSign size={20} className="text-green-400" />
                Definir Preços
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 text-sm">Custo Base (R$)</Label>
                  <Input 
                    type="number" 
                    value={baseCost} 
                    onChange={(e) => setBaseCost(parseFloat(e.target.value) || 0)} 
                    className="bg-white/5 border-gray-700 h-12 text-lg font-semibold" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Custo de produção</p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm">Preço Venda (R$)</Label>
                  <Input 
                    type="number" 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)} 
                    className="bg-white/5 border-gray-700 h-12 text-lg font-semibold" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Preço para cliente</p>
                </div>
              </div>
              
              {/* Profit Display */}
              {sellingPrice > baseCost && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/20 border border-green-500/40 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-green-400 font-bold text-2xl">{formatCurrency(sellingPrice - baseCost)}</p>
                    <p className="text-green-400/80 text-sm">Lucro por venda</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-xl">{((sellingPrice - baseCost) / sellingPrice * 100).toFixed(0)}%</p>
                    <p className="text-green-400/80 text-sm">Margem</p>
                  </div>
                </motion.div>
              )}
            </Card>
            
            {/* XP Status Card */}
            <Card className={cn(
              "border p-4 flex items-center gap-4",
              canPublish ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
            )}>
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                canPublish ? "bg-green-500/20" : "bg-yellow-500/20"
              )}>
                {canPublish ? <Trophy className="text-green-400" size={24} /> : <Lock className="text-yellow-400" size={24} />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{canPublish ? "Você pode publicar!" : "XP Necessário para Publicar"}</h4>
                <p className="text-sm text-gray-400">
                  {canPublish 
                    ? `Você tem ${userXP} XP (mínimo: ${MIN_XP_TO_PUBLISH})`
                    : `Seu XP: ${userXP} / ${MIN_XP_TO_PUBLISH} necessário`
                  }
                </p>
              </div>
              {!canPublish && (
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">{MIN_XP_TO_PUBLISH - userXP}</p>
                  <p className="text-xs text-gray-400">XP faltando</p>
                </div>
              )}
            </Card>
            
            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 border-gray-700" 
                onClick={() => createProduct(false)} 
                disabled={isCreating || !productTitle}
              >
                {isCreating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                Salvar Rascunho
              </Button>
              <Button 
                className={cn(
                  "flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700", 
                  !canPublish && "opacity-50 cursor-not-allowed"
                )} 
                onClick={() => createProduct(true)} 
                disabled={isCreating || !canPublish || !productTitle || sellingPrice <= baseCost}
              >
                {isCreating ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                {canPublish ? "Publicar Produto" : `Precisa ${MIN_XP_TO_PUBLISH} XP`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Detail Modal
function DetailModal({ product, onClose, setEditingProduct, publishProduct, canPublish, formatCurrency }: {
  product: PODProduct; onClose: () => void; setEditingProduct: (p: PODProduct) => void;
  publishProduct: (id: string) => void; canPublish: boolean; formatCurrency: (v: number) => string;
}) {
  const statusInfo = STATUS_CONFIG[product.status];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">{product.primaryMockup ? <img src={product.primaryMockup} alt="" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Package size={64} className="text-gray-600" /></div>}</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><Badge className={cn(statusInfo.color, "text-white")}>{statusInfo.label}</Badge><Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button></div>
            <h2 className="text-2xl font-bold">{product.title}</h2>
            <p className="text-gray-400">{product.description}</p>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between"><span className="text-gray-400">Venda</span><span className="text-xl font-bold text-green-400">{formatCurrency(product.suggestedPrice)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Custo</span><span>{formatCurrency(product.baseCost)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Lucro</span><span className="text-purple-400">{formatCurrency(product.suggestedPrice - product.baseCost)}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="bg-white/5 p-3"><Eye size={20} className="mx-auto mb-1 text-blue-400" /><p className="font-bold">{product.views}</p><p className="text-xs text-gray-500">Views</p></Card>
              <Card className="bg-white/5 p-3"><ShoppingBag size={20} className="mx-auto mb-1 text-green-400" /><p className="font-bold">{product.sales}</p><p className="text-xs text-gray-500">Vendas</p></Card>
              <Card className="bg-white/5 p-3"><DollarSign size={20} className="mx-auto mb-1 text-yellow-400" /><p className="font-bold">{formatCurrency(product.revenue)}</p><p className="text-xs text-gray-500">Receita</p></Card>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => { setEditingProduct(product); onClose(); }}><Edit size={16} className="mr-2" />Editar</Button>
              {product.status === "draft" && canPublish && <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { publishProduct(product._id); onClose(); }}><Send size={16} className="mr-2" />Publicar</Button>}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Edit Modal
function EditModal({ product, onClose, updateProduct }: { product: PODProduct; onClose: () => void; updateProduct: (id: string, u: Partial<PODProduct>) => void }) {
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.suggestedPrice);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Editar Produto</h2><Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button></div>
        <div className="space-y-4">
          <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-gray-700" /></div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/5 border-gray-700" rows={3} /></div>
          <div><Label>Preço (R$)</Label><Input type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="bg-white/5 border-gray-700" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1 border-gray-700" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => updateProduct(product._id, { title, description, suggestedPrice: price })}>Salvar</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
