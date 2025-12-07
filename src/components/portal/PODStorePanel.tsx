"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Plus, Search, Filter, MoreVertical, Eye, Edit, Trash2, Play, Pause,
  Package, DollarSign, ShoppingBag, Sparkles, Shirt, Home, Frame, Coffee,
  Smartphone, Upload, Image as ImageIcon, CheckCircle, Clock, AlertCircle,
  ChevronRight, ChevronLeft, Globe, Loader2, X, Star, Lock, Trophy, ArrowRight, Save, Send, Truck, Settings,
  Receipt, TrendingUp, Wallet, CreditCard, ExternalLink, RefreshCw, Maximize2, Type, Layers, Wand2, Gem,
  QrCode, Copy, Share2, Tag, Hash, ToggleLeft, ToggleRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import dynamic from "next/dynamic";

// Lazy load components
const DesignEditor = dynamic(() => import("./DesignEditor"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
});
const PODDesignEditor = dynamic(() => import("./PODDesignEditor"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
});
const ProdigiStorePanel = dynamic(() => import("./ProdigiStorePanel"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
});

// Design settings interface for editor
interface DesignSettings {
  scale: number;
  x: number;
  y: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
}
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

// Mockup Gallery Component - Printify-style gallery with labeled thumbnails
function MockupGallery({ 
  mockups, 
  selectedIndex, 
  onSelectIndex,
  isLoading = false,
  onClose 
}: { 
  mockups: { src: string; variantIds?: number[]; position?: string; isDefault?: boolean }[];
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
  isLoading?: boolean;
  onClose?: () => void;
}) {
  // Generate labels for mockups based on position or index
  const getMockupLabel = (mockup: { position?: string; isDefault?: boolean }, index: number): string => {
    if (mockup.position) {
      // Parse Printify position format
      const pos = mockup.position.toLowerCase();
      if (pos.includes('front')) return `Frente ${index + 1}`;
      if (pos.includes('back')) return `Costas ${index + 1}`;
      if (pos.includes('left')) return `Esquerda ${index + 1}`;
      if (pos.includes('right')) return `Direita ${index + 1}`;
      return mockup.position;
    }
    
    // Generate descriptive labels based on common mockup patterns
    const labels = [
      'Pessoa 1 Frente', 'Pessoa 1 Costas', 'Pessoa 2 Frente', 'Pessoa 2 Costas',
      'Pessoa 3 Frente', 'Pessoa 3 Costas', 'Pessoa 4 Frente', 'Pessoa 4 Costas',
      'Lifestyle', 'Duo', 'Duo 2', 'Duo 3', 'Duo 4',
      'Pessoa 5 Frente', 'Pessoa 5 Costas', 'Pessoa 6 Frente', 'Pessoa 6 Costas',
      'Manga Esq', 'Manga Dir', 'Close-up', 'Detalhe'
    ];
    
    // If it's the default mockup, mark it
    if (mockup.isDefault) return 'Principal';
    
    return labels[index] || `Vista ${index + 1}`;
  };

  const handlePrev = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : mockups.length - 1;
    onSelectIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < mockups.length - 1 ? selectedIndex + 1 : 0;
    onSelectIndex(newIndex);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-xl">
        <Loader2 className="animate-spin text-purple-500 mb-3" size={48} />
        <p className="text-purple-400 font-medium">Gerando mockups profissionais...</p>
        <p className="text-xs text-gray-500 mt-1">Printify está processando seu design</p>
      </div>
    );
  }

  if (mockups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Gallery Layout */}
      <div className="flex gap-4">
        {/* Main Preview with Navigation */}
        <div className="flex-1 relative">
          <div className="aspect-square w-full rounded-xl overflow-hidden bg-white relative group">
            <img 
              src={mockups[selectedIndex]?.src} 
              alt={getMockupLabel(mockups[selectedIndex], selectedIndex)}
              className="w-full h-full object-contain"
            />
            
            {/* Navigation Arrows */}
            {mockups.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} className="text-gray-700" />
                </button>
              </>
            )}

            {/* Counter Badge */}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded text-xs text-white">
              {selectedIndex + 1} / {mockups.length}
            </div>

            {/* Fullscreen/Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
              >
                <X size={18} className="text-white" />
              </button>
            )}
          </div>

          {/* Current Mockup Label */}
          <p className="text-center text-sm text-gray-400 mt-2">
            {getMockupLabel(mockups[selectedIndex], selectedIndex)}
          </p>
        </div>

        {/* Thumbnails Grid - Scrollable */}
        {mockups.length > 1 && (
          <div className="w-48 shrink-0">
            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {mockups.map((mockup, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectIndex(idx)}
                  className={cn(
                    "cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                    selectedIndex === idx 
                      ? "border-purple-500 ring-2 ring-purple-500/30" 
                      : "border-gray-700 hover:border-gray-500"
                  )}
                >
                  <div className="aspect-square bg-white">
                    <img 
                      src={mockup.src} 
                      alt={getMockupLabel(mockup, idx)}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-2 py-1.5 bg-gray-800 text-xs text-gray-300 truncate">
                    {getMockupLabel(mockup, idx)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={16} />
          <span>{mockups.length} mockups profissionais gerados</span>
        </div>
        <Badge className="bg-purple-600">Printify</Badge>
      </div>
    </div>
  );
}

// Fullscreen Mockup Gallery Modal
function MockupGalleryModal({ 
  mockups, 
  initialIndex, 
  onClose 
}: { 
  mockups: { src: string; variantIds?: number[]; position?: string; isDefault?: boolean }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedIndex(i => i > 0 ? i - 1 : mockups.length - 1);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex(i => i < mockups.length - 1 ? i + 1 : 0);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mockups.length, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9 }} 
        animate={{ scale: 1 }}
        className="w-full max-w-6xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <MockupGallery 
          mockups={mockups}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          onClose={onClose}
        />
      </motion.div>
    </motion.div>
  );
}

interface PODProduct {
  _id: string; title: string; slug: string; description: string; category: string; templateId: string; templateName: string;
  baseProductType: string; designFiles: { url: string; width: number; height: number }[]; mockupImages: string[];
  primaryMockup?: string; variants: { id: string; name: string; sellingPrice: number; basePrice: number; providerVariantId?: string; sku?: string; isActive?: boolean; options?: Record<string, string> }[];
  baseCost: number; suggestedPrice: number; status: "draft" | "pending_review" | "active" | "paused" | "rejected" | "archived";
  isPublished: boolean; showInMarketplace?: boolean; showInUserStore?: boolean; 
  views: number; sales: number; revenue: number; rating: number; createdAt: string;
  providers?: { providerId: string; providerSlug: string; providerProductId?: string; syncStatus?: string; publishedUrl?: string }[];
  shortDescription?: string; tags?: string[];
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
  // POD Provider selection - Printify or Prodigi
  const [podProvider, setPodProvider] = useState<"printify" | "prodigi">("printify");
  const [activeTab, setActiveTab] = useState<"products" | "create" | "orders" | "earnings">("products");
  const [orders, setOrders] = useState<{ _id: string; orderNumber: string; status: string; createdAt: string; grandTotal: number; totalCreatorCommission: number; items: { title: string; quantity: number; mockupImage?: string }[] }[]>([]);
  const [orderStats, setOrderStats] = useState<{ total: number; pending: number; inProduction: number; shipped: number; delivered: number; totalRevenue: number; totalCommission: number } | null>(null);
  const [earningsData, setEarningsData] = useState<{ summary: { totalEarnings: number; pendingEarnings: number; paidEarnings: number; availableForPayout: number; totalSales: number; totalOrders: number; commissionRate: number; canRequestPayout: boolean; minPayoutAmount: number }; monthlyBreakdown: { month: string; commission: number }[] } | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
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
  const [showMockupGalleryModal, setShowMockupGalleryModal] = useState(false);
  // Design placement options
  const [designScale, setDesignScale] = useState<'small' | 'medium' | 'large' | 'fill'>('medium');
  const [designPosition, setDesignPosition] = useState<'top' | 'center' | 'bottom'>('center');
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

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/pod/orders", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setOrderStats(data.stats);
      }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao carregar pedidos"); }
    finally { setIsLoadingOrders(false); }
  }, []);

  // Fetch earnings
  const fetchEarnings = useCallback(async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsLoadingEarnings(true);
    try {
      const res = await fetch("/api/pod/earnings", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setEarningsData(data);
      }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao carregar ganhos"); }
    finally { setIsLoadingEarnings(false); }
  }, []);

  // Publish to store
  const publishToStore = useCallback(async (productId: string) => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    setIsPublishing(productId);
    try {
      const res = await fetch("/api/pod/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Produto publicado na loja!");
        fetchProducts();
        if (data.data?.storeUrl) {
          toast.success(`Disponível em: ${data.data.storeUrl}`, { duration: 5000 });
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao publicar");
      }
    } catch (e) { console.error("Error:", e); toast.error("Erro ao publicar"); }
    finally { setIsPublishing(null); }
  }, [fetchProducts]);

  useEffect(() => { fetchUserData(); fetchProducts(); }, [fetchUserData, fetchProducts]);
  useEffect(() => { if (activeTab === "create" && blueprints.length === 0) fetchBlueprints(); }, [activeTab, blueprints.length, fetchBlueprints]);
  useEffect(() => { if (activeTab === "orders") fetchOrders(); }, [activeTab, fetchOrders]);
  useEffect(() => { if (activeTab === "earnings") fetchEarnings(); }, [activeTab, fetchEarnings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) { toast.error("Use PNG, JPG ou SVG"); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error("Max 50MB"); return; }
    setDesignFile(file);
    setDesignPreview(URL.createObjectURL(file));
    setUploadedDesignUrl(null); // Clear uploaded URL to force re-upload
    // Clear existing mockups when new file is selected
    if (printifyMockups.length > 0) {
      setPrintifyMockups([]);
      toast("Novo design selecionado - gere novos mockups", { icon: "🎨" });
    }
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
    
    // Calculate scale factor based on user selection
    const scaleFactors = { small: 0.4, medium: 0.6, large: 0.8, fill: 1.0 };
    const scaleFactor = scaleFactors[designScale];
    
    // Calculate Y position based on user selection
    const positionY = { top: 0.3, center: 0.5, bottom: 0.7 };
    const yPosition = positionY[designPosition];
    
    console.log('[POD] Generating mockups - scale:', designScale, 'position:', designPosition);
    
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
          placeholderHeight,
          scaleFactor,
          yPosition
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
  }, [selectedBlueprint, selectedProvider, selectedVariants, variants, designScale, designPosition]);

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
          // Publish to Printify and create StoreProduct
          toast.loading("Publicando no Printify e na loja...");
          const publishRes = await fetch("/api/pod/publish", { 
            method: "POST", 
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
            body: JSON.stringify({ productId: data.product._id }) 
          });
          toast.dismiss();
          if (publishRes.ok) {
            const publishData = await publishRes.json();
            toast.success("Produto publicado na loja!", { duration: 5000 });
            if (publishData.data?.storeUrl) {
              toast.success(`URL: ${publishData.data.storeUrl}`, { duration: 8000 });
            }
          } else {
            const publishErr = await publishRes.json();
            toast.error(publishErr.error || "Erro ao publicar no Printify");
            // Still saved as draft
          }
        } else {
          toast.success("Salvo como rascunho!");
        }
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
    const token = localStorage.getItem("fayapoint_token");
    try {
      toast.loading("Publicando no Printify e na loja...");
      const res = await fetch("/api/pod/publish", { 
        method: "POST", 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, 
        body: JSON.stringify({ productId }) 
      });
      toast.dismiss();
      if (res.ok) {
        const data = await res.json();
        toast.success("Produto publicado na loja!", { duration: 5000 });
        if (data.data?.storeUrl) {
          toast.success(`URL: ${data.data.storeUrl}`, { duration: 8000 });
        }
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao publicar");
      }
    } catch (e) { console.error(e); toast.error("Erro ao publicar"); }
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
    <div className="min-h-full space-y-6">
      {/* POD Provider Selector */}
      <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
        <span className="text-sm text-gray-400 font-medium">Fornecedor:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPodProvider("printify")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              podProvider === "printify"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            <Shirt size={18} />
            <span className="font-medium">Printify</span>
            <Badge className="bg-green-500/20 text-green-300 text-xs">900+</Badge>
          </button>
          <button
            onClick={() => setPodProvider("prodigi")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              podProvider === "prodigi"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            <Frame size={18} />
            <span className="font-medium">Prodigi</span>
            <Badge className="bg-blue-500/20 text-blue-300 text-xs">PREMIUM</Badge>
          </button>
        </div>
        <div className="flex-1" />
        <div className="text-xs text-gray-500">
          {podProvider === "printify" ? (
            <span>Camisetas, canecas, almofadas e 900+ produtos</span>
          ) : (
            <span>Canvas, metal prints, fine art e wall art premium</span>
          )}
        </div>
      </div>

      {/* Conditional Content Based on Provider */}
      {podProvider === "prodigi" ? (
        <ProdigiStorePanel />
      ) : (
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
          designScale={designScale} setDesignScale={setDesignScale} designPosition={designPosition} setDesignPosition={setDesignPosition}
          orders={orders} orderStats={orderStats} isLoadingOrders={isLoadingOrders} fetchOrders={fetchOrders}
          earningsData={earningsData} isLoadingEarnings={isLoadingEarnings} fetchEarnings={fetchEarnings}
          publishToStore={publishToStore} isPublishing={isPublishing}
        />
      )}
    </div>
  );
}

// Separate content component for cleaner organization
function PODPanelContent(props: {
  activeTab: string; setActiveTab: (t: "products" | "create" | "orders" | "earnings") => void; isLoading: boolean; products: PODProduct[];
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
  designScale: 'small' | 'medium' | 'large' | 'fill'; setDesignScale: (s: 'small' | 'medium' | 'large' | 'fill') => void;
  designPosition: 'top' | 'center' | 'bottom'; setDesignPosition: (p: 'top' | 'center' | 'bottom') => void;
  orders: { _id: string; orderNumber: string; status: string; createdAt: string; grandTotal: number; totalCreatorCommission: number; items: { title: string; quantity: number; mockupImage?: string }[] }[];
  orderStats: { total: number; pending: number; inProduction: number; shipped: number; delivered: number; totalRevenue: number; totalCommission: number } | null;
  isLoadingOrders: boolean; fetchOrders: () => void;
  earningsData: { summary: { totalEarnings: number; pendingEarnings: number; paidEarnings: number; availableForPayout: number; totalSales: number; totalOrders: number; commissionRate: number; canRequestPayout: boolean; minPayoutAmount: number }; monthlyBreakdown: { month: string; commission: number }[] } | null;
  isLoadingEarnings: boolean; fetchEarnings: () => void;
  publishToStore: (id: string) => void; isPublishing: string | null;
}) {
  const { activeTab, setActiveTab, isLoading, products, stats, searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    selectedProduct, setSelectedProduct, editingProduct, setEditingProduct, createStep, setCreateStep,
    blueprintSearch, setBlueprintSearch, selectedCategory, setSelectedCategory, blueprints, selectedBlueprint,
    setSelectedBlueprint, providers, selectedProvider, setSelectedProvider, variants, selectedVariants, setSelectedVariants,
    designPreview, setDesignPreview, productTitle, setProductTitle, productDescription, setProductDescription, sellingPrice, setSellingPrice,
    baseCost, setBaseCost, isCreating, isFetchingBlueprints, isFetchingProviders, isFetchingVariants, fileInputRef,
    handleFileSelect, fetchBlueprints, fetchProviders, fetchVariants, createProduct, updateProduct, deleteProduct,
    publishProduct, resetCreateWizard, formatCurrency, userXP, canPublish,
    printifyMockups, isGeneratingMockups, generatePrintifyMockups, uploadDesign, uploadedDesignUrl, setUploadedDesignUrl,
    designScale, setDesignScale, designPosition, setDesignPosition,
    orders, orderStats, isLoadingOrders, fetchOrders, earningsData, isLoadingEarnings, fetchEarnings,
    publishToStore, isPublishing } = props;

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
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2 overflow-x-auto">
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2 shrink-0", activeTab === "products" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => setActiveTab("products")}>
          <Package size={16} className="mr-2" />Produtos
        </Button>
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2 shrink-0", activeTab === "create" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => { setActiveTab("create"); if (blueprints.length === 0) fetchBlueprints(); }}>
          <Sparkles size={16} className="mr-2" />Criar
        </Button>
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2 shrink-0", activeTab === "orders" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => setActiveTab("orders")}>
          <Receipt size={16} className="mr-2" />Pedidos
          {orderStats && orderStats.pending > 0 && <Badge className="ml-1.5 h-5 bg-orange-500">{orderStats.pending}</Badge>}
        </Button>
        <Button variant="ghost" size="sm" className={cn("rounded-none border-b-2 shrink-0", activeTab === "earnings" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400")} onClick={() => setActiveTab("earnings")}>
          <Wallet size={16} className="mr-2" />Ganhos
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
                  <ProductCard key={product._id} product={product} setSelectedProduct={setSelectedProduct} setEditingProduct={setEditingProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} publishProduct={publishProduct} canPublish={canPublish} formatCurrency={formatCurrency} publishToStore={publishToStore} isPublishing={isPublishing} />
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
              designScale={designScale} setDesignScale={setDesignScale} designPosition={designPosition} setDesignPosition={setDesignPosition}
            />
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500/30 p-4">
                <div className="flex items-center gap-3"><Clock className="text-orange-400" size={24} /><div><p className="text-2xl font-bold">{orderStats?.pending || 0}</p><p className="text-xs text-gray-400">Pendentes</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
                <div className="flex items-center gap-3"><Package className="text-blue-400" size={24} /><div><p className="text-2xl font-bold">{orderStats?.inProduction || 0}</p><p className="text-xs text-gray-400">Produção</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
                <div className="flex items-center gap-3"><Truck className="text-purple-400" size={24} /><div><p className="text-2xl font-bold">{orderStats?.shipped || 0}</p><p className="text-xs text-gray-400">Enviados</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 p-4">
                <div className="flex items-center gap-3"><CheckCircle className="text-green-400" size={24} /><div><p className="text-2xl font-bold">{orderStats?.delivered || 0}</p><p className="text-xs text-gray-400">Entregues</p></div></div>
              </Card>
            </div>

            {/* Orders List */}
            {isLoadingOrders ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order._id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {order.items[0]?.mockupImage ? (
                          <img src={order.items[0].mockupImage} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-800" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center"><Package className="text-gray-600" /></div>
                        )}
                        <div>
                          <p className="font-semibold">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-400">{order.items.map(i => `${i.title} x${i.quantity}`).join(', ')}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-green-400">{formatCurrency(order.totalCreatorCommission)}</p>
                          <p className="text-xs text-gray-400">Comissão</p>
                        </div>
                        <Badge className={cn(
                          order.status === 'delivered' && 'bg-green-600',
                          order.status === 'shipped' && 'bg-purple-600',
                          order.status === 'in_production' && 'bg-blue-600',
                          ['pending', 'confirmed', 'processing'].includes(order.status) && 'bg-orange-600',
                          ['cancelled', 'refunded'].includes(order.status) && 'bg-red-600',
                        )}>
                          {order.status === 'delivered' && 'Entregue'}
                          {order.status === 'shipped' && 'Enviado'}
                          {order.status === 'in_production' && 'Produção'}
                          {['pending', 'confirmed', 'processing'].includes(order.status) && 'Pendente'}
                          {['cancelled', 'refunded'].includes(order.status) && 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Receipt size={64} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h3>
                <p className="text-gray-400 mb-6">Quando seus produtos forem vendidos, os pedidos aparecerão aqui</p>
              </Card>
            )}

            <div className="flex justify-center mt-6">
              <Button variant="outline" className="border-gray-700" onClick={fetchOrders}>
                <RefreshCw size={16} className="mr-2" />Atualizar
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === "earnings" && (
          <motion.div key="earnings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Earnings Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 p-4">
                <div className="flex items-center gap-3"><DollarSign className="text-green-400" size={24} /><div><p className="text-2xl font-bold">{formatCurrency(earningsData?.summary.totalEarnings || 0)}</p><p className="text-xs text-gray-400">Total Ganho</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30 p-4">
                <div className="flex items-center gap-3"><Clock className="text-yellow-400" size={24} /><div><p className="text-2xl font-bold">{formatCurrency(earningsData?.summary.pendingEarnings || 0)}</p><p className="text-xs text-gray-400">Pendente</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 p-4">
                <div className="flex items-center gap-3"><CreditCard className="text-blue-400" size={24} /><div><p className="text-2xl font-bold">{formatCurrency(earningsData?.summary.paidEarnings || 0)}</p><p className="text-xs text-gray-400">Já Sacado</p></div></div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 p-4">
                <div className="flex items-center gap-3"><Wallet className="text-purple-400" size={24} /><div><p className="text-2xl font-bold">{formatCurrency(earningsData?.summary.availableForPayout || 0)}</p><p className="text-xs text-gray-400">Disponível</p></div></div>
              </Card>
            </div>

            {isLoadingEarnings ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Commission Info */}
                <Card className="bg-white/5 border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-green-400" />Sua Comissão</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-400">Taxa de Comissão</p>
                        <p className="text-3xl font-bold text-green-400">{earningsData?.summary.commissionRate || 70}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">do lucro</p>
                        <p className="text-xs text-gray-500">(Preço - Custo)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold">{earningsData?.summary.totalOrders || 0}</p>
                        <p className="text-xs text-gray-400">Pedidos</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold">{formatCurrency(earningsData?.summary.totalSales || 0)}</p>
                        <p className="text-xs text-gray-400">Vendas Totais</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Payout Card */}
                <Card className="bg-white/5 border-white/10 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet className="text-purple-400" />Saque</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-500/10 rounded-lg text-center">
                      <p className="text-sm text-gray-400 mb-1">Disponível para Saque</p>
                      <p className="text-4xl font-bold text-purple-400">{formatCurrency(earningsData?.summary.availableForPayout || 0)}</p>
                      <p className="text-xs text-gray-500 mt-2">Mínimo: {formatCurrency(earningsData?.summary.minPayoutAmount || 50)}</p>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={!earningsData?.summary.canRequestPayout}
                    >
                      <CreditCard size={16} className="mr-2" />
                      {earningsData?.summary.canRequestPayout ? 'Solicitar Saque' : `Mínimo R$ ${earningsData?.summary.minPayoutAmount || 50}`}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Saques processados em até 5 dias úteis via PIX</p>
                  </div>
                </Card>

                {/* Monthly Breakdown */}
                {earningsData?.monthlyBreakdown && earningsData.monthlyBreakdown.length > 0 && (
                  <Card className="bg-white/5 border-white/10 p-6 md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-green-400" />Ganhos Mensais</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {earningsData.monthlyBreakdown.map((m) => (
                        <div key={m.month} className="flex-1 min-w-[80px] text-center p-3 bg-white/5 rounded-lg">
                          <p className="text-xs text-gray-400">{m.month}</p>
                          <p className="font-bold text-green-400">{formatCurrency(m.commission)}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Button variant="outline" className="border-gray-700" onClick={fetchEarnings}>
                <RefreshCw size={16} className="mr-2" />Atualizar
              </Button>
            </div>
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
function ProductCard({ product, setSelectedProduct, setEditingProduct, updateProduct, deleteProduct, publishProduct, canPublish, formatCurrency, publishToStore, isPublishing }: {
  product: PODProduct; setSelectedProduct: (p: PODProduct) => void; setEditingProduct: (p: PODProduct) => void;
  updateProduct: (id: string, u: Partial<PODProduct>) => void; deleteProduct: (id: string) => void;
  publishProduct: (id: string) => void; canPublish: boolean; formatCurrency: (v: number) => string;
  publishToStore?: (id: string) => void; isPublishing?: string | null;
}) {
  const statusInfo = STATUS_CONFIG[product.status];
  const StatusIcon = statusInfo.icon;
  const CategoryIcon = CATEGORY_ICONS[product.category] || Package;
  const isInStore = product.isPublished && product.showInMarketplace;
  const isPublishingThis = isPublishing === product._id;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group relative">
      <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-purple-500/50 transition-all">
        <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900">
          {product.primaryMockup ? <img src={product.primaryMockup} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><CategoryIcon size={48} className="text-gray-600" /></div>}
          <Badge className={cn("absolute top-2 left-2", statusInfo.color, "text-white")}><StatusIcon size={12} className="mr-1" />{statusInfo.label}</Badge>
          {isInStore && <Badge className="absolute top-2 left-24 bg-green-600 text-white"><Store size={12} className="mr-1" />Na Loja</Badge>}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="icon" variant="secondary" className="h-8 w-8"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-800 text-white">
                <DropdownMenuItem onClick={() => setSelectedProduct(product)}><Eye size={14} className="mr-2" />Ver</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingProduct(product)}><Edit size={14} className="mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                {product.status === "draft" && <DropdownMenuItem onClick={() => publishProduct(product._id)} className={!canPublish ? "opacity-50" : ""}><Send size={14} className="mr-2" />{canPublish ? "Publicar" : `${MIN_XP_TO_PUBLISH} XP`}</DropdownMenuItem>}
                {product.status === "active" && !isInStore && publishToStore && (
                  <DropdownMenuItem onClick={() => publishToStore(product._id)} disabled={isPublishingThis}>
                    {isPublishingThis ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Store size={14} className="mr-2" />}
                    {isPublishingThis ? "Publicando..." : "Publicar na Loja"}
                  </DropdownMenuItem>
                )}
                {isInStore && (
                  <DropdownMenuItem className="text-green-400" onClick={() => window.open(`/loja`, '_blank')}>
                    <ExternalLink size={14} className="mr-2" />Ver na Loja
                  </DropdownMenuItem>
                )}
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
  designScale: 'small' | 'medium' | 'large' | 'fill'; setDesignScale: (s: 'small' | 'medium' | 'large' | 'fill') => void;
  designPosition: 'top' | 'center' | 'bottom'; setDesignPosition: (p: 'top' | 'center' | 'bottom') => void;
}) {
  const { step, setStep, blueprintSearch, setBlueprintSearch, selectedCategory, setSelectedCategory, blueprints,
    selectedBlueprint, setSelectedBlueprint, providers, selectedProvider, setSelectedProvider, variants,
    selectedVariants, setSelectedVariants, designPreview, setDesignPreview, productTitle, setProductTitle, productDescription,
    setProductDescription, sellingPrice, setSellingPrice, baseCost, setBaseCost, isCreating, isFetchingBlueprints,
    isFetchingProviders, isFetchingVariants, fileInputRef, handleFileSelect, fetchBlueprints, fetchProviders,
    fetchVariants, createProduct, userXP, canPublish, formatCurrency,
    printifyMockups, isGeneratingMockups, generatePrintifyMockups, uploadDesign, uploadedDesignUrl, setUploadedDesignUrl,
    designScale, setDesignScale, designPosition, setDesignPosition } = props;

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
  const [showMockupGalleryModal, setShowMockupGalleryModal] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showDesignEditor, setShowDesignEditor] = useState(false);
  const [designSettings, setDesignSettings] = useState<DesignSettings | null>(null);
  const [mockupsOutdated, setMockupsOutdated] = useState(false); // Track if mockups need regeneration

  // Reset selected image when blueprint changes
  useEffect(() => {
    setSelectedProductImageIndex(0);
  }, [selectedBlueprint?.id]);

  // Fetch gallery images
  const fetchGalleryImages = useCallback(async (type: string) => {
    setIsLoadingGallery(true);
    try {
      const token = localStorage.getItem('fayapoint_token');
      // Fetch more images (30) for better gallery experience
      const res = await fetch(`/api/gallery?type=${type}&limit=30`, {
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
    // Mark mockups as outdated if they exist
    if (printifyMockups.length > 0) {
      setMockupsOutdated(true);
    }
    toast.success('Design selecionado!');
  };

  // Handle design settings from editor
  const handleDesignSettingsApply = (newSettings: DesignSettings) => {
    setDesignSettings(newSettings);
    setShowDesignEditor(false);
    // Mark mockups as outdated since position/scale changed
    if (printifyMockups.length > 0) {
      setMockupsOutdated(true);
    }
  };

  // Regenerate mockups with current design settings
  const handleRegenerateMockups = async () => {
    if (!uploadedDesignUrl) {
      const url = await uploadDesign();
      if (!url) {
        toast.error("Erro no upload do design");
        return;
      }
      setUploadedDesignUrl(url);
    }
    setMockupsOutdated(false);
    generatePrintifyMockups(uploadedDesignUrl!);
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

              {/* Advanced Editor Button */}
              {designPreview && selectedBlueprint && (
                <Button 
                  variant="outline" 
                  className="w-full border-purple-500/50 hover:bg-purple-600/20 text-purple-400"
                  onClick={() => setShowAdvancedEditor(true)}
                >
                  <Wand2 size={16} className="mr-2" />
                  Modo Avançado: Adicionar Texto, Camadas e Posicionamento
                </Button>
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
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-400" />
                  Preview do Produto
                </h4>
                {printifyMockups.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMockupGalleryModal(true)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <Maximize2 size={14} className="mr-1" />
                    Expandir
                  </Button>
                )}
              </div>
              {selectedBlueprint && (
                <div className="space-y-4">
                  {/* Main Mockup - Show Printify Gallery if available */}
                  {printifyMockups.length > 0 ? (
                    <MockupGallery 
                      mockups={printifyMockups}
                      selectedIndex={selectedProductImageIndex}
                      onSelectIndex={setSelectedProductImageIndex}
                    />
                  ) : isGeneratingMockups ? (
                    <MockupGallery 
                      mockups={[]}
                      selectedIndex={0}
                      onSelectIndex={() => {}}
                      isLoading={true}
                    />
                  ) : (
                    <MockupPreview 
                      productImage={selectedBlueprint.images[selectedProductImageIndex] || selectedBlueprint.images[0]} 
                      designImage={designPreview}
                      productTitle={selectedBlueprint.title}
                      className="aspect-square w-full"
                    />
                  )}
                  
                  {/* Design Placement Options */}
                  {designPreview && selectedVariants.length > 0 && !isGeneratingMockups && (
                    <div className="space-y-3">
                      {/* Edit Position Button - Opens new editor */}
                      <Button 
                        variant="outline" 
                        className="w-full border-purple-500/50 hover:bg-purple-600/20 text-purple-400"
                        onClick={() => setShowDesignEditor(true)}
                      >
                        <Settings size={16} className="mr-2" />
                        Editar Posição do Design
                        {designSettings && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Customizado
                          </Badge>
                        )}
                      </Button>
                      
                      {/* Quick Scale Buttons */}
                      <div className="flex gap-2">
                        {[
                          { id: 'small', label: 'P', value: 0.4 },
                          { id: 'medium', label: 'M', value: 0.6 },
                          { id: 'large', label: 'G', value: 0.8 },
                          { id: 'fill', label: 'XG', value: 1.0 },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setDesignScale(opt.id as typeof designScale);
                              if (printifyMockups.length > 0) setMockupsOutdated(true);
                            }}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                              designScale === opt.id 
                                ? "bg-purple-600 text-white" 
                                : "bg-white/5 text-gray-400 hover:bg-white/10"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Generate / Regenerate Mockups Button */}
                  {designPreview && selectedVariants.length > 0 && !isGeneratingMockups && (
                    <>
                      {printifyMockups.length === 0 ? (
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
                      ) : mockupsOutdated && (
                        <Card className="bg-yellow-500/10 border-yellow-500/30 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-yellow-400">
                              <AlertCircle size={16} />
                              <span className="text-sm">Design alterado</span>
                            </div>
                            <Button 
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700"
                              onClick={handleRegenerateMockups}
                            >
                              <RefreshCw size={14} className="mr-1" />
                              Atualizar Mockups
                            </Button>
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                  
                  {/* Info Card - only show when no mockups (MockupGallery has its own info) */}
                  {printifyMockups.length === 0 && (
                    <Card className="bg-white/5 border-white/10 p-4">
                      <h5 className="font-semibold mb-1">{selectedBlueprint.title}</h5>
                      <p className="text-sm text-gray-400 mb-3">{selectedBlueprint.brand}</p>
                      
                      {designPreview ? (
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
        
        {/* Fullscreen Mockup Gallery Modal */}
        <AnimatePresence>
          {showMockupGalleryModal && printifyMockups.length > 0 && (
            <MockupGalleryModal
              mockups={printifyMockups}
              initialIndex={selectedProductImageIndex}
              onClose={() => setShowMockupGalleryModal(false)}
            />
          )}
        </AnimatePresence>

        {/* POD Design Editor Modal - NEW improved editor */}
        <AnimatePresence>
          {showDesignEditor && selectedBlueprint && designPreview && (
            <PODDesignEditor
              productImage={selectedBlueprint.images[0]}
              productTitle={selectedBlueprint.title}
              designImage={designPreview}
              initialSettings={designSettings || undefined}
              onApply={(newSettings) => {
                handleDesignSettingsApply(newSettings);
                // Update design scale/position based on editor settings
                if (newSettings.scale <= 0.45) setDesignScale('small');
                else if (newSettings.scale <= 0.65) setDesignScale('medium');
                else if (newSettings.scale <= 0.85) setDesignScale('large');
                else setDesignScale('fill');
                
                if (newSettings.y <= 0.35) setDesignPosition('top');
                else if (newSettings.y <= 0.65) setDesignPosition('center');
                else setDesignPosition('bottom');
              }}
              onCancel={() => setShowDesignEditor(false)}
            />
          )}
        </AnimatePresence>

        {/* Advanced Design Editor Modal - for text/layers */}
        <AnimatePresence>
          {showAdvancedEditor && selectedBlueprint && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 overflow-auto"
            >
              <div className="min-h-screen p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Layers size={24} className="text-purple-400" />
                      Editor Avançado
                    </h2>
                    <p className="text-gray-400">Adicione texto, camadas e posicione com precisão</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      className="border-gray-700"
                      onClick={() => setShowAdvancedEditor(false)}
                    >
                      <X size={16} className="mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        // Mark mockups as outdated since design may have changed
                        if (printifyMockups.length > 0) {
                          setMockupsOutdated(true);
                        }
                        toast.success("Design salvo!");
                        setShowAdvancedEditor(false);
                      }}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Aplicar Design
                    </Button>
                  </div>
                </div>

                {/* Editor */}
                <DesignEditor
                  productImage={selectedBlueprint.images[0]}
                  printAreaWidth={variants[0]?.placeholders?.[0]?.width || 4500}
                  printAreaHeight={variants[0]?.placeholders?.[0]?.height || 5100}
                  availablePositions={['front', 'back']}
                  initialLayers={designPreview ? [{
                    type: 'image' as const,
                    id: 'main-design',
                    imageUrl: designPreview,
                    width: 2000,
                    height: 2000,
                    x: 0.5,
                    y: 0.5,
                    scale: 0.6,
                    angle: 0,
                  }] : []}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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

// Detail Modal with QR Code Sharing
function DetailModal({ product, onClose, setEditingProduct, publishProduct, canPublish, formatCurrency }: {
  product: PODProduct; onClose: () => void; setEditingProduct: (p: PODProduct) => void;
  publishProduct: (id: string) => void; canPublish: boolean; formatCurrency: (v: number) => string;
}) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const statusInfo = STATUS_CONFIG[product.status];
  
  // Generate shareable URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/loja/produto/${product.slug}` 
    : `/loja/produto/${product.slug}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Erro ao copiar"); }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('product-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${product.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code baixado!");
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Left: Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden relative group">
              {product.primaryMockup ? (
                <img src={product.primaryMockup} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full"><Package size={64} className="text-gray-600" /></div>
              )}
            </div>
            
            {/* QR Code Section */}
            <Card className="bg-white/5 border-gray-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <QrCode size={20} className="text-purple-400" />
                  <span className="font-medium">Compartilhar Produto</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowQR(!showQR)}>
                  {showQR ? "Esconder" : "Mostrar QR"}
                </Button>
              </div>
              
              <AnimatePresence>
                {showQR && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="bg-white p-4 rounded-xl">
                        <QRCodeSVG 
                          id="product-qr-code"
                          value={shareUrl} 
                          size={180} 
                          level="H"
                          includeMargin
                          imageSettings={{
                            src: product.primaryMockup || "/logo-icon.png",
                            x: undefined,
                            y: undefined,
                            height: 36,
                            width: 36,
                            excavate: true,
                          }}
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={downloadQRCode} className="border-gray-700">
                        <Download size={16} className="mr-2" />
                        Baixar QR Code
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="bg-white/5 border-gray-700 text-sm flex-1 text-gray-400" 
                />
                <Button variant="outline" size="icon" onClick={copyUrl} className="border-gray-700 shrink-0">
                  {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className={cn(statusInfo.color, "text-white")}>{statusInfo.label}</Badge>
              <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
            </div>
            
            <h2 className="text-2xl font-bold">{product.title}</h2>
            {product.shortDescription && <p className="text-gray-400 text-sm">{product.shortDescription}</p>}
            <p className="text-gray-400">{product.description}</p>
            
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="border-gray-700 text-gray-400">
                    <Hash size={12} className="mr-1" />{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Pricing */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Preço de Venda</span>
                <span className="text-xl font-bold text-green-400">{formatCurrency(product.suggestedPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo Base</span>
                <span>{formatCurrency(product.baseCost)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400 font-medium">Lucro por venda</span>
                <span className="text-purple-400 font-bold">{formatCurrency(product.suggestedPrice - product.baseCost)}</span>
              </div>
              <div className="text-xs text-gray-500 text-right">
                Margem: {(((product.suggestedPrice - product.baseCost) / product.suggestedPrice) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <Card className="bg-white/5 p-3 border-gray-800">
                <Eye size={20} className="mx-auto mb-1 text-blue-400" />
                <p className="font-bold">{product.views}</p>
                <p className="text-xs text-gray-500">Visualizações</p>
              </Card>
              <Card className="bg-white/5 p-3 border-gray-800">
                <ShoppingBag size={20} className="mx-auto mb-1 text-green-400" />
                <p className="font-bold">{product.sales}</p>
                <p className="text-xs text-gray-500">Vendas</p>
              </Card>
              <Card className="bg-white/5 p-3 border-gray-800">
                <DollarSign size={20} className="mx-auto mb-1 text-yellow-400" />
                <p className="font-bold">{formatCurrency(product.revenue)}</p>
                <p className="text-xs text-gray-500">Receita</p>
              </Card>
            </div>

            {/* Visibility Status */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {product.showInUserStore ? (
                  <ToggleRight size={18} className="text-green-400" />
                ) : (
                  <ToggleLeft size={18} className="text-gray-500" />
                )}
                <span className="text-gray-400">Minha Loja</span>
              </div>
              <div className="flex items-center gap-2">
                {product.showInMarketplace ? (
                  <ToggleRight size={18} className="text-green-400" />
                ) : (
                  <ToggleLeft size={18} className="text-gray-500" />
                )}
                <span className="text-gray-400">Marketplace</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => { setEditingProduct(product); onClose(); }}>
                <Edit size={16} className="mr-2" />Editar
              </Button>
              {product.status === "draft" && canPublish && (
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { publishProduct(product._id); onClose(); }}>
                  <Send size={16} className="mr-2" />Publicar
                </Button>
              )}
              <Button variant="outline" className="border-gray-700" onClick={() => window.open(shareUrl, '_blank')}>
                <ExternalLink size={16} />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Edit Modal with Full Product Management
function EditModal({ product, onClose, updateProduct }: { product: PODProduct; onClose: () => void; updateProduct: (id: string, u: Partial<PODProduct>) => void }) {
  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'visibility' | 'share'>('info');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [shortDescription, setShortDescription] = useState(product.shortDescription || '');
  const [tags, setTags] = useState<string[]>(product.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [price, setPrice] = useState(product.suggestedPrice);
  const [status, setStatus] = useState(product.status);
  const [showInUserStore, setShowInUserStore] = useState(product.showInUserStore ?? true);
  const [showInMarketplace, setShowInMarketplace] = useState(product.showInMarketplace ?? false);
  const [copied, setCopied] = useState(false);

  const profit = price - product.baseCost;
  const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0';
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/loja/produto/${product.slug}` 
    : `/loja/produto/${product.slug}`;

  const addTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !tags.includes(newTag) && tags.length < 10) {
      setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProduct(product._id, {
        title,
        description,
        shortDescription: shortDescription || undefined,
        tags,
        suggestedPrice: price,
        status,
        showInUserStore,
        showInMarketplace,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Erro ao copiar"); }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('edit-product-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${product.slug}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code baixado!");
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const tabs = [
    { id: 'info', label: 'Informações', icon: Type },
    { id: 'pricing', label: 'Preço', icon: DollarSign },
    { id: 'visibility', label: 'Visibilidade', icon: Eye },
    { id: 'share', label: 'Compartilhar', icon: Share2 },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {product.primaryMockup && (
              <img src={product.primaryMockup} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <h2 className="text-lg font-bold">Editar Produto</h2>
              <p className="text-xs text-gray-500">{product.templateName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "text-purple-400 border-b-2 border-purple-400 bg-purple-500/10" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-5">
              <div>
                <Label className="text-gray-300">Título do Produto</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="bg-white/5 border-gray-700 mt-1.5" 
                  placeholder="Ex: Camiseta Arte Digital Minimalista"
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Descrição Curta</Label>
                <Input 
                  value={shortDescription} 
                  onChange={(e) => setShortDescription(e.target.value)} 
                  className="bg-white/5 border-gray-700 mt-1.5" 
                  placeholder="Uma linha de destaque sobre o produto"
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-1">{shortDescription.length}/150 caracteres</p>
              </div>
              
              <div>
                <Label className="text-gray-300">Descrição Completa</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="bg-white/5 border-gray-700 mt-1.5" 
                  rows={4}
                  placeholder="Descreva seu produto em detalhes..."
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Tags</Label>
                <p className="text-xs text-gray-500 mb-2">Adicione até 10 tags para ajudar na busca</p>
                <div className="flex gap-2 mb-2">
                  <Input 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="bg-white/5 border-gray-700 flex-1" 
                    placeholder="Digite uma tag e pressione Enter"
                  />
                  <Button variant="outline" onClick={addTag} className="border-gray-700">
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="bg-purple-500/20 text-purple-300 pr-1">
                      <Hash size={12} className="mr-1" />{tag}
                      <button onClick={() => removeTag(tag)} className="ml-2 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                  {tags.length === 0 && <span className="text-gray-500 text-sm">Nenhuma tag adicionada</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-5">
              <Card className="bg-white/5 border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={20} className="text-green-400" />
                  <span className="font-medium">Definir Preço de Venda</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Preço de Venda (R$)</Label>
                    <Input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} 
                      className="bg-white/5 border-gray-700 mt-1.5 text-xl font-bold"
                      step="0.01"
                      min={product.baseCost}
                    />
                    <p className="text-xs text-gray-500 mt-1">Preço mínimo: {(product.baseCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                    <div>
                      <span className="text-gray-500 text-sm">Custo Base</span>
                      <p className="text-lg font-medium">{product.baseCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Seu Lucro</span>
                      <p className={cn("text-lg font-bold", profit >= 0 ? "text-green-400" : "text-red-400")}>
                        {profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Margem de Lucro</span>
                      <span className={cn("text-2xl font-bold", parseFloat(margin) >= 30 ? "text-green-400" : parseFloat(margin) >= 15 ? "text-yellow-400" : "text-red-400")}>
                        {margin}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className={cn("h-2 rounded-full transition-all", parseFloat(margin) >= 30 ? "bg-green-500" : parseFloat(margin) >= 15 ? "bg-yellow-500" : "bg-red-500")}
                        style={{ width: `${Math.min(parseFloat(margin), 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {parseFloat(margin) >= 30 ? "✓ Excelente margem!" : parseFloat(margin) >= 15 ? "Margem adequada" : "⚠ Margem baixa"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="space-y-5">
              <Card className="bg-white/5 border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={20} className="text-blue-400" />
                  <span className="font-medium">Status do Produto</span>
                </div>
                
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger className="bg-white/5 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500" />
                        Rascunho
                      </div>
                    </SelectItem>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Ativo
                      </div>
                    </SelectItem>
                    <SelectItem value="paused">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        Pausado
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                        Arquivado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Card>

              <Card className="bg-white/5 border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={20} className="text-purple-400" />
                  <span className="font-medium">Onde exibir seu produto</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Store size={20} className="text-blue-400" />
                      <div>
                        <p className="font-medium">Minha Loja</p>
                        <p className="text-xs text-gray-500">Visível na sua loja pessoal</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInUserStore(!showInUserStore)}
                      className={cn("relative w-12 h-6 rounded-full transition-colors", showInUserStore ? "bg-green-500" : "bg-gray-600")}
                    >
                      <div className={cn("absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform", showInUserStore ? "translate-x-6" : "translate-x-0.5")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe size={20} className="text-purple-400" />
                      <div>
                        <p className="font-medium">Marketplace FayaPoint</p>
                        <p className="text-xs text-gray-500">Visível para todos os usuários</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInMarketplace(!showInMarketplace)}
                      className={cn("relative w-12 h-6 rounded-full transition-colors", showInMarketplace ? "bg-green-500" : "bg-gray-600")}
                    >
                      <div className={cn("absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform", showInMarketplace ? "translate-x-6" : "translate-x-0.5")} />
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-5">
              <Card className="bg-white/5 border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode size={20} className="text-purple-400" />
                  <span className="font-medium">QR Code do Produto</span>
                </div>
                
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCodeSVG 
                      id="edit-product-qr-code"
                      value={shareUrl} 
                      size={200} 
                      level="H"
                      includeMargin
                      imageSettings={{
                        src: product.primaryMockup || "/logo-icon.png",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    Escaneie o QR Code para acessar a página do produto
                  </p>
                  <Button variant="outline" onClick={downloadQRCode} className="border-gray-700">
                    <Download size={16} className="mr-2" />
                    Baixar QR Code PNG
                  </Button>
                </div>
              </Card>

              <Card className="bg-white/5 border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 size={20} className="text-blue-400" />
                  <span className="font-medium">Link de Compartilhamento</span>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="bg-white/5 border-gray-700 text-sm flex-1 text-gray-400 font-mono" 
                  />
                  <Button variant="outline" onClick={copyUrl} className="border-gray-700">
                    {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
                  </Button>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-gray-700"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira meu produto: ${title} - ${shareUrl}`)}`, '_blank')}
                  >
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-gray-700"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Confira meu produto: ${title}`)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
                  >
                    Twitter
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 border-gray-700"
                    onClick={() => window.open(shareUrl, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-800 bg-gray-900/50">
          <Button variant="outline" className="flex-1 border-gray-700" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Download icon helper (using Lucide)
const Download = ({ size, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
