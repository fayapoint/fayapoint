/**
 * API Route to render text to PNG image
 * Uses server-side canvas rendering with sharp or node-canvas
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Text rendering configuration
interface TextRenderConfig {
  text: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

// Generate SVG text (browser/server compatible approach)
function generateTextSVG(config: TextRenderConfig): string {
  const {
    text,
    fontFamily = 'Arial, sans-serif',
    fontWeight = 700,
    fontSize = 72,
    color = '#FFFFFF',
    strokeColor,
    strokeWidth = 0,
    textAlign = 'center',
    letterSpacing = 0,
    lineHeight = 1.2,
    canvasWidth = 4000,
    canvasHeight = 4000,
    shadow,
  } = config;

  const lines = text.split('\n');
  const lineHeightPx = fontSize * lineHeight;
  const totalTextHeight = lines.length * lineHeightPx;
  
  // Calculate text anchor based on alignment
  const textAnchor = textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
  const xPos = textAlign === 'center' ? canvasWidth / 2 : textAlign === 'right' ? canvasWidth - 50 : 50;
  const startY = (canvasHeight - totalTextHeight) / 2 + fontSize * 0.35;

  // Build SVG
  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <defs>`;

  // Add shadow filter if needed
  if (shadow) {
    svgContent += `
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="${shadow.offsetX}" dy="${shadow.offsetY}" stdDeviation="${shadow.blur / 2}" flood-color="${shadow.color}" flood-opacity="0.5"/>
    </filter>`;
  }

  svgContent += `
  </defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&amp;family=Roboto:wght@400;500;700;900&amp;family=Poppins:wght@400;500;600;700;800&amp;family=Montserrat:wght@400;500;600;700;800;900&amp;family=Oswald:wght@400;500;600;700&amp;family=Playfair+Display:wght@400;500;600;700;800;900&amp;family=Bebas+Neue&amp;family=Dancing+Script:wght@400;500;600;700&amp;family=Permanent+Marker&amp;family=Anton&amp;family=Lobster&amp;family=Pacifico&amp;family=Righteous&amp;family=Archivo+Black&amp;family=Abril+Fatface&amp;display=swap');
    .text-layer {
      font-family: ${fontFamily};
      font-weight: ${fontWeight};
      font-size: ${fontSize}px;
      letter-spacing: ${letterSpacing}px;
      fill: ${color};${strokeColor && strokeWidth > 0 ? `
      stroke: ${strokeColor};
      stroke-width: ${strokeWidth}px;
      paint-order: stroke fill;` : ''}${shadow ? `
      filter: url(#shadow);` : ''}
    }
  </style>`;

  // Add text elements
  lines.forEach((line, i) => {
    const y = startY + i * lineHeightPx;
    svgContent += `
  <text x="${xPos}" y="${y}" text-anchor="${textAnchor}" class="text-layer">${escapeXml(line)}</text>`;
  });

  svgContent += '\n</svg>';

  return svgContent;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// POST - Render text to SVG (can be converted to PNG client-side or uploaded as is)
export async function POST(request: NextRequest) {
  try {
    const config: TextRenderConfig = await request.json();

    if (!config.text || config.text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const svg = generateTextSVG(config);
    
    // Convert SVG to base64 data URL
    const base64 = Buffer.from(svg).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return NextResponse.json({
      success: true,
      svg,
      dataUrl,
      width: config.canvasWidth || 4000,
      height: config.canvasHeight || 4000,
    });
  } catch (error) {
    console.error('[Render Text API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to render text', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// GET - Get available fonts
export async function GET() {
  const fonts = [
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

  return NextResponse.json({ fonts });
}
