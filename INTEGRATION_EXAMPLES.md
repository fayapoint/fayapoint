# Integration Examples - Using MongoDB Products

This guide shows how to integrate the MongoDB product catalog into your existing pages.

## 🔄 Migration Strategy

### Current State
Your pages currently import static course data:
```typescript
import { allCourses } from '@/data/courses';
```

### New Approach
Fetch from MongoDB via API or direct server-side calls.

## 📄 Example Integrations

### 1. Homepage - Featured Courses (Server Component)

**File: `src/app/page.tsx`**

```typescript
import { getFeaturedProducts } from '@/lib/products';
import { CourseCard } from '@/components/CourseCard';

export default async function HomePage() {
  // Fetch featured courses from MongoDB
  const featuredCourses = await getFeaturedProducts(3);
  
  return (
    <main>
      <section className="hero">
        {/* Your hero section */}
      </section>
      
      <section className="featured-courses">
        <h2>Cursos em Destaque</h2>
        <div className="grid">
          {featuredCourses.map(course => (
            <CourseCard key={course.slug} product={course} />
          ))}
        </div>
      </section>
    </main>
  );
}
```

### 2. Courses Page - All Courses with Filtering

**File: `src/app/cursos/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/products';

export default function CoursesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch categories
    fetch('/api/products?action=categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories.map((c: any) => c.name));
      });
    
    // Fetch all products
    fetchProducts();
  }, []);
  
  const fetchProducts = async (category?: string) => {
    setLoading(true);
    const url = category 
      ? `/api/products?category=${encodeURIComponent(category)}`
      : '/api/products';
    
    const res = await fetch(url);
    const data = await res.json();
    setProducts(data.products);
    setLoading(false);
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchProducts(category || undefined);
  };
  
  return (
    <div className="courses-page">
      <h1>Todos os Cursos</h1>
      
      {/* Category Filter */}
      <div className="filters">
        <button 
          onClick={() => handleCategoryChange('')}
          className={!selectedCategory ? 'active' : ''}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={selectedCategory === cat ? 'active' : ''}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {/* Products Grid */}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="products-grid">
          {products.map(product => (
            <CourseCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Individual Course Page (Server Component)

**File: `src/app/cursos/[slug]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';
import { Metadata } from 'next';

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: 'Curso não encontrado',
    };
  }
  
  return {
    title: product.seo.metaTitle,
    description: product.seo.metaDescription,
    keywords: product.seo.keywords,
    openGraph: {
      title: product.seo.metaTitle,
      description: product.seo.metaDescription,
      images: [product.seo.ogImage || '/og-default.jpg'],
    },
  };
}

export default async function CoursePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    notFound();
  }
  
  const relatedCourses = await getRelatedProducts(params.slug, 3);
  
  return (
    <div className="course-page">
      {/* Hero Section */}
      <section className="hero">
        <h1>{product.name}</h1>
        <p className="subtitle">{product.copy.subheadline}</p>
        
        <div className="stats">
          <span>⭐ {product.metrics.rating} ({product.metrics.reviewCount} avaliações)</span>
          <span>👥 {product.metrics.students.toLocaleString()} alunos</span>
          <span>🎓 {product.metrics.lessons} aulas</span>
          <span>⏱️ {product.metrics.duration}</span>
        </div>
      </section>
      
      {/* Pricing */}
      <section className="pricing">
        <div className="price-box">
          <span className="original">R$ {product.pricing.originalPrice}</span>
          <span className="current">R$ {product.pricing.price}</span>
          <span className="discount">{product.pricing.discount}% OFF</span>
          
          <a href={product.cta.primary.url} className="btn-primary">
            {product.cta.primary.text}
          </a>
          
          {product.cta.whatsapp?.enabled && (
            <a 
              href={`https://wa.me/${product.cta.whatsapp.number.replace(/\D/g, '')}`}
              className="btn-whatsapp"
            >
              Falar no WhatsApp
            </a>
          )}
        </div>
      </section>
      
      {/* What You'll Learn */}
      <section className="benefits">
        <h2>O que você vai aprender</h2>
        <ul>
          {product.copy.benefits.map((benefit, i) => (
            <li key={i}>{benefit}</li>
          ))}
        </ul>
      </section>
      
      {/* Curriculum */}
      <section className="curriculum">
        <h2>Conteúdo do Curso</h2>
        <p>{product.curriculum.moduleCount} módulos • {product.metrics.lessons} aulas</p>
        
        <div className="modules">
          {product.curriculum.modules.map(module => (
            <div key={module.id} className="module">
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span>{module.duration} • {module.lessons} aulas</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Bonuses */}
      {product.bonuses.length > 0 && (
        <section className="bonuses">
          <h2>Bônus Inclusos</h2>
          {product.bonuses.map((bonus, i) => (
            <div key={i} className="bonus">
              <h3>{bonus.title}</h3>
              <p>{bonus.description}</p>
              <span>Valor: R$ {bonus.value}</span>
            </div>
          ))}
        </section>
      )}
      
      {/* Testimonials */}
      <section className="testimonials">
        <h2>O que os alunos dizem</h2>
        {product.testimonials.map((testimonial, i) => (
          <div key={i} className="testimonial">
            <div className="rating">{'⭐'.repeat(testimonial.rating)}</div>
            <p className="comment">"{testimonial.comment}"</p>
            <p className="author">
              <strong>{testimonial.name}</strong> - {testimonial.role}
              {testimonial.company && ` @ ${testimonial.company}`}
            </p>
            <p className="impact">Resultado: {testimonial.impact}</p>
          </div>
        ))}
      </section>
      
      {/* FAQs */}
      <section className="faqs">
        <h2>Perguntas Frequentes</h2>
        {product.faqs.map((faq, i) => (
          <details key={i}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </section>
      
      {/* Guarantees */}
      {product.guarantees.length > 0 && (
        <section className="guarantees">
          <h2>Garantias</h2>
          <ul>
            {product.guarantees.map((guarantee, i) => (
              <li key={i}>✓ {guarantee}</li>
            ))}
          </ul>
        </section>
      )}
      
      {/* Related Courses */}
      {relatedCourses.length > 0 && (
        <section className="related">
          <h2>Cursos Relacionados</h2>
          <div className="grid">
            {relatedCourses.map(course => (
              <CourseCard key={course.slug} product={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

### 4. Search Functionality

**File: `src/components/SearchBar.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/products';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  
  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setResults(data.products);
    setIsSearching(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };
  
  const selectResult = (slug: string) => {
    router.push(`/cursos/${slug}`);
    setQuery('');
    setResults([]);
  };
  
  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Buscar cursos..."
        className="search-input"
      />
      
      {isSearching && <div className="loading">Buscando...</div>}
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(product => (
            <div
              key={product.slug}
              onClick={() => selectResult(product.slug)}
              className="search-result-item"
            >
              <h4>{product.name}</h4>
              <p>{product.copy.shortDescription}</p>
              <span className="category">{product.categoryPrimary}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5. Statistics Dashboard

**File: `src/app/dashboard/page.tsx`**

```typescript
export default async function Dashboard() {
  const statsRes = await fetch('http://localhost:3000/api/products?action=stats', {
    cache: 'no-store'
  });
  const stats = await statsRes.json();
  
  return (
    <div className="dashboard">
      <h1>Painel de Controle</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Produtos</h3>
          <p className="big-number">{stats.totalProducts}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total de Alunos</h3>
          <p className="big-number">{stats.totalStudents?.toLocaleString()}</p>
        </div>
        
        <div className="stat-card">
          <h3>Avaliação Média</h3>
          <p className="big-number">{stats.avgRating?.toFixed(1)} ⭐</p>
        </div>
        
        <div className="stat-card">
          <h3>Preço Médio</h3>
          <p className="big-number">R$ {stats.avgPrice?.toFixed(0)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Total de Aulas</h3>
          <p className="big-number">{stats.totalLessons}</p>
        </div>
      </div>
    </div>
  );
}
```

## 🎯 Best Practices

### 1. Caching Strategy

For Server Components:
```typescript
// Revalidate every hour
export const revalidate = 3600;

// Or use Next.js cache
const products = await fetch('http://localhost:3000/api/products', {
  next: { revalidate: 3600 }
}).then(res => res.json());
```

### 2. Error Handling

```typescript
try {
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }
  // ... use product
} catch (error) {
  console.error('Error loading product:', error);
  return <ErrorComponent />;
}
```

### 3. Loading States

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProductsList />
    </Suspense>
  );
}
```

## 🔄 Migration Checklist

- [ ] Install tsx: `npm install -D tsx`
- [ ] Set up environment variables
- [ ] Run seed script: `npm run seed`
- [ ] Test API endpoints
- [ ] Update homepage to use MongoDB
- [ ] Update courses listing page
- [ ] Update individual course pages
- [ ] Add search functionality
- [ ] Test all integrations
- [ ] Deploy changes

## 📝 Notes

- Server Components can directly import and use functions from `@/lib/products`
- Client Components should use the API routes (`/api/products`)
- Always handle loading and error states
- Use TypeScript types from `@/lib/products` for type safety
- Cache aggressively for better performance
