"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, ZoomIn, ZoomOut, Move, RotateCw, Maximize2, Minimize2,
  FlipHorizontal, FlipVertical, RefreshCw, Grid, Eye, AlertCircle,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Target, Shirt, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Print area configurations for different product types
const PRODUCT_PRINT_AREAS: Record<string, {
  x: number; // center X (0-100%)
  y: number; // center Y (0-100%)
  width: number; // width (0-100%)
  height: number; // height (0-100%)
  name: string;
}> = {
  't-shirt': { x: 50, y: 35, width: 35, height: 40, name: 'Área de Impressão (Frente)' },
  'hoodie': { x: 50, y: 38, width: 30, height: 35, name: 'Área de Impressão (Frente)' },
  'mug': { x: 50, y: 50, width: 60, height: 70, name: 'Área de Impressão' },
  'poster': { x: 50, y: 50, width: 90, height: 90, name: 'Área de Impressão' },
  'canvas': { x: 50, y: 50, width: 85, height: 85, name: 'Área de Impressão' },
  'phone-case': { x: 50, y: 45, width: 70, height: 80, name: 'Área de Impressão' },
  'pillow': { x: 50, y: 50, width: 70, height: 70, name: 'Área de Impressão' },
  'tote-bag': { x: 50, y: 45, width: 50, height: 55, name: 'Área de Impressão' },
  'default': { x: 50, y: 40, width: 40, height: 45, name: 'Área de Impressão' },
};

function detectProductType(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('t-shirt') || lowerTitle.includes('tee') || lowerTitle.includes('camiseta')) return 't-shirt';
  if (lowerTitle.includes('hoodie') || lowerTitle.includes('moletom')) return 'hoodie';
  if (lowerTitle.includes('mug') || lowerTitle.includes('caneca')) return 'mug';
  if (lowerTitle.includes('poster') || lowerTitle.includes('pôster')) return 'poster';
  if (lowerTitle.includes('canvas') || lowerTitle.includes('quadro')) return 'canvas';
  if (lowerTitle.includes('phone') || lowerTitle.includes('case') || lowerTitle.includes('celular')) return 'phone-case';
  if (lowerTitle.includes('pillow') || lowerTitle.includes('almofada') || lowerTitle.includes('cushion')) return 'pillow';
  if (lowerTitle.includes('tote') || lowerTitle.includes('bag') || lowerTitle.includes('sacola')) return 'tote-bag';
  return 'default';
}

interface PODDesignEditorProps {
  productImage: string;
  productTitle: string;
  designImage: string;
  onApply: (settings: DesignSettings) => void;
  onCancel: () => void;
  initialSettings?: Partial<DesignSettings>;
}

export interface DesignSettings {
  scale: number; // 0.2 to 1.5
  x: number; // 0 to 1 (position within print area)
  y: number; // 0 to 1
  rotation: number; // -180 to 180
  flipX: boolean;
  flipY: boolean;
}

const defaultSettings: DesignSettings = {
  scale: 0.6,
  x: 0.5,
  y: 0.5,
  rotation: 0,
  flipX: false,
  flipY: false,
};

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
  const [productLoaded, setProductLoaded] = useState(false);
  const [designLoaded, setDesignLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const settingsRef = useRef(settings);
  
  // Keep ref in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const productType = detectProductType(productTitle);
  const printArea = PRODUCT_PRINT_AREAS[productType] || PRODUCT_PRINT_AREAS.default;

  // Update setting helper
  const updateSetting = useCallback(<K extends keyof DesignSettings>(
    key: K,
    value: DesignSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle mouse drag for positioning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.x) / rect.width;
    const dy = (e.clientY - dragStartRef.current.y) / rect.height;
    
    // Scale movement by print area size
    const scaledDx = dx * (100 / printArea.width);
    const scaledDy = dy * (100 / printArea.height);
    
    setSettings(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1, prev.x + scaledDx)),
      y: Math.max(0, Math.min(1, prev.y + scaledDy)),
    }));
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, printArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts for fine-tuning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.05 : 0.01;
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          updateSetting('y', Math.max(0, settings.y - step));
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateSetting('y', Math.min(1, settings.y + step));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updateSetting('x', Math.max(0, settings.x - step));
          break;
        case 'ArrowRight':
          e.preventDefault();
          updateSetting('x', Math.min(1, settings.x + step));
          break;
        case '+':
        case '=':
          e.preventDefault();
          updateSetting('scale', Math.min(1.5, settings.scale + 0.05));
          break;
        case '-':
          e.preventDefault();
          updateSetting('scale', Math.max(0.2, settings.scale - 0.05));
          break;
        case 'r':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            updateSetting('rotation', (settings.rotation + 15) % 360);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, updateSetting]);

  // Quick position presets
  const positionPresets = [
    { name: 'Centro', x: 0.5, y: 0.5, icon: Target },
    { name: 'Topo', x: 0.5, y: 0.25, icon: ChevronUp },
    { name: 'Base', x: 0.5, y: 0.75, icon: ChevronDown },
  ];

  // Scale presets
  const scalePresets = [
    { name: 'P', value: 0.4, desc: 'Pequeno' },
    { name: 'M', value: 0.6, desc: 'Médio' },
    { name: 'G', value: 0.8, desc: 'Grande' },
    { name: 'XG', value: 1.0, desc: 'Extra Grande' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Editor de Design</h2>
            <p className="text-xs text-gray-400">Posicione seu design no produto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-700" onClick={onCancel}>
            <X size={16} className="mr-2" />
            Cancelar
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => {
              onApply(settings);
              toast.success("Design aplicado!");
            }}
          >
            <Check size={16} className="mr-2" />
            Aplicar Design
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="relative max-w-2xl w-full">
            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-gray-900/90 rounded-lg p-2 border border-gray-700">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                <ZoomOut size={16} />
              </Button>
              <span className="text-xs text-gray-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                <ZoomIn size={16} />
              </Button>
              <div className="w-px h-6 bg-gray-700" />
              <Button 
                size="icon" 
                variant={showGrid ? "default" : "ghost"} 
                className={cn("h-8 w-8", showGrid && "bg-purple-600")}
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid size={16} />
              </Button>
            </div>

            {/* Canvas Container */}
            <div
              ref={containerRef}
              className="relative bg-white rounded-xl overflow-hidden shadow-2xl cursor-crosshair"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Product Image */}
              <img
                src={productImage}
                alt={productTitle}
                className="w-full h-auto"
                onLoad={() => setProductLoaded(true)}
                draggable={false}
              />

              {/* Print Area Outline (Always visible) */}
              <div
                className={cn(
                  "absolute border-2 rounded transition-all pointer-events-none",
                  showGrid 
                    ? "border-purple-500 bg-purple-500/10" 
                    : "border-purple-500/30 bg-transparent"
                )}
                style={{
                  left: `${printArea.x - printArea.width / 2}%`,
                  top: `${printArea.y - printArea.height / 2}%`,
                  width: `${printArea.width}%`,
                  height: `${printArea.height}%`,
                }}
              >
                {/* Print Area Label */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-purple-600 text-white text-xs px-2 py-1 rounded shadow">
                  {printArea.name}
                </div>

                {/* Grid Lines */}
                {showGrid && (
                  <>
                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-purple-400/40 border-dashed" />
                    <div className="absolute top-1/2 left-0 right-0 border-t border-purple-400/40 border-dashed" />
                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-purple-400/20 border-dashed" />
                    <div className="absolute left-3/4 top-0 bottom-0 border-l border-purple-400/20 border-dashed" />
                    <div className="absolute top-1/4 left-0 right-0 border-t border-purple-400/20 border-dashed" />
                    <div className="absolute top-3/4 left-0 right-0 border-t border-purple-400/20 border-dashed" />
                  </>
                )}

                {/* Design Image (Draggable) */}
                <div
                  className={cn(
                    "absolute cursor-move transition-shadow",
                    isDragging && "ring-2 ring-purple-500 ring-offset-2"
                  )}
                  style={{
                    left: `${settings.x * 100}%`,
                    top: `${settings.y * 100}%`,
                    transform: `
                      translate(-50%, -50%)
                      scale(${settings.scale})
                      rotate(${settings.rotation}deg)
                      scaleX(${settings.flipX ? -1 : 1})
                      scaleY(${settings.flipY ? -1 : 1})
                    `,
                    maxWidth: '90%',
                    maxHeight: '90%',
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <img
                    src={designImage}
                    alt="Design"
                    className="max-w-full max-h-full object-contain shadow-lg"
                    style={{ maxHeight: '200px' }}
                    onLoad={() => setDesignLoaded(true)}
                    draggable={false}
                  />
                  {/* Resize handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow" />
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-4 text-center text-sm text-gray-400 flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Move size={14} />
                Arraste para mover
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">↑↓←→</kbd>
                Ajuste fino
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">+/-</kbd>
                Escala
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Controls */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 overflow-y-auto space-y-4">
          {/* Position Presets */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <Target size={16} className="text-purple-400" />
              Posição Rápida
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {positionPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-gray-700 flex flex-col gap-1 h-auto py-2",
                    settings.x === preset.x && settings.y === preset.y && "bg-purple-600/30 border-purple-500"
                  )}
                  onClick={() => {
                    updateSetting('x', preset.x);
                    updateSetting('y', preset.y);
                  }}
                >
                  <preset.icon size={14} />
                  <span className="text-xs">{preset.name}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Scale Control */}
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2 text-white">
                <Maximize2 size={16} className="text-purple-400" />
                Tamanho
              </h4>
              <span className="text-sm text-purple-400 font-mono">{Math.round(settings.scale * 100)}%</span>
            </div>
            <Slider
              value={[settings.scale * 100]}
              onValueChange={([v]) => updateSetting('scale', v / 100)}
              min={20}
              max={150}
              step={5}
              className="mb-3"
            />
            <div className="grid grid-cols-4 gap-1">
              {scalePresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-gray-700",
                    Math.abs(settings.scale - preset.value) < 0.05 && "bg-purple-600/30 border-purple-500"
                  )}
                  onClick={() => updateSetting('scale', preset.value)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </Card>

          {/* Fine Position Control */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <Move size={16} className="text-purple-400" />
              Posição Fina
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Horizontal</span>
                  <span>{Math.round(settings.x * 100)}%</span>
                </div>
                <Slider
                  value={[settings.x * 100]}
                  onValueChange={([v]) => updateSetting('x', v / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Vertical</span>
                  <span>{Math.round(settings.y * 100)}%</span>
                </div>
                <Slider
                  value={[settings.y * 100]}
                  onValueChange={([v]) => updateSetting('y', v / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </Card>

          {/* Rotation */}
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center gap-2 text-white">
                <RotateCw size={16} className="text-purple-400" />
                Rotação
              </h4>
              <span className="text-sm text-purple-400 font-mono">{settings.rotation}°</span>
            </div>
            <Slider
              value={[settings.rotation]}
              onValueChange={([v]) => updateSetting('rotation', v)}
              min={-180}
              max={180}
              step={5}
              className="mb-2"
            />
            <div className="flex gap-1">
              {[-90, -45, 0, 45, 90].map((angle) => (
                <Button
                  key={angle}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 border-gray-700 text-xs",
                    settings.rotation === angle && "bg-purple-600/30 border-purple-500"
                  )}
                  onClick={() => updateSetting('rotation', angle)}
                >
                  {angle}°
                </Button>
              ))}
            </div>
          </Card>

          {/* Flip Controls */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
              <RefreshCw size={16} className="text-purple-400" />
              Espelhar
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className={cn(
                  "border-gray-700",
                  settings.flipX && "bg-purple-600/30 border-purple-500"
                )}
                onClick={() => updateSetting('flipX', !settings.flipX)}
              >
                <FlipHorizontal size={16} className="mr-2" />
                Horizontal
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "border-gray-700",
                  settings.flipY && "bg-purple-600/30 border-purple-500"
                )}
                onClick={() => updateSetting('flipY', !settings.flipY)}
              >
                <FlipVertical size={16} className="mr-2" />
                Vertical
              </Button>
            </div>
          </Card>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full border-gray-700"
            onClick={() => setSettings(defaultSettings)}
          >
            <RefreshCw size={16} className="mr-2" />
            Resetar para Padrão
          </Button>

          {/* Info Card */}
          <Card className="bg-purple-500/10 border-purple-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Dica</p>
                <p>A área destacada em roxo mostra exatamente onde seu design será impresso no produto final.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export { PODDesignEditor };
