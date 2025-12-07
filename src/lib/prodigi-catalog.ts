/**
 * Prodigi Product Catalog with Mockup Images
 * Complete catalog with product images, print areas, and base prices
 */

// Product with full mockup info
export interface ProdigiCatalogProduct {
  sku: string;
  name: string;
  size: string;
  category: string;
  mockupImage: string;
  printArea: { x: number; y: number; width: number; height: number };
  aspectRatio: string;
  printDimensions: { widthPx: number; heightPx: number };
  basePriceGBP: number;
}

// Category metadata
export interface ProdigiCategoryInfo {
  key: string;
  name: string;
  namePT: string;
  description: string;
  icon: string;
  image: string;
}

export const PRODIGI_CATEGORIES: ProdigiCategoryInfo[] = [
  { key: 'canvas', name: 'Canvas Prints', namePT: 'Quadros Canvas', description: 'Premium stretched canvas prints', icon: 'Frame', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=400&fit=crop' },
  { key: 'framedPrints', name: 'Framed Prints', namePT: 'Quadros Emoldurados', description: 'Museum-quality framed prints', icon: 'Frame', image: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=400&h=400&fit=crop' },
  { key: 'fineArtPrints', name: 'Fine Art Prints', namePT: 'Impressões Fine Art', description: 'Giclée prints on archival paper', icon: 'Palette', image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=400&fit=crop' },
  { key: 'posters', name: 'Posters', namePT: 'Posters', description: 'High-quality photo posters', icon: 'Image', image: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=400&h=400&fit=crop' },
  { key: 'metalPrints', name: 'Metal Prints', namePT: 'Quadros em Metal', description: 'Vivid HD metal prints', icon: 'Square', image: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=400&h=400&fit=crop' },
  { key: 'acrylicPrints', name: 'Acrylic Prints', namePT: 'Quadros em Acrílico', description: 'Modern acrylic face mount', icon: 'Gem', image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=400&fit=crop' },
  { key: 'phoneCases', name: 'Phone Cases', namePT: 'Capinhas de Celular', description: 'Custom phone cases', icon: 'Smartphone', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop' },
  { key: 'mugs', name: 'Mugs', namePT: 'Canecas', description: 'Ceramic and enamel mugs', icon: 'Coffee', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop' },
  { key: 'greetingCards', name: 'Greeting Cards', namePT: 'Cartões', description: 'Premium greeting cards', icon: 'Mail', image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&h=400&fit=crop' },
  { key: 'calendars', name: 'Calendars', namePT: 'Calendários', description: 'Wall calendars', icon: 'Calendar', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=400&fit=crop' },
  { key: 'photobooks', name: 'Photobooks', namePT: 'Fotolivros', description: 'Hardcover photobooks', icon: 'Book', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
];

export const PRODIGI_CATALOG: Record<string, ProdigiCatalogProduct[]> = {
  canvas: [
    { sku: 'GLOBAL-CAN-10X10', name: 'Canvas 25x25cm', size: '10x10"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop', printArea: { x: 10, y: 10, width: 80, height: 80 }, aspectRatio: '1:1', printDimensions: { widthPx: 3000, heightPx: 3000 }, basePriceGBP: 18 },
    { sku: 'GLOBAL-CAN-12X12', name: 'Canvas 30x30cm', size: '12x12"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop', printArea: { x: 10, y: 10, width: 80, height: 80 }, aspectRatio: '1:1', printDimensions: { widthPx: 3600, heightPx: 3600 }, basePriceGBP: 22 },
    { sku: 'GLOBAL-CAN-16X16', name: 'Canvas 40x40cm', size: '16x16"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop', printArea: { x: 10, y: 10, width: 80, height: 80 }, aspectRatio: '1:1', printDimensions: { widthPx: 4800, heightPx: 4800 }, basePriceGBP: 32 },
    { sku: 'GLOBAL-CAN-20X20', name: 'Canvas 50x50cm', size: '20x20"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&h=800&fit=crop', printArea: { x: 10, y: 10, width: 80, height: 80 }, aspectRatio: '1:1', printDimensions: { widthPx: 6000, heightPx: 6000 }, basePriceGBP: 45 },
    { sku: 'GLOBAL-CAN-8X10', name: 'Canvas 20x25cm', size: '8x10"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=640&h=800&fit=crop', printArea: { x: 10, y: 8, width: 80, height: 84 }, aspectRatio: '4:5', printDimensions: { widthPx: 2400, heightPx: 3000 }, basePriceGBP: 16 },
    { sku: 'GLOBAL-CAN-12X16', name: 'Canvas 30x40cm', size: '12x16"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop', printArea: { x: 10, y: 8, width: 80, height: 84 }, aspectRatio: '3:4', printDimensions: { widthPx: 3600, heightPx: 4800 }, basePriceGBP: 28 },
    { sku: 'GLOBAL-CAN-16X20', name: 'Canvas 40x50cm', size: '16x20"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=640&h=800&fit=crop', printArea: { x: 10, y: 8, width: 80, height: 84 }, aspectRatio: '4:5', printDimensions: { widthPx: 4800, heightPx: 6000 }, basePriceGBP: 38 },
    { sku: 'GLOBAL-CAN-18X24', name: 'Canvas 45x60cm', size: '18x24"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=800&fit=crop', printArea: { x: 10, y: 8, width: 80, height: 84 }, aspectRatio: '3:4', printDimensions: { widthPx: 5400, heightPx: 7200 }, basePriceGBP: 48 },
    { sku: 'GLOBAL-CAN-20X30', name: 'Canvas 50x75cm', size: '20x30"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=533&h=800&fit=crop', printArea: { x: 10, y: 7, width: 80, height: 86 }, aspectRatio: '2:3', printDimensions: { widthPx: 6000, heightPx: 9000 }, basePriceGBP: 58 },
    { sku: 'GLOBAL-CAN-24X36', name: 'Canvas 60x90cm', size: '24x36"', category: 'Wall Art', mockupImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=533&h=800&fit=crop', printArea: { x: 10, y: 7, width: 80, height: 86 }, aspectRatio: '2:3', printDimensions: { widthPx: 7200, heightPx: 10800 }, basePriceGBP: 75 },
  ],
  framedPrints: [
    { sku: 'GLOBAL-CFPM-8X10', name: 'Framed Print 20x25cm', size: '8x10"', category: 'Framed', mockupImage: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=640&h=800&fit=crop', printArea: { x: 12, y: 10, width: 76, height: 80 }, aspectRatio: '4:5', printDimensions: { widthPx: 2400, heightPx: 3000 }, basePriceGBP: 28 },
    { sku: 'GLOBAL-CFPM-12X16', name: 'Framed Print 30x40cm', size: '12x16"', category: 'Framed', mockupImage: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=600&h=800&fit=crop', printArea: { x: 12, y: 10, width: 76, height: 80 }, aspectRatio: '3:4', printDimensions: { widthPx: 3600, heightPx: 4800 }, basePriceGBP: 42 },
    { sku: 'GLOBAL-CFPM-16X20', name: 'Framed Print 40x50cm', size: '16x20"', category: 'Framed', mockupImage: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=640&h=800&fit=crop', printArea: { x: 12, y: 10, width: 76, height: 80 }, aspectRatio: '4:5', printDimensions: { widthPx: 4800, heightPx: 6000 }, basePriceGBP: 55 },
    { sku: 'GLOBAL-CFPM-18X24', name: 'Framed Print 45x60cm', size: '18x24"', category: 'Framed', mockupImage: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=600&h=800&fit=crop', printArea: { x: 12, y: 10, width: 76, height: 80 }, aspectRatio: '3:4', printDimensions: { widthPx: 5400, heightPx: 7200 }, basePriceGBP: 68 },
    { sku: 'GLOBAL-CFPM-20X30', name: 'Framed Print 50x75cm', size: '20x30"', category: 'Framed', mockupImage: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=533&h=800&fit=crop', printArea: { x: 12, y: 8, width: 76, height: 84 }, aspectRatio: '2:3', printDimensions: { widthPx: 6000, heightPx: 9000 }, basePriceGBP: 85 },
    { sku: 'GLOBAL-CFPM-24X36', name: 'Framed Print 60x90cm', size: '24x36"', category: 'Framed', mockupImage: 'https://images.unsplash.com/photo-1594737626072-90dc274bc2bd?w=533&h=800&fit=crop', printArea: { x: 12, y: 8, width: 76, height: 84 }, aspectRatio: '2:3', printDimensions: { widthPx: 7200, heightPx: 10800 }, basePriceGBP: 110 },
  ],
  fineArtPrints: [
    { sku: 'GLOBAL-FAP-8X10', name: 'Fine Art Print 20x25cm', size: '8x10"', category: 'Fine Art', mockupImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=640&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '4:5', printDimensions: { widthPx: 2400, heightPx: 3000 }, basePriceGBP: 12 },
    { sku: 'GLOBAL-FAP-10X10', name: 'Fine Art Print 25x25cm', size: '10x10"', category: 'Fine Art', mockupImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '1:1', printDimensions: { widthPx: 3000, heightPx: 3000 }, basePriceGBP: 14 },
    { sku: 'GLOBAL-FAP-12X16', name: 'Fine Art Print 30x40cm', size: '12x16"', category: 'Fine Art', mockupImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 3600, heightPx: 4800 }, basePriceGBP: 22 },
    { sku: 'GLOBAL-FAP-16X20', name: 'Fine Art Print 40x50cm', size: '16x20"', category: 'Fine Art', mockupImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=640&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '4:5', printDimensions: { widthPx: 4800, heightPx: 6000 }, basePriceGBP: 28 },
    { sku: 'GLOBAL-FAP-18X24', name: 'Fine Art Print 45x60cm', size: '18x24"', category: 'Fine Art', mockupImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 5400, heightPx: 7200 }, basePriceGBP: 35 },
    { sku: 'GLOBAL-FAP-20X30', name: 'Fine Art Print 50x75cm', size: '20x30"', category: 'Fine Art', mockupImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=533&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '2:3', printDimensions: { widthPx: 6000, heightPx: 9000 }, basePriceGBP: 42 },
  ],
  posters: [
    { sku: 'GLOBAL-HPR-8X10', name: 'Poster 20x25cm', size: '8x10"', category: 'Posters', mockupImage: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=640&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '4:5', printDimensions: { widthPx: 2400, heightPx: 3000 }, basePriceGBP: 6 },
    { sku: 'GLOBAL-HPR-12X16', name: 'Poster 30x40cm', size: '12x16"', category: 'Posters', mockupImage: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 3600, heightPx: 4800 }, basePriceGBP: 10 },
    { sku: 'GLOBAL-HPR-16X20', name: 'Poster 40x50cm', size: '16x20"', category: 'Posters', mockupImage: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=640&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '4:5', printDimensions: { widthPx: 4800, heightPx: 6000 }, basePriceGBP: 14 },
    { sku: 'GLOBAL-HPR-18X24', name: 'Poster 45x60cm', size: '18x24"', category: 'Posters', mockupImage: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 5400, heightPx: 7200 }, basePriceGBP: 18 },
    { sku: 'GLOBAL-HPR-24X36', name: 'Poster 60x90cm', size: '24x36"', category: 'Posters', mockupImage: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=533&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '2:3', printDimensions: { widthPx: 7200, heightPx: 10800 }, basePriceGBP: 24 },
  ],
  metalPrints: [
    { sku: 'GLOBAL-MET-10X10', name: 'Metal Print 25x25cm', size: '10x10"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&h=800&fit=crop', printArea: { x: 8, y: 8, width: 84, height: 84 }, aspectRatio: '1:1', printDimensions: { widthPx: 3000, heightPx: 3000 }, basePriceGBP: 38 },
    { sku: 'GLOBAL-MET-12X12', name: 'Metal Print 30x30cm', size: '12x12"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&h=800&fit=crop', printArea: { x: 8, y: 8, width: 84, height: 84 }, aspectRatio: '1:1', printDimensions: { widthPx: 3600, heightPx: 3600 }, basePriceGBP: 45 },
    { sku: 'GLOBAL-MET-12X16', name: 'Metal Print 30x40cm', size: '12x16"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=600&h=800&fit=crop', printArea: { x: 8, y: 6, width: 84, height: 88 }, aspectRatio: '3:4', printDimensions: { widthPx: 3600, heightPx: 4800 }, basePriceGBP: 52 },
    { sku: 'GLOBAL-MET-16X20', name: 'Metal Print 40x50cm', size: '16x20"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=640&h=800&fit=crop', printArea: { x: 8, y: 6, width: 84, height: 88 }, aspectRatio: '4:5', printDimensions: { widthPx: 4800, heightPx: 6000 }, basePriceGBP: 72 },
    { sku: 'GLOBAL-MET-18X24', name: 'Metal Print 45x60cm', size: '18x24"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=600&h=800&fit=crop', printArea: { x: 8, y: 6, width: 84, height: 88 }, aspectRatio: '3:4', printDimensions: { widthPx: 5400, heightPx: 7200 }, basePriceGBP: 85 },
    { sku: 'GLOBAL-MET-20X30', name: 'Metal Print 50x75cm', size: '20x30"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=533&h=800&fit=crop', printArea: { x: 8, y: 5, width: 84, height: 90 }, aspectRatio: '2:3', printDimensions: { widthPx: 6000, heightPx: 9000 }, basePriceGBP: 110 },
    { sku: 'GLOBAL-MET-24X36', name: 'Metal Print 60x90cm', size: '24x36"', category: 'Metal', mockupImage: 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=533&h=800&fit=crop', printArea: { x: 8, y: 5, width: 84, height: 90 }, aspectRatio: '2:3', printDimensions: { widthPx: 7200, heightPx: 10800 }, basePriceGBP: 140 },
  ],
  acrylicPrints: [
    { sku: 'GLOBAL-ACRY-10X10', name: 'Acrylic Print 25x25cm', size: '10x10"', category: 'Acrylic', mockupImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&h=800&fit=crop', printArea: { x: 6, y: 6, width: 88, height: 88 }, aspectRatio: '1:1', printDimensions: { widthPx: 3000, heightPx: 3000 }, basePriceGBP: 36 },
    { sku: 'GLOBAL-ACRY-12X16', name: 'Acrylic Print 30x40cm', size: '12x16"', category: 'Acrylic', mockupImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=800&fit=crop', printArea: { x: 6, y: 5, width: 88, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 3600, heightPx: 4800 }, basePriceGBP: 48 },
    { sku: 'GLOBAL-ACRY-16X20', name: 'Acrylic Print 40x50cm', size: '16x20"', category: 'Acrylic', mockupImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=640&h=800&fit=crop', printArea: { x: 6, y: 5, width: 88, height: 90 }, aspectRatio: '4:5', printDimensions: { widthPx: 4800, heightPx: 6000 }, basePriceGBP: 68 },
    { sku: 'GLOBAL-ACRY-18X24', name: 'Acrylic Print 45x60cm', size: '18x24"', category: 'Acrylic', mockupImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=800&fit=crop', printArea: { x: 6, y: 5, width: 88, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 5400, heightPx: 7200 }, basePriceGBP: 85 },
    { sku: 'GLOBAL-ACRY-20X30', name: 'Acrylic Print 50x75cm', size: '20x30"', category: 'Acrylic', mockupImage: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=533&h=800&fit=crop', printArea: { x: 6, y: 4, width: 88, height: 92 }, aspectRatio: '2:3', printDimensions: { widthPx: 6000, heightPx: 9000 }, basePriceGBP: 105 },
  ],
  phoneCases: [
    { sku: 'GLOBAL-TECH-IP15PM-SC-CP', name: 'iPhone 15 Pro Max Case', size: 'Snap', category: 'Phone Cases', mockupImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=600&fit=crop', printArea: { x: 15, y: 10, width: 70, height: 80 }, aspectRatio: '2:3', printDimensions: { widthPx: 1200, heightPx: 2400 }, basePriceGBP: 12 },
    { sku: 'GLOBAL-TECH-IP15-SC-CP', name: 'iPhone 15 Case', size: 'Snap', category: 'Phone Cases', mockupImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=600&fit=crop', printArea: { x: 15, y: 10, width: 70, height: 80 }, aspectRatio: '2:3', printDimensions: { widthPx: 1200, heightPx: 2400 }, basePriceGBP: 12 },
    { sku: 'GLOBAL-TECH-IP14PM-SC-CP', name: 'iPhone 14 Pro Max Case', size: 'Snap', category: 'Phone Cases', mockupImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=600&fit=crop', printArea: { x: 15, y: 10, width: 70, height: 80 }, aspectRatio: '2:3', printDimensions: { widthPx: 1200, heightPx: 2400 }, basePriceGBP: 12 },
    { sku: 'GLOBAL-TECH-IP14-SC-CP', name: 'iPhone 14 Case', size: 'Snap', category: 'Phone Cases', mockupImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=600&fit=crop', printArea: { x: 15, y: 10, width: 70, height: 80 }, aspectRatio: '2:3', printDimensions: { widthPx: 1200, heightPx: 2400 }, basePriceGBP: 12 },
    { sku: 'GLOBAL-TECH-IP13-SC-CP', name: 'iPhone 13 Case', size: 'Snap', category: 'Phone Cases', mockupImage: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=600&fit=crop', printArea: { x: 15, y: 10, width: 70, height: 80 }, aspectRatio: '2:3', printDimensions: { widthPx: 1200, heightPx: 2400 }, basePriceGBP: 12 },
    { sku: 'GLOBAL-TECH-SAMS24U-SC-CP', name: 'Samsung S24 Ultra Case', size: 'Snap', category: 'Phone Cases', mockupImage: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=600&fit=crop', printArea: { x: 15, y: 10, width: 70, height: 80 }, aspectRatio: '2:3', printDimensions: { widthPx: 1200, heightPx: 2400 }, basePriceGBP: 12 },
  ],
  mugs: [
    { sku: 'GLOBAL-CER-11OZ', name: 'Ceramic Mug 11oz', size: '11oz', category: 'Mugs', mockupImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=800&fit=crop', printArea: { x: 15, y: 25, width: 70, height: 50 }, aspectRatio: '3:2', printDimensions: { widthPx: 3300, heightPx: 1200 }, basePriceGBP: 8 },
    { sku: 'GLOBAL-CER-15OZ', name: 'Ceramic Mug 15oz', size: '15oz', category: 'Mugs', mockupImage: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=800&fit=crop', printArea: { x: 15, y: 22, width: 70, height: 56 }, aspectRatio: '3:2', printDimensions: { widthPx: 3600, heightPx: 1400 }, basePriceGBP: 10 },
    { sku: 'GLOBAL-CER-MUG-ENAMEL', name: 'Enamel Mug', size: '12oz', category: 'Mugs', mockupImage: 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800&h=800&fit=crop', printArea: { x: 15, y: 25, width: 70, height: 50 }, aspectRatio: '3:2', printDimensions: { widthPx: 3300, heightPx: 1200 }, basePriceGBP: 12 },
  ],
  greetingCards: [
    { sku: 'GLOBAL-GCB-A5', name: 'Greeting Card A5', size: 'A5', category: 'Cards', mockupImage: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 1740, heightPx: 2480 }, basePriceGBP: 3 },
    { sku: 'GLOBAL-GCB-A6', name: 'Greeting Card A6', size: 'A6', category: 'Cards', mockupImage: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '3:4', printDimensions: { widthPx: 1240, heightPx: 1748 }, basePriceGBP: 2 },
    { sku: 'GLOBAL-GCB-SQ', name: 'Greeting Card Square', size: '5x5"', category: 'Cards', mockupImage: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=800&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '1:1', printDimensions: { widthPx: 1500, heightPx: 1500 }, basePriceGBP: 2.5 },
  ],
  calendars: [
    { sku: 'GLOBAL-WCCL-A3-LAND', name: 'Wall Calendar A3 Landscape', size: 'A3', category: 'Calendars', mockupImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=600&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 65 }, aspectRatio: '3:2', printDimensions: { widthPx: 4961, heightPx: 3508 }, basePriceGBP: 18 },
    { sku: 'GLOBAL-WCCL-A4-PORT', name: 'Wall Calendar A4 Portrait', size: 'A4', category: 'Calendars', mockupImage: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 50 }, aspectRatio: '2:3', printDimensions: { widthPx: 2480, heightPx: 3508 }, basePriceGBP: 15 },
  ],
  photobooks: [
    { sku: 'BOOK-A4-L-HARD-M', name: 'Photobook A4 Landscape', size: 'A4', category: 'Books', mockupImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop', printArea: { x: 5, y: 10, width: 90, height: 80 }, aspectRatio: '3:2', printDimensions: { widthPx: 4961, heightPx: 3508 }, basePriceGBP: 35 },
    { sku: 'BOOK-A4-P-HARD-M', name: 'Photobook A4 Portrait', size: 'A4', category: 'Books', mockupImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '2:3', printDimensions: { widthPx: 2480, heightPx: 3508 }, basePriceGBP: 35 },
    { sku: 'BOOK-8X8-HARD-M', name: 'Photobook 8x8" Hardcover', size: '8x8"', category: 'Books', mockupImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop', printArea: { x: 5, y: 5, width: 90, height: 90 }, aspectRatio: '1:1', printDimensions: { widthPx: 2400, heightPx: 2400 }, basePriceGBP: 30 },
  ],
};

// Get product by SKU
export function getProductBySku(sku: string): ProdigiCatalogProduct | null {
  for (const category of Object.values(PRODIGI_CATALOG)) {
    const product = category.find(p => p.sku === sku);
    if (product) return product;
  }
  return null;
}

// Get all products flat
export function getAllProducts(): ProdigiCatalogProduct[] {
  const all: ProdigiCatalogProduct[] = [];
  Object.values(PRODIGI_CATALOG).forEach(cat => all.push(...cat));
  return all;
}

// Search products
export function searchProducts(query: string): ProdigiCatalogProduct[] {
  const q = query.toLowerCase();
  return getAllProducts().filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );
}

// Exchange rate helpers
const GBP_TO_BRL = parseFloat(process.env.GBP_TO_BRL || '6.30');

export function gbpToBrl(gbp: number): number {
  return Math.round(gbp * GBP_TO_BRL * 100) / 100;
}

export function getProductWithPricing(product: ProdigiCatalogProduct, marginPercent = 45) {
  const basePriceBRL = gbpToBrl(product.basePriceGBP);
  const suggestedPriceBRL = Math.round(basePriceBRL * (1 + marginPercent / 100) * 100) / 100;
  const profitBRL = suggestedPriceBRL - basePriceBRL;

  return {
    ...product,
    basePriceBRL,
    suggestedPriceBRL,
    profitBRL,
    marginPercent,
  };
}
