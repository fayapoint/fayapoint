# FayaPoint Products Database - Complete Setup

This document outlines the complete MongoDB product catalog system for FayaPoint AI courses and services.

## 🎯 Overview

The product database is designed following e-commerce best practices with:
- ✅ Comprehensive product information for online selling
- ✅ SEO-optimized metadata
- ✅ Multiple categorization levels
- ✅ Complete pricing and metrics
- ✅ Full copy for sales pages
- ✅ Testimonials, FAQs, and guarantees
- ✅ CTA configurations
- ✅ Digital asset management ready

## 📊 Database Structure

### Database: `fayapointProdutos`
### Collection: `products`

### Document Schema

Each product document contains:

```typescript
{
  productId: string;           // Unique identifier (same as slug)
  slug: string;                // URL-friendly identifier
  type: 'course' | 'service' | 'product';
  status: 'active' | 'inactive' | 'draft';
  name: string;                // Full product name
  shortName: string;           // Short display name
  tool: string;                // Primary tool/technology
  
  categoryPrimary: string;     // Main category
  categorySecondary: string;   // Secondary category
  tags: string[];              // SEO and filtering tags
  
  level: string;               // Difficulty level
  targetAudience: string[];    // Who this is for
  
  pricing: {
    currency: 'BRL';
    price: number;
    originalPrice: number;
    discount: number;          // Percentage
    installments: {
      enabled: boolean;
      maxInstallments: number;
    };
  };
  
  metrics: {
    duration: string;          // e.g., "40+ horas"
    lessons: number;
    students: number;
    rating: number;            // 0-5
    reviewCount: number;
    completionRate: number;    // Percentage
    lastUpdated: string;
  };
  
  copy: {
    headline: string;
    subheadline: string;
    shortDescription: string;
    fullDescription: string;
    benefits: string[];
    impactIndividuals: string[];
    impactEntrepreneurs: string[];
    impactCompanies: string[];
  };
  
  curriculum: {
    moduleCount: number;
    modules: Array<{
      id: number;
      title: string;
      description: string;
      duration: string;
      lessons: number;
    }>;
  };
  
  bonuses: Array<{
    title: string;
    value: number;
    description: string;
  }>;
  
  guarantees: string[];
  
  testimonials: Array<{
    name: string;
    role: string;
    company?: string;
    rating: number;
    comment: string;
    impact: string;
  }>;
  
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  
  cta: {
    primary: { text: string; url: string; style: string; };
    secondary?: { text: string; url: string; style: string; };
    whatsapp?: {
      enabled: boolean;
      number: string;
      message?: string;
    };
  };
  
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage?: string;
  };
  
  digitalAssets: any[];        // For future digital product storage
  features: string[];
  
  createdAt: string;           // ISO date
  updatedAt: string;           // ISO date
}
```

## 🗂️ Categories

### Primary Categories
1. **IA Generativa** - ChatGPT, Claude, Gemini
2. **Automação** - n8n, Make
3. **Criação Visual** - Leonardo AI
4. **Arte Digital** - Midjourney
5. **MLOps & Deploy** - Banana Dev
6. **Pesquisa e Análise** - Perplexity

### Secondary Categories
- Produtividade
- Integração
- Design
- Programação
- Google Workspace
- Infraestrutura

## 📦 Current Products (9 Courses)

| Product | Category | Price | Students | Rating |
|---------|----------|-------|----------|--------|
| ChatGPT Masterclass | IA Generativa | R$ 497 | 12,500 | 4.9 |
| n8n Automação Avançada | Automação | R$ 697 | 8,500 | 4.9 |
| Make Integração Total | Automação | R$ 497 | 6,800 | 4.8 |
| Gemini IA Google | IA Generativa | R$ 397 | 9,200 | 4.8 |
| Leonardo AI | Criação Visual | R$ 397 | 11,300 | 4.9 |
| Banana Dev | MLOps & Deploy | R$ 597 | 3,200 | 4.8 |
| Midjourney Arte | Arte Digital | R$ 497 | 15,800 | 4.9 |
| Claude IA Segura | IA Generativa | R$ 497 | 7,600 | 4.9 |
| Perplexity Pesquisa | Pesquisa e Análise | R$ 297 | 9,800 | 4.8 |

## 🔧 Setup & Usage

### 1. Environment Variables

Create a `.env.local` file:

```env
MONGODB_URI=your_mongodb_connection_string_here
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Seed the Database

Run the seed script to populate MongoDB:

```bash
npm run seed
# or
pnpm seed
```

This will:
- ✅ Connect to MongoDB
- ✅ Create necessary indexes
- ✅ Insert/update all 9 products
- ✅ Display summary statistics

### 4. Verify Data

```bash
# Check MongoDB directly
mongosh "your_mongodb_connection_string_here"

use fayapointProdutos
db.products.countDocuments()
db.products.find().pretty()
```

## 📡 API Usage

### Available Endpoints

#### GET /api/products
Get all products with optional filters

**Query Parameters:**
- `category` - Filter by category name
- `tag` - Filter by tag
- `search` - Search query
- `limit` - Max results (default: 100)
- `sortBy` - Sort order: `students`, `rating`, `price`, `newest`
- `action` - Special actions: `categories`, `featured`, `stats`

**Examples:**
```bash
# Get all products
GET /api/products

# Get products by category
GET /api/products?category=IA%20Generativa

# Get featured products
GET /api/products?action=featured&limit=3

# Search products
GET /api/products?search=chatgpt

# Get all categories
GET /api/products?action=categories

# Get statistics
GET /api/products?action=stats
```

#### GET /api/products/[slug]
Get a single product by slug

**Example:**
```bash
GET /api/products/chatgpt-masterclass
```

**Response includes:**
- Complete product data
- Related products (3 max)

### Using in React Components

```typescript
import { useEffect, useState } from 'react';

// Get all products
const [products, setProducts] = useState([]);

useEffect(() => {
  fetch('/api/products')
    .then(res => res.json())
    .then(data => setProducts(data.products));
}, []);

// Get single product
const [product, setProduct] = useState(null);

useEffect(() => {
  fetch('/api/products/chatgpt-masterclass')
    .then(res => res.json())
    .then(data => setProduct(data.product));
}, []);
```

### Using Server-Side Functions

```typescript
import { 
  getAllProducts, 
  getProductBySlug,
  getProductsByCategory,
  getFeaturedProducts,
  searchProducts
} from '@/lib/products';

// In a Server Component or API route
const products = await getAllProducts({ limit: 10, sortBy: 'students' });
const product = await getProductBySlug('chatgpt-masterclass');
const featured = await getFeaturedProducts(3);
const aiCourses = await getProductsByCategory('IA Generativa');
const results = await searchProducts('automação');
```

## 📊 Database Indexes

The following indexes are created for optimal performance:

```javascript
// Unique indexes
{ slug: 1 }              // Fast product lookup
{ productId: 1 }         // Unique product ID

// Query indexes
{ categoryPrimary: 1, status: 1 }  // Category filtering
{ tags: 1 }                         // Tag-based search
{ 'pricing.price': 1 }              // Price sorting
```

## 🔄 Updating Products

### Via Seed Script (Recommended)

1. Update course data in `src/data/courses/*.ts`
2. Run `npm run seed`
3. Script will automatically upsert (update or insert)

### Via MongoDB Directly

```javascript
db.products.updateOne(
  { slug: 'chatgpt-masterclass' },
  { 
    $set: { 
      'pricing.price': 399,
      'updatedAt': new Date().toISOString()
    }
  }
);
```

## 🎨 Integration with Frontend

### Example: Course Cards

```tsx
import { Product } from '@/lib/products';

interface CourseCardProps {
  product: Product;
}

export function CourseCard({ product }: CourseCardProps) {
  return (
    <div className="course-card">
      <h3>{product.name}</h3>
      <p>{product.copy.shortDescription}</p>
      
      <div className="pricing">
        <span className="original-price">
          R$ {product.pricing.originalPrice}
        </span>
        <span className="sale-price">
          R$ {product.pricing.price}
        </span>
        <span className="discount">
          {product.pricing.discount}% OFF
        </span>
      </div>
      
      <div className="metrics">
        <span>⭐ {product.metrics.rating}</span>
        <span>👥 {product.metrics.students.toLocaleString()} alunos</span>
        <span>🎓 {product.metrics.lessons} aulas</span>
      </div>
      
      <a href={product.cta.primary.url} className="btn-primary">
        {product.cta.primary.text}
      </a>
    </div>
  );
}
```

## 🚀 Future Enhancements

### Planned Features
- [ ] Digital asset storage (Cloudinary integration)
- [ ] Purchase history tracking
- [ ] User reviews and ratings system
- [ ] Course progress tracking
- [ ] Bundle/package products
- [ ] Subscription products
- [ ] Affiliate tracking
- [ ] Dynamic pricing rules
- [ ] Inventory management
- [ ] Multi-language support

### Additional Services
- Consultoria (one-on-one consulting)
- Done-for-you services
- Templates and resources
- Community memberships

## 📝 Notes

1. **MongoDB Connection**: Uses the AI Corner cluster with read/write access
2. **Data Source**: Currently synced with `src/data/courses/` TypeScript files
3. **Updates**: Running seed script is safe - it upserts without duplicating
4. **Performance**: All critical queries are indexed for fast retrieval
5. **Scalability**: Schema supports future product types (services, digital products, etc.)

## 🔐 Security

- MongoDB connection string should be in environment variables only
- Never commit credentials to git
- Use read-only connections for public API routes if needed
- Implement rate limiting on API routes
- Validate all user inputs

## 📞 Support

For questions or issues:
- WhatsApp: +5521971908530
- Email: ricardofaya@gmail.com
