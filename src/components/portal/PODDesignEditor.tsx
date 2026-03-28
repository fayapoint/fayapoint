"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X, Check, ZoomIn, ZoomOut, Move, RotateCw, Maximize2,
  FlipHorizontal, FlipVertical, RefreshCw, Grid,AlertCircle,
  Target, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Print area configs — percentage of product image
const PRODUCT_PRINT_AREAS: Record<string, {
  x: number; y: number; width: number; height: number; name: string;
}> = {
  't-shirt':   { x: 50, y: 35, width: 35, height: 40, name: 'Área de Impressão (Frente)' },
  'hoodie':    { x: 50, y: 38, width: 30, height: 35, name: 'Área de Impressão (Frente)' },
  'mug':       { x: 50, y: 50, width: 60, height: 70, name: 'Área de Impressão' },
  'poster':    { x: 50, y: 50, width: 90, height: 90, name: 'Área de Impressão' },
  'canvas':    { x: 50, y: 50, width: 85, height: 85, name: 'Área de Impressão' },
  'phone-case':{ x: 50, y: 45, width: 70, height: 80, name: 'Área de Impressão' },
  'pillow':    { x: 50, y: 50, width: 70, height: 70, name: 'Área de Impressão' },
  'tote-bag':  { x: 50, y: 45, width: 50, height: 55, name: 'Área de Impressão' },
  'default':   { x: 50, y: 40, width: 40, height: 45, name: 'Área de Impressão' },
};

function detectProductType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('t-shirt') || t.includes('tee') || t.includes('camiseta') || t.includes('crew')) return 't-shirt';
  if (t.includes('hoodie') || t.includes('moletom')) return 'hoodie';
  if (t.includes('mug') || t.includes('caneca')) return 'mug';
  if (t.includes('poster') || t.includes('pôster')) return 'poster';
  if (t.includes('canvas') || t.includes('quadro')) return 'canvas';
  if (t.includes('phone') || t.includes('case') || t.includes('celular')) return 'phone-case';
  if (t.includes('pillow') || t.includes('almofada')) return 'pillow';
  if (t.includes('tote') || t.includes('bag') || t.includes('sacola')) return 'tote-bag';
  return 'default';
}

export interface DesignSettings {
  scale: number;    // 0.1 to 2.0 — 1.0 means "fit print area"
  x: number;        // 0 to 1 (within print area)
  y: number;
  rotation: number; // degrees
  flipX: boolean;
  flipY: boolean;
}

interface PODDesignEditorProps {
  productImage: string;
  productTitle: string;
  designImage: string;
  onApply: (settings: DesignSettings) => void;
  onCancel: () => void;
  initialSettings?: Partial<DesignSettings>;
}

const defaultSettings: DesignSettings = {
  scale: 1.0,
  x: 0.5,
  y: 0.5,
  rotation: 0,
  flipX: false,
  flipY: false,
};

/**
 * Renders the product + design composite on a canvas with fabric simulation.
 * This gives the user a realistic preview BEFORE sending to Printify.
 */
function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  productSrc: string,
  designSrc: string,
  settings: DesignSettings,
  printArea: typeof PRODUCT_PRINT_AREAS['default'],
  showGrid: boolean,
) {
  const productImgRef = useRef<HTMLImageElement | null>(null);
  const designImgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  // Load images once
  useEffect(() => {
    let cancelled = false;
    const pImg = new Image();
    pImg.crossOrigin = 'anonymous';
    const dImg = new Image();
    dImg.crossOrigin = 'anonymous';

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === 2 && !cancelled) {
        productImgRef.current = pImg;
        designImgRef.current = dImg;
        setReady(true);
      }
    };
    pImg.onload = onLoad;
    dImg.onload = onLoad;
    pImg.src = productSrc;
    dImg.src = designSrc;

    return () => { cancelled = true; };
  }, [productSrc, designSrc]);

  // Render on every settings change
  useEffect(() => {
    if (!ready || !canvasRef.current || !productImgRef.current || !designImgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pImg = productImgRef.current;
    const dImg = designImgRef.current;

    // Canvas size — use product natural size clamped to reasonable resolution
    const maxDim = 800;
    const ratio = pImg.width / pImg.height;
    const cw = ratio >= 1 ? maxDim : Math.round(maxDim * ratio);
    const ch = ratio >= 1 ? Math.round(maxDim / ratio) : maxDim;
    canvas.width = cw;
    canvas.height = ch;

    // 1. Draw product
    ctx.drawImage(pImg, 0, 0, cw, ch);

    // 2. Calculate print area in pixels
    const paLeft = ((printArea.x - printArea.width / 2) / 100) * cw;
    const paTop = ((printArea.y - printArea.height / 2) / 100) * ch;
    const paW = (printArea.width / 100) * cw;
    const paH = (printArea.height / 100) * ch;

    // 3. Extract fabric luminosity BEFORE drawing design
    const fabricData = ctx.getImageData(
      Math.round(paLeft), Math.round(paTop),
      Math.round(paW), Math.round(paH)
    );

    // 4. Calculate design dimensions
    //    scale=1.0 means design fits the print area (contain)
    const dAspect = dImg.width / dImg.height;
    const paAspect = paW / paH;
    let fitW: number, fitH: number;
    if (dAspect > paAspect) {
      fitW = paW;
      fitH = paW / dAspect;
    } else {
      fitH = paH;
      fitW = paH * dAspect;
    }
    const drawW = fitW * settings.scale;
    const drawH = fitH * settings.scale;

    // Position within print area
    const centerX = paLeft + settings.x * paW;
    const centerY = paTop + settings.y * paH;

    // 5. Draw design with fabric blend
    ctx.save();
    ctx.beginPath();
    ctx.rect(paLeft, paTop, paW, paH); // Clip to print area
    ctx.clip();

    ctx.translate(centerX, centerY);
    ctx.rotate((settings.rotation * Math.PI) / 180);
    ctx.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);

    // Multiply blend for apparel, source-over for flat products
    const isApparel = ['t-shirt', 'hoodie', 'tote-bag', 'pillow'].includes(
      Object.entries(PRODUCT_PRINT_AREAS).find(([, v]) => v === printArea)?.[0] || ''
    );
    ctx.globalCompositeOperation = isApparel ? 'multiply' : 'source-over';
    ctx.drawImage(dImg, -drawW / 2, -drawH / 2, drawW, drawH);

    // 6. Fabric wrinkle simulation for apparel
    if (isApparel) {
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = Math.round(paW);
      shadowCanvas.height = Math.round(paH);
      const sCtx = shadowCanvas.getContext('2d');
      if (sCtx) {
        const sd = sCtx.createImageData(shadowCanvas.width, shadowCanvas.height);
        const src = fabricData.data;
        const dst = sd.data;
        for (let i = 0; i < src.length; i += 4) {
          const lum = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
          const shadow = Math.max(0, 128 - lum) * 2;
          dst[i] = 0; dst[i + 1] = 0; dst[i + 2] = 0;
          dst[i + 3] = Math.min(255, Math.round(shadow * 0.3));
        }
        sCtx.putImageData(sd, 0, 0);

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(shadowCanvas, paLeft, paTop, paW, paH);

        // Highlight pass
        const hlCanvas = document.createElement('canvas');
        hlCanvas.width = shadowCanvas.width;
        hlCanvas.height = shadowCanvas.height;
        const hCtx = hlCanvas.getContext('2d');
        if (hCtx) {
          const hd = hCtx.createImageData(hlCanvas.width, hlCanvas.height);
          const hdst = hd.data;
          for (let i = 0; i < src.length; i += 4) {
            const lum = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114;
            const hl = Math.max(0, lum - 140);
            hdst[i] = 255; hdst[i + 1] = 255; hdst[i + 2] = 255;
            hdst[i + 3] = Math.min(255, Math.round(hl * 0.15));
          }
          hCtx.putImageData(hd, 0, 0);
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(hlCanvas, paLeft, paTop, paW, paH);
        }
      }
    }

    ctx.restore();

    // 7. Draw print area border overlay if grid enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.strokeRect(paLeft, paTop, paW, paH);
      ctx.setLineDash([]);

      // Crosshairs
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paLeft + paW / 2, paTop);
      ctx.lineTo(paLeft + paW / 2, paTop + paH);
      ctx.moveTo(paLeft, paTop + paH / 2);
      ctx.lineTo(paLeft + paW, paTop + paH / 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
      const labelW = 160;
      const labelH = 22;
      const labelX = paLeft + (paW - labelW) / 2;
      const labelY = paTop - labelH - 4;
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelW, labelH, 4);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(printArea.name, paLeft + paW / 2, labelY + 15);
    }
  }, [ready, settings, showGrid, printArea, canvasRef]);

  return ready;
}

export default function PODDesignEditor({
  productImage,
  productTitle,
  designImage,
  onApply,
  onCancel,
  initialSettings,
}: PODDesignEditorProps) {
  const [settings, setSettings] = useState<DesignSettings>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const productType = detectProductType(productTitle);
  const printArea = PRODUCT_PRINT_AREAS[productType] || PRODUCT_PRINT_AREAS.default;

  const ready = useCanvasRenderer(canvasRef, productImage, designImage, settings, printArea, showGrid);

  const updateSetting = useCallback(<K extends keyof DesignSettings>(
    key: K, value: DesignSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Drag to reposition
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.x) / (rect.width * zoom);
    const dy = (e.clientY - dragStartRef.current.y) / (rect.height * zoom);
    // Scale by print area percentage
    const scaledDx = dx / (printArea.width / 100);
    const scaledDy = dy / (printArea.height / 100);
    setSettings(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1, prev.x + scaledDx)),
      y: Math.max(0, Math.min(1, prev.y + scaledDy)),
    }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, zoom, printArea]);

  const handlePointerUp = useCallback(() => setIsDragging(false), []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.05 : 0.01;
      if (e.key === 'ArrowUp') { e.preventDefault(); updateSetting('y', Math.max(0, settings.y - step)); }
      if (e.key === 'ArrowDown') { e.preventDefault(); updateSetting('y', Math.min(1, settings.y + step)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); updateSetting('x', Math.max(0, settings.x - step)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); updateSetting('x', Math.min(1, settings.x + step)); }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); updateSetting('scale', Math.min(2.0, settings.scale + 0.05)); }
      if (e.key === '-') { e.preventDefault(); updateSetting('scale', Math.max(0.1, settings.scale - 0.05)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [settings, updateSetting]);

  // Coverage percentage — how much of print area the design covers
  const coveragePercent = Math.min(100, Math.round(settings.scale * 100));

  const positionPresets = [
    { name: 'Centro', x: 0.5, y: 0.5, icon: Target },
    { name: 'Topo', x: 0.5, y: 0.3, icon: () => <span className="text-xs">↑</span> },
    { name: 'Base', x: 0.5, y: 0.7, icon: () => <span className="text-xs">↓</span> },
  ];

  const scalePresets = [
    { name: 'P', value: 0.5, desc: '50%' },
    { name: 'M', value: 0.75, desc: '75%' },
    { name: 'G', value: 1.0, desc: '100%' },
    { name: 'XG', value: 1.3, desc: '130%' },
    { name: 'Max', value: 1.8, desc: '180%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-700 flex items-center justify-center">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white">Editor de Design</h2>
            <p className="text-[11px] text-muted-foreground">Preview realista — veja como ficará impresso</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border" onClick={onCancel}>
            <X size={14} className="mr-1.5" /> Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-600 to-yellow-700"
            onClick={() => { onApply(settings); toast.success("Design aplicado!"); }}
          >
            <Check size={14} className="mr-1.5" /> Aplicar Design
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── CANVAS AREA ── */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-card/30 overflow-hidden">
          <div className="relative w-full max-w-2xl">
            {/* Zoom controls */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/10">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                <ZoomOut size={14} />
              </Button>
              <span className="text-[10px] text-white/60 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white/70 hover:text-white" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}>
                <ZoomIn size={14} />
              </Button>
              <div className="w-px h-5 bg-white/10" />
              <Button
                size="icon"
                variant="ghost"
                className={cn("h-7 w-7", showGrid ? "text-amber-400" : "text-white/40")}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid size={14} />
              </Button>
            </div>

            {/* Coverage indicator */}
            <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
              <span className="text-[10px] text-white/60">Cobertura: </span>
              <span className={cn(
                "text-sm font-bold",
                coveragePercent >= 100 ? "text-green-400" : coveragePercent >= 75 ? "text-amber-400" : "text-orange-400"
              )}>
                {coveragePercent}%
              </span>
            </div>

            {/* Canvas */}
            <div
              ref={containerRef}
              className={cn(
                "rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10",
                isDragging ? "cursor-grabbing" : "cursor-grab"
              )}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-auto block"
                style={{ imageRendering: 'auto' }}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                  <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Help bar */}
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-white/40">
              <span className="flex items-center gap-1"><Move size={12} /> Arraste para mover</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">↑↓←→</kbd> Ajuste fino</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">+/-</kbd> Escala</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="w-72 md:w-80 bg-card border-l border-border p-3 md:p-4 overflow-y-auto space-y-3 shrink-0">
          {/* Scale — the most important control */}
          <Card className="bg-secondary border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm text-white">
                <Maximize2 size={14} className="text-amber-400" />
                Tamanho
              </h4>
              <span className={cn(
                "text-sm font-mono font-bold",
                coveragePercent >= 100 ? "text-green-400" : "text-amber-400"
              )}>
                {coveragePercent}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3">100% = preenche toda a área de impressão</p>
            <Slider
              value={[settings.scale * 100]}
              onValueChange={([v]) => updateSetting('scale', v / 100)}
              min={10}
              max={200}
              step={5}
              className="mb-3"
            />
            <div className="grid grid-cols-5 gap-1">
              {scalePresets.map((p) => (
                <Button
                  key={p.name}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-border text-xs h-8",
                    Math.abs(settings.scale - p.value) < 0.03 && "bg-amber-600/30 border-amber-500 text-amber-300"
                  )}
                  onClick={() => updateSetting('scale', p.value)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </Card>

          {/* Position presets */}
          <Card className="bg-secondary border-border p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-white">
              <Target size={14} className="text-amber-400" />
              Posição
            </h4>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {positionPresets.map((p) => (
                <Button
                  key={p.name}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-border h-9",
                    Math.abs(settings.x - p.x) < 0.05 && Math.abs(settings.y - p.y) < 0.05
                      && "bg-amber-600/30 border-amber-500 text-amber-300"
                  )}
                  onClick={() => { updateSetting('x', p.x); updateSetting('y', p.y); }}
                >
                  {p.name}
                </Button>
              ))}
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Horizontal</span>
                  <span className="font-mono">{Math.round(settings.x * 100)}%</span>
                </div>
                <Slider
                  value={[settings.x * 100]}
                  onValueChange={([v]) => updateSetting('x', v / 100)}
                  min={0} max={100} step={1}
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>Vertical</span>
                  <span className="font-mono">{Math.round(settings.y * 100)}%</span>
                </div>
                <Slider
                  value={[settings.y * 100]}
                  onValueChange={([v]) => updateSetting('y', v / 100)}
                  min={0} max={100} step={1}
                />
              </div>
            </div>
          </Card>

          {/* Rotation */}
          <Card className="bg-secondary border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm text-white">
                <RotateCw size={14} className="text-amber-400" />
                Rotação
              </h4>
              <span className="text-sm text-amber-400 font-mono">{settings.rotation}°</span>
            </div>
            <Slider
              value={[settings.rotation]}
              onValueChange={([v]) => updateSetting('rotation', v)}
              min={-180} max={180} step={5}
              className="mb-2"
            />
            <div className="flex gap-1">
              {[-90, -45, 0, 45, 90].map((a) => (
                <Button
                  key={a}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 border-border text-xs h-7",
                    settings.rotation === a && "bg-amber-600/30 border-amber-500"
                  )}
                  onClick={() => updateSetting('rotation', a)}
                >
                  {a}°
                </Button>
              ))}
            </div>
          </Card>

          {/* Flip */}
          <Card className="bg-secondary border-border p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-white">
              <RefreshCw size={14} className="text-amber-400" />
              Espelhar
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn("border-border h-9", settings.flipX && "bg-amber-600/30 border-amber-500")}
                onClick={() => updateSetting('flipX', !settings.flipX)}
              >
                <FlipHorizontal size={14} className="mr-1.5" /> Horizontal
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("border-border h-9", settings.flipY && "bg-amber-600/30 border-amber-500")}
                onClick={() => updateSetting('flipY', !settings.flipY)}
              >
                <FlipVertical size={14} className="mr-1.5" /> Vertical
              </Button>
            </div>
          </Card>

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-border"
            onClick={() => setSettings(defaultSettings)}
          >
            <RefreshCw size={14} className="mr-1.5" /> Resetar para Padrão
          </Button>

          {/* Info */}
          <Card className="bg-amber-500/10 border-amber-500/20 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-medium text-white">Preview realista</span> — Esta simulação mostra como o design ficará impresso no tecido, com sombras e textura do produto real. A área tracejada é o limite de impressão.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export { PODDesignEditor };
