/**
 * Design Editor Utilities
 * Handles text-to-image generation and design layer management
 */

// Available fonts for text designs
export const AVAILABLE_FONTS = [
  { id: 'inter', name: 'Inter', family: 'Inter, sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif', weights: [400, 500, 700, 900] },
  { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif', weights: [400, 500, 600, 700, 800] },
  { id: 'montserrat', name: 'Montserrat', family: 'Montserrat, sans-serif', weights: [400, 500, 600, 700, 800, 900] },
  { id: 'oswald', name: 'Oswald', family: 'Oswald, sans-serif', weights: [400, 500, 600, 700] },
  { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif', weights: [400, 500, 600, 700, 800, 900] },
  { id: 'bebas', name: 'Bebas Neue', family: 'Bebas Neue, cursive', weights: [400] },
  { id: 'dancing', name: 'Dancing Script', family: 'Dancing Script, cursive', weights: [400, 500, 600, 700] },
  { id: 'permanent', name: 'Permanent Marker', family: 'Permanent Marker, cursive', weights: [400] },
  { id: 'anton', name: 'Anton', family: 'Anton, sans-serif', weights: [400] },
  { id: 'lobster', name: 'Lobster', family: 'Lobster, cursive', weights: [400] },
  { id: 'pacifico', name: 'Pacifico', family: 'Pacifico, cursive', weights: [400] },
  { id: 'righteous', name: 'Righteous', family: 'Righteous, cursive', weights: [400] },
  { id: 'archivo', name: 'Archivo Black', family: 'Archivo Black, sans-serif', weights: [400] },
  { id: 'abril', name: 'Abril Fatface', family: 'Abril Fatface, cursive', weights: [400] },
];

// Print area positions available on different products
export const PRINT_POSITIONS = {
  apparel: ['front', 'back', 'left_sleeve', 'right_sleeve', 'neck_label'],
  mug: ['front', 'back', 'wrap'],
  poster: ['front'],
  canvas: ['front'],
  phone_case: ['front', 'back'],
  pillow: ['front', 'back'],
  tote_bag: ['front', 'back'],
} as const;

// Position labels in Portuguese
export const POSITION_LABELS: Record<string, string> = {
  front: 'Frente',
  back: 'Costas',
  left_sleeve: 'Manga Esquerda',
  right_sleeve: 'Manga Direita',
  neck_label: 'Etiqueta Gola',
  wrap: 'Envolvente',
  inside_left: 'Interior Esquerdo',
  inside_right: 'Interior Direito',
};

// Design layer types
export interface TextLayer {
  type: 'text';
  id: string;
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number; // in pixels
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  scale: number;
  angle: number; // degrees
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface ImageLayer {
  type: 'image';
  id: string;
  imageUrl: string;
  printifyImageId?: string;
  width: number;
  height: number;
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  scale: number;
  angle: number; // degrees
}

export type DesignLayer = TextLayer | ImageLayer;

export interface PrintArea {
  position: string;
  layers: DesignLayer[];
  width: number; // placeholder width in pixels
  height: number; // placeholder height in pixels
}

export interface DesignProject {
  id: string;
  name: string;
  printAreas: PrintArea[];
  createdAt: Date;
  updatedAt: Date;
}

// Generate unique layer ID
export function generateLayerId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new text layer with defaults
export function createTextLayer(text: string, overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    type: 'text',
    id: generateLayerId(),
    text,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 700,
    fontSize: 72,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 1.2,
    x: 0.5,
    y: 0.5,
    scale: 1,
    angle: 0,
    ...overrides,
  };
}

// Create a new image layer
export function createImageLayer(imageUrl: string, width: number, height: number, overrides: Partial<ImageLayer> = {}): ImageLayer {
  return {
    type: 'image',
    id: generateLayerId(),
    imageUrl,
    width,
    height,
    x: 0.5,
    y: 0.5,
    scale: 1,
    angle: 0,
    ...overrides,
  };
}

// Render text layer to canvas and return data URL
export async function renderTextToImage(
  layer: TextLayer,
  canvasWidth: number = 4000,
  canvasHeight: number = 4000
): Promise<{ dataUrl: string; width: number; height: number }> {
  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Clear canvas (transparent)
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Load font (ensure it's loaded)
  await document.fonts.load(`${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`);

  // Configure text style
  ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
  ctx.textAlign = layer.textAlign;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = layer.color;

  // Letter spacing (approximate)
  if (layer.letterSpacing && layer.letterSpacing !== 0) {
    ctx.letterSpacing = `${layer.letterSpacing}px`;
  }

  // Apply shadow if present
  if (layer.shadow) {
    ctx.shadowColor = layer.shadow.color;
    ctx.shadowBlur = layer.shadow.blur;
    ctx.shadowOffsetX = layer.shadow.offsetX;
    ctx.shadowOffsetY = layer.shadow.offsetY;
  }

  // Calculate position
  const x = layer.textAlign === 'center' ? canvasWidth / 2 : 
            layer.textAlign === 'right' ? canvasWidth - 50 : 50;
  const y = canvasHeight / 2;

  // Handle multiline text
  const lines = layer.text.split('\n');
  const lineHeightPx = layer.fontSize * (layer.lineHeight || 1.2);
  const totalHeight = lines.length * lineHeightPx;
  const startY = y - totalHeight / 2 + lineHeightPx / 2;

  // Draw stroke first if present
  if (layer.strokeColor && layer.strokeWidth && layer.strokeWidth > 0) {
    ctx.strokeStyle = layer.strokeColor;
    ctx.lineWidth = layer.strokeWidth;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    lines.forEach((line, i) => {
      ctx.strokeText(line, x, startY + i * lineHeightPx);
    });
  }

  // Draw fill text
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeightPx);
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvasWidth,
    height: canvasHeight,
  };
}

// Render multiple layers to a single canvas
export async function renderLayersToImage(
  layers: DesignLayer[],
  areaWidth: number = 4500,
  areaHeight: number = 5100
): Promise<{ dataUrl: string; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = areaWidth;
  canvas.height = areaHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Clear canvas (transparent)
  ctx.clearRect(0, 0, areaWidth, areaHeight);

  // Render each layer
  for (const layer of layers) {
    ctx.save();

    // Calculate position (x, y are 0-1 values)
    const posX = layer.x * areaWidth;
    const posY = layer.y * areaHeight;

    // Apply transformations
    ctx.translate(posX, posY);
    ctx.rotate((layer.angle * Math.PI) / 180);
    ctx.scale(layer.scale, layer.scale);

    if (layer.type === 'text') {
      // Render text directly
      await document.fonts.load(`${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`);
      
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.textAlign = layer.textAlign;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = layer.color;

      if (layer.shadow) {
        ctx.shadowColor = layer.shadow.color;
        ctx.shadowBlur = layer.shadow.blur;
        ctx.shadowOffsetX = layer.shadow.offsetX;
        ctx.shadowOffsetY = layer.shadow.offsetY;
      }

      const lines = layer.text.split('\n');
      const lineHeightPx = layer.fontSize * (layer.lineHeight || 1.2);
      const totalHeight = lines.length * lineHeightPx;
      const startY = -totalHeight / 2 + lineHeightPx / 2;

      // Draw stroke
      if (layer.strokeColor && layer.strokeWidth) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth;
        ctx.lineJoin = 'round';
        lines.forEach((line, i) => {
          ctx.strokeText(line, 0, startY + i * lineHeightPx);
        });
      }

      // Draw text
      lines.forEach((line, i) => {
        ctx.fillText(line, 0, startY + i * lineHeightPx);
      });
    } else {
      // Render image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const drawWidth = layer.width;
          const drawHeight = layer.height;
          ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          resolve();
        };
        img.onerror = reject;
        img.src = layer.imageUrl;
      });
    }

    ctx.restore();
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: areaWidth,
    height: areaHeight,
  };
}

// Convert data URL to base64 (without prefix)
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
}

// Calculate optimal scale for design to fit in print area
export function calculateOptimalScale(
  designWidth: number,
  designHeight: number,
  areaWidth: number,
  areaHeight: number,
  padding: number = 0.1 // 10% padding
): number {
  const maxWidth = areaWidth * (1 - padding * 2);
  const maxHeight = areaHeight * (1 - padding * 2);
  
  const scaleX = maxWidth / designWidth;
  const scaleY = maxHeight / designHeight;
  
  return Math.min(scaleX, scaleY, 1);
}

// Preset text effects
export const TEXT_EFFECTS = {
  none: {
    name: 'Nenhum',
    apply: (layer: TextLayer): Partial<TextLayer> => ({}),
  },
  shadow: {
    name: 'Sombra',
    apply: (layer: TextLayer): Partial<TextLayer> => ({
      shadow: {
        color: 'rgba(0,0,0,0.5)',
        blur: 10,
        offsetX: 5,
        offsetY: 5,
      },
    }),
  },
  outline: {
    name: 'Contorno',
    apply: (layer: TextLayer): Partial<TextLayer> => ({
      strokeColor: '#000000',
      strokeWidth: 4,
    }),
  },
  outlineWhite: {
    name: 'Contorno Branco',
    apply: (layer: TextLayer): Partial<TextLayer> => ({
      strokeColor: '#FFFFFF',
      strokeWidth: 4,
    }),
  },
  neon: {
    name: 'Neon',
    apply: (layer: TextLayer): Partial<TextLayer> => ({
      shadow: {
        color: layer.color,
        blur: 20,
        offsetX: 0,
        offsetY: 0,
      },
    }),
  },
  vintage: {
    name: 'Vintage',
    apply: (layer: TextLayer): Partial<TextLayer> => ({
      color: '#D4A574',
      strokeColor: '#8B4513',
      strokeWidth: 2,
    }),
  },
};

// Preset positions for quick placement
export const POSITION_PRESETS = {
  center: { x: 0.5, y: 0.5, name: 'Centro' },
  topCenter: { x: 0.5, y: 0.25, name: 'Topo Centro' },
  bottomCenter: { x: 0.5, y: 0.75, name: 'Baixo Centro' },
  topLeft: { x: 0.25, y: 0.25, name: 'Topo Esquerda' },
  topRight: { x: 0.75, y: 0.25, name: 'Topo Direita' },
  bottomLeft: { x: 0.25, y: 0.75, name: 'Baixo Esquerda' },
  bottomRight: { x: 0.75, y: 0.75, name: 'Baixo Direita' },
  leftCenter: { x: 0.25, y: 0.5, name: 'Esquerda Centro' },
  rightCenter: { x: 0.75, y: 0.5, name: 'Direita Centro' },
  pocket: { x: 0.25, y: 0.3, name: 'Bolso' }, // Common for pocket prints
  chest: { x: 0.5, y: 0.35, name: 'Peito' },
  belly: { x: 0.5, y: 0.6, name: 'Barriga' },
};

// Common text sizes (in pixels for 4000px canvas)
export const FONT_SIZE_PRESETS = [
  { label: 'PP', value: 36, name: 'Muito Pequeno' },
  { label: 'P', value: 48, name: 'Pequeno' },
  { label: 'M', value: 72, name: 'Médio' },
  { label: 'G', value: 96, name: 'Grande' },
  { label: 'GG', value: 144, name: 'Muito Grande' },
  { label: 'XG', value: 192, name: 'Extra Grande' },
  { label: 'XXG', value: 256, name: 'Gigante' },
];

// Scale presets
export const SCALE_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
];

// Angle presets
export const ANGLE_PRESETS = [
  { label: '0°', value: 0 },
  { label: '15°', value: 15 },
  { label: '30°', value: 30 },
  { label: '45°', value: 45 },
  { label: '90°', value: 90 },
  { label: '-15°', value: -15 },
  { label: '-30°', value: -30 },
  { label: '-45°', value: -45 },
];

// Common colors palette
export const COLOR_PALETTE = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF6B00', '#8B5CF6',
  '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#14B8A6',
  '#EF4444', '#22C55E', '#3B82F6', '#A855F7', '#F97316',
  '#D4A574', '#8B4513', '#FFD700', '#C0C0C0', '#B87333',
];
