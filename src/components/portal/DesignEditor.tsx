"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type, Image as ImageIcon, Layers, Move, RotateCw, Maximize2, Trash2,
  Plus, ChevronDown, Copy, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Palette, Sparkles,
  Undo, Redo, Save, Download, Upload, Grid, ZoomIn, ZoomOut, RotateCcw,
  FlipHorizontal, FlipVertical, Square, Circle, Triangle, Check, X, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AVAILABLE_FONTS,
  POSITION_LABELS,
  POSITION_PRESETS,
  FONT_SIZE_PRESETS,
  SCALE_PRESETS,
  ANGLE_PRESETS,
  COLOR_PALETTE,
  TEXT_EFFECTS,
  createTextLayer,
  createImageLayer,
  generateLayerId,
  type TextLayer,
  type ImageLayer,
  type DesignLayer,
  type PrintArea,
} from "@/lib/design-editor";

interface DesignEditorProps {
  productImage: string;
  printAreaWidth?: number;
  printAreaHeight?: number;
  printAreaX?: number; // Position of print area on product (0-1)
  printAreaY?: number;
  printAreaScale?: number; // How much of product the print area covers
  availablePositions?: string[];
  initialLayers?: DesignLayer[];
  onSave?: (layers: DesignLayer[], renderedImageUrl: string) => void;
  onLayersChange?: (layers: DesignLayer[]) => void;
  className?: string;
}

export default function DesignEditor({
  productImage,
  printAreaWidth = 4500,
  printAreaHeight = 5100,
  printAreaX = 0.5,
  printAreaY = 0.45,
  printAreaScale = 0.6,
  availablePositions = ["front"],
  initialLayers = [],
  onSave,
  onLayersChange,
  className,
}: DesignEditorProps) {
  // State
  const [layers, setLayers] = useState<DesignLayer[]>(initialLayers);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activePosition, setActivePosition] = useState(availablePositions[0] || "front");
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Text editing state
  const [editingText, setEditingText] = useState<string | null>(null);
  const [tempText, setTempText] = useState("");
  
  // Canvas ref for preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Notify parent of layer changes
  useEffect(() => {
    onLayersChange?.(layers);
  }, [layers, onLayersChange]);

  // Add text layer
  const addTextLayer = useCallback(() => {
    const newLayer = createTextLayer("Seu Texto Aqui");
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    setEditingText(newLayer.id);
    setTempText(newLayer.text);
    toast.success("Camada de texto adicionada");
  }, []);

  // Add image layer
  const addImageLayer = useCallback((imageUrl: string, width: number, height: number) => {
    const newLayer = createImageLayer(imageUrl, width, height);
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success("Imagem adicionada");
  }, []);

  // Update layer
  const updateLayer = useCallback((layerId: string, updates: Partial<TextLayer> | Partial<ImageLayer>) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;
      if (l.type === 'text') {
        return { ...l, ...updates } as TextLayer;
      }
      return { ...l, ...updates } as ImageLayer;
    }));
  }, []);

  // Delete layer
  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
    toast.success("Camada removida");
  }, [selectedLayerId]);

  // Duplicate layer
  const duplicateLayer = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const newLayer = {
      ...layer,
      id: generateLayerId(),
      x: Math.min(layer.x + 0.05, 0.95),
      y: Math.min(layer.y + 0.05, 0.95),
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
    toast.success("Camada duplicada");
  }, [layers]);

  // Move layer up/down in z-order
  const moveLayerOrder = useCallback((layerId: string, direction: "up" | "down") => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === layerId);
      if (idx === -1) return prev;
      
      const newIdx = direction === "up" ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      
      const newLayers = [...prev];
      [newLayers[idx], newLayers[newIdx]] = [newLayers[newIdx], newLayers[idx]];
      return newLayers;
    });
  }, []);

  // Handle drag on canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!selectedLayerId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedLayerId || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    
    const layer = layers.find(l => l.id === selectedLayerId);
    if (layer) {
      updateLayer(selectedLayerId, {
        x: Math.max(0, Math.min(1, layer.x + dx)),
        y: Math.max(0, Math.min(1, layer.y + dy)),
      });
    }
    
    setDragStart({ x, y });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Save text edit
  const saveTextEdit = () => {
    if (editingText && tempText.trim()) {
      updateLayer(editingText, { text: tempText } as Partial<TextLayer>);
    }
    setEditingText(null);
    setTempText("");
  };

  // File input for images
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        addImageLayer(ev.target?.result as string, img.width, img.height);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("flex flex-col lg:flex-row gap-4 h-full", className)}>
      {/* Left Panel - Tools & Layers */}
      <div className="w-full lg:w-72 space-y-4">
        {/* Add Elements */}
        <Card className="bg-white/5 border-white/10 p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Plus size={16} className="text-purple-400" />
            Adicionar Elemento
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-gray-700 hover:bg-purple-600/20 hover:border-purple-500"
              onClick={addTextLayer}
            >
              <Type size={16} className="mr-2" />
              Texto
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 hover:bg-purple-600/20 hover:border-purple-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={16} className="mr-2" />
              Imagem
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </Card>

        {/* Print Positions */}
        {availablePositions.length > 1 && (
          <Card className="bg-white/5 border-white/10 p-4">
            <h4 className="font-semibold mb-3">Posição de Impressão</h4>
            <div className="flex flex-wrap gap-2">
              {availablePositions.map(pos => (
                <Button
                  key={pos}
                  size="sm"
                  variant={activePosition === pos ? "default" : "outline"}
                  className={cn(
                    activePosition === pos 
                      ? "bg-purple-600" 
                      : "border-gray-700"
                  )}
                  onClick={() => setActivePosition(pos)}
                >
                  {POSITION_LABELS[pos] || pos}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Layers List */}
        <Card className="bg-white/5 border-white/10 p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Layers size={16} className="text-purple-400" />
            Camadas ({layers.length}/20)
          </h4>
          
          {layers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhuma camada ainda.<br />Adicione texto ou imagem.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {[...layers].reverse().map((layer, idx) => (
                <motion.div
                  key={layer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                    selectedLayerId === layer.id 
                      ? "bg-purple-600/30 border border-purple-500" 
                      : "bg-white/5 hover:bg-white/10"
                  )}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  {layer.type === "text" ? (
                    <Type size={14} className="text-purple-400" />
                  ) : (
                    <ImageIcon size={14} className="text-blue-400" />
                  )}
                  <span className="flex-1 text-sm truncate">
                    {layer.type === "text" 
                      ? (layer as TextLayer).text.substring(0, 20) + ((layer as TextLayer).text.length > 20 ? "..." : "")
                      : "Imagem"
                    }
                  </span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveLayerOrder(layer.id, "up"); }}
                      className="p-1 hover:bg-white/10 rounded"
                      disabled={idx === 0}
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); moveLayerOrder(layer.id, "down"); }}
                      className="p-1 hover:bg-white/10 rounded"
                      disabled={idx === layers.length - 1}
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Copy size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Center - Canvas Preview */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut size={16} />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
              <ZoomIn size={16} />
            </Button>
          </div>
          <Button 
            size="sm" 
            variant={showGrid ? "default" : "outline"}
            className={showGrid ? "bg-purple-600" : "border-gray-700"}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid size={14} className="mr-1" />
            Grade
          </Button>
        </div>

        {/* Canvas */}
        <div 
          ref={containerRef}
          className="relative flex-1 bg-gray-900 rounded-xl overflow-hidden border border-gray-800"
          style={{ minHeight: "400px" }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Product Image */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="relative">
              <img 
                src={productImage} 
                alt="Product" 
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: "500px" }}
              />
              
              {/* Print Area Overlay */}
              <div 
                className={cn(
                  "absolute border-2 border-dashed",
                  showGrid ? "border-purple-500/50" : "border-transparent"
                )}
                style={{
                  left: `${(printAreaX - printAreaScale / 2) * 100}%`,
                  top: `${(printAreaY - printAreaScale / 2) * 100}%`,
                  width: `${printAreaScale * 100}%`,
                  height: `${printAreaScale * 100}%`,
                }}
              >
                {/* Grid Lines */}
                {showGrid && (
                  <>
                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-purple-500/30" />
                    <div className="absolute top-1/2 left-0 right-0 border-t border-purple-500/30" />
                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-purple-500/20" />
                    <div className="absolute left-3/4 top-0 bottom-0 border-l border-purple-500/20" />
                    <div className="absolute top-1/4 left-0 right-0 border-t border-purple-500/20" />
                    <div className="absolute top-3/4 left-0 right-0 border-t border-purple-500/20" />
                  </>
                )}

                {/* Render Layers */}
                {layers.map(layer => (
                  <div
                    key={layer.id}
                    className={cn(
                      "absolute cursor-move transition-shadow",
                      selectedLayerId === layer.id && "ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent"
                    )}
                    style={{
                      left: `${layer.x * 100}%`,
                      top: `${layer.y * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${layer.angle}deg) scale(${layer.scale})`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (layer.type === "text") {
                        setEditingText(layer.id);
                        setTempText((layer as TextLayer).text);
                      }
                    }}
                  >
                    {layer.type === "text" ? (
                      <div
                        style={{
                          fontFamily: (layer as TextLayer).fontFamily,
                          fontWeight: (layer as TextLayer).fontWeight,
                          fontSize: `${(layer as TextLayer).fontSize / 10}px`,
                          color: (layer as TextLayer).color,
                          textAlign: (layer as TextLayer).textAlign,
                          letterSpacing: `${(layer as TextLayer).letterSpacing || 0}px`,
                          lineHeight: (layer as TextLayer).lineHeight || 1.2,
                          textShadow: (layer as TextLayer).shadow 
                            ? `${(layer as TextLayer).shadow!.offsetX}px ${(layer as TextLayer).shadow!.offsetY}px ${(layer as TextLayer).shadow!.blur}px ${(layer as TextLayer).shadow!.color}`
                            : undefined,
                          WebkitTextStroke: (layer as TextLayer).strokeColor 
                            ? `${(layer as TextLayer).strokeWidth}px ${(layer as TextLayer).strokeColor}`
                            : undefined,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {(layer as TextLayer).text}
                      </div>
                    ) : (
                      <img
                        src={(layer as ImageLayer).imageUrl}
                        alt="Design"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "200px",
                          objectFit: "contain",
                        }}
                        draggable={false}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-full lg:w-80 space-y-4">
        <AnimatePresence mode="wait">
          {selectedLayer ? (
            <motion.div
              key={selectedLayerId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Text Properties */}
              {selectedLayer.type === "text" && (
                <>
                  {/* Text Content */}
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Type size={16} className="text-purple-400" />
                      Texto
                    </h4>
                    <Textarea
                      value={editingText === selectedLayerId ? tempText : (selectedLayer as TextLayer).text}
                      onChange={(e) => {
                        if (editingText === selectedLayerId) {
                          setTempText(e.target.value);
                        } else {
                          updateLayer(selectedLayerId!, { text: e.target.value } as Partial<TextLayer>);
                        }
                      }}
                      onBlur={editingText === selectedLayerId ? saveTextEdit : undefined}
                      className="bg-white/5 border-gray-700 min-h-[80px]"
                      placeholder="Digite seu texto..."
                    />
                  </Card>

                  {/* Font Settings */}
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="font-semibold mb-3">Fonte</h4>
                    <div className="space-y-3">
                      <Select
                        value={AVAILABLE_FONTS.find(f => f.family === (selectedLayer as TextLayer).fontFamily)?.id || "inter"}
                        onValueChange={(v) => {
                          const font = AVAILABLE_FONTS.find(f => f.id === v);
                          if (font) updateLayer(selectedLayerId!, { fontFamily: font.family } as Partial<TextLayer>);
                        }}
                      >
                        <SelectTrigger className="bg-white/5 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          {AVAILABLE_FONTS.map(font => (
                            <SelectItem key={font.id} value={font.id}>
                              <span style={{ fontFamily: font.family }}>{font.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-gray-400">Peso</Label>
                          <Select
                            value={String((selectedLayer as TextLayer).fontWeight)}
                            onValueChange={(v) => updateLayer(selectedLayerId!, { fontWeight: parseInt(v) } as Partial<TextLayer>)}
                          >
                            <SelectTrigger className="bg-white/5 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              {[400, 500, 600, 700, 800, 900].map(w => (
                                <SelectItem key={w} value={String(w)}>
                                  {w === 400 ? "Normal" : w === 700 ? "Bold" : w}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">Tamanho</Label>
                          <Select
                            value={String((selectedLayer as TextLayer).fontSize)}
                            onValueChange={(v) => updateLayer(selectedLayerId!, { fontSize: parseInt(v) } as Partial<TextLayer>)}
                          >
                            <SelectTrigger className="bg-white/5 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              {FONT_SIZE_PRESETS.map(s => (
                                <SelectItem key={s.value} value={String(s.value)}>
                                  {s.name} ({s.label})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Text Alignment */}
                      <div>
                        <Label className="text-xs text-gray-400">Alinhamento</Label>
                        <div className="flex gap-1 mt-1">
                          {([
                            { value: "left", icon: AlignLeft },
                            { value: "center", icon: AlignCenter },
                            { value: "right", icon: AlignRight },
                          ] as const).map(({ value, icon: Icon }) => (
                            <Button
                              key={value}
                              size="sm"
                              variant={(selectedLayer as TextLayer).textAlign === value ? "default" : "outline"}
                              className={cn(
                                (selectedLayer as TextLayer).textAlign === value 
                                  ? "bg-purple-600" 
                                  : "border-gray-700"
                              )}
                              onClick={() => updateLayer(selectedLayerId!, { textAlign: value } as Partial<TextLayer>)}
                            >
                              <Icon size={14} />
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Colors */}
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Palette size={16} className="text-purple-400" />
                      Cores
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-400">Cor do Texto</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {COLOR_PALETTE.slice(0, 15).map(color => (
                            <button
                              key={color}
                              className={cn(
                                "w-6 h-6 rounded border-2 transition-all",
                                (selectedLayer as TextLayer).color === color 
                                  ? "border-white scale-110" 
                                  : "border-transparent hover:scale-110"
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() => updateLayer(selectedLayerId!, { color } as Partial<TextLayer>)}
                            />
                          ))}
                        </div>
                        <Input
                          type="color"
                          value={(selectedLayer as TextLayer).color}
                          onChange={(e) => updateLayer(selectedLayerId!, { color: e.target.value } as Partial<TextLayer>)}
                          className="w-full h-8 mt-2 bg-white/5 border-gray-700"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400">Contorno</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="color"
                            value={(selectedLayer as TextLayer).strokeColor || "#000000"}
                            onChange={(e) => updateLayer(selectedLayerId!, { strokeColor: e.target.value } as Partial<TextLayer>)}
                            className="w-12 h-8 bg-white/5 border-gray-700"
                          />
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            value={(selectedLayer as TextLayer).strokeWidth || 0}
                            onChange={(e) => updateLayer(selectedLayerId!, { strokeWidth: parseInt(e.target.value) || 0 } as Partial<TextLayer>)}
                            className="flex-1 bg-white/5 border-gray-700"
                            placeholder="Espessura"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Effects */}
                  <Card className="bg-white/5 border-white/10 p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-400" />
                      Efeitos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TEXT_EFFECTS).map(([key, effect]) => (
                        <Button
                          key={key}
                          size="sm"
                          variant="outline"
                          className="border-gray-700 hover:bg-purple-600/20"
                          onClick={() => {
                            const updates = effect.apply(selectedLayer as TextLayer);
                            updateLayer(selectedLayerId!, updates as Partial<TextLayer>);
                            toast.success(`Efeito "${effect.name}" aplicado`);
                          }}
                        >
                          {effect.name}
                        </Button>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Position & Transform */}
              <Card className="bg-white/5 border-white/10 p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Move size={16} className="text-purple-400" />
                  Posição & Transformação
                </h4>
                <div className="space-y-4">
                  {/* Quick Positions */}
                  <div>
                    <Label className="text-xs text-gray-400">Posição Rápida</Label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {Object.entries(POSITION_PRESETS).slice(0, 9).map(([key, preset]) => (
                        <Button
                          key={key}
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-xs px-2"
                          onClick={() => updateLayer(selectedLayerId!, { x: preset.x, y: preset.y })}
                        >
                          {preset.name.split(" ")[0]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* X Position */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Horizontal (X)</span>
                      <span>{Math.round(selectedLayer.x * 100)}%</span>
                    </div>
                    <Slider
                      value={[selectedLayer.x * 100]}
                      onValueChange={([v]: number[]) => updateLayer(selectedLayerId!, { x: v / 100 })}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Y Position */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Vertical (Y)</span>
                      <span>{Math.round(selectedLayer.y * 100)}%</span>
                    </div>
                    <Slider
                      value={[selectedLayer.y * 100]}
                      onValueChange={([v]: number[]) => updateLayer(selectedLayerId!, { y: v / 100 })}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Scale */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Escala</span>
                      <span>{Math.round(selectedLayer.scale * 100)}%</span>
                    </div>
                    <Slider
                      value={[selectedLayer.scale * 100]}
                      onValueChange={([v]: number[]) => updateLayer(selectedLayerId!, { scale: v / 100 })}
                      min={10}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex gap-1 mt-2">
                      {SCALE_PRESETS.map(s => (
                        <Button
                          key={s.value}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-700 text-xs px-1"
                          onClick={() => updateLayer(selectedLayerId!, { scale: s.value })}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Rotação</span>
                      <span>{selectedLayer.angle}°</span>
                    </div>
                    <Slider
                      value={[selectedLayer.angle]}
                      onValueChange={([v]: number[]) => updateLayer(selectedLayerId!, { angle: v })}
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex gap-1 mt-2">
                      {ANGLE_PRESETS.slice(0, 5).map(a => (
                        <Button
                          key={a.value}
                          size="sm"
                          variant="outline"
                          className="flex-1 border-gray-700 text-xs px-1"
                          onClick={() => updateLayer(selectedLayerId!, { angle: a.value })}
                        >
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-gray-500"
            >
              <Layers size={48} className="mb-4 opacity-50" />
              <p className="text-center">
                Selecione uma camada<br />para editar suas propriedades
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
