/**
 * MongoDB Product Seeder
 * 
 * This script populates the fayapointProdutos database with all course products.
 * Run with: npx tsx scripts/seed-products.ts
 */

import { MongoClient } from 'mongodb';
import { allCourses } from '../src/data/courses';
import type { CourseData } from '../src/data/courses';

// MongoDB connection string from environment or fallback
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://ricardofaya:3VJKNjK65tn5srSC@aicornercluster.2kiwt1o.mongodb.net/?retryWrites=true&w=majority&appName=aicornercluster';

const DATABASE_NAME = 'fayapointProdutos';
const COLLECTION_NAME = 'products';

// Category mapping for better e-commerce organization
const CATEGORY_MAP: Record<string, { primary: string; secondary: string }> = {
  'IA Generativa': { primary: 'IA Generativa', secondary: 'Produtividade' },
  'Automação': { primary: 'Automação', secondary: 'Integração' },
  'Criação Visual': { primary: 'Criação Visual', secondary: 'Design' },
  'Arte Digital': { primary: 'Arte Digital', secondary: 'Design' },
  'MLOps & Deploy': { primary: 'MLOps & Deploy', secondary: 'Infraestrutura' },
  'Pesquisa e Análise': { primary: 'Pesquisa e Análise', secondary: 'Produtividade' },
};

// Transform course data to product document
function courseToProductDocument(course: CourseData) {
  const categoryInfo = CATEGORY_MAP[course.category] || { 
    primary: course.category, 
    secondary: 'Geral' 
  };

  return {
    productId: course.slug,
    slug: course.slug,
    type: 'course' as const,
    status: 'active' as const,
    name: course.title,
    shortName: course.title.split(':')[0].trim(),
    tool: course.tool,
    categoryPrimary: categoryInfo.primary,
    categorySecondary: categoryInfo.secondary,
    tags: [
      course.tool.toLowerCase().replace(/\s+/g, '-'),
      course.category.toLowerCase().replace(/\s+/g, '-'),
      ...generateTags(course)
    ],
    level: course.level,
    targetAudience: course.targetAudience || ['Profissionais', 'Empreendedores', 'Empresas'],
    
    pricing: {
      currency: 'BRL' as const,
      price: course.price,
      originalPrice: course.originalPrice,
      discount: Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100),
      installments: {
        enabled: true,
        maxInstallments: 12,
      },
      trial: {
        enabled: false,
      },
    },
    
    metrics: {
      duration: course.duration,
      lessons: course.totalLessons,
      students: course.students,
      rating: course.rating,
      reviewCount: Math.floor(course.students * 0.19), // ~19% review rate
      completionRate: Math.floor(85 + Math.random() * 10), // 85-95%
      lastUpdated: course.lastUpdated,
    },
    
    copy: {
      headline: course.title,
      subheadline: course.subtitle,
      shortDescription: course.shortDescription,
      fullDescription: course.fullDescription,
      benefits: course.whatYouLearn,
      impactIndividuals: course.impactForIndividuals,
      impactEntrepreneurs: course.impactForEntrepreneurs,
      impactCompanies: course.impactForCompanies,
    },
    
    curriculum: {
      moduleCount: course.modules.length,
      modules: course.modules.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        duration: m.duration,
        lessons: m.lessons,
      })),
    },
    
    bonuses: course.bonuses,
    guarantees: course.guarantees || [],
    testimonials: course.testimonials.slice(0, 3), // Top 3 testimonials
    faqs: course.faqs,
    
    cta: {
      primary: {
        text: 'Começar Agora',
        url: `/checkout/${course.slug}`,
        style: 'primary' as const,
      },
      secondary: {
        text: 'Agendar Consultoria',
        url: '/agendar-consultoria',
        style: 'secondary' as const,
      },
      whatsapp: {
        enabled: true,
        number: '+5521971908530',
        message: `Olá! Gostaria de saber mais sobre o ${course.title}`,
      },
    },
    
    seo: {
      metaTitle: `${course.title} | Curso Completo em Português`,
      metaDescription: course.shortDescription,
      keywords: [
        course.tool.toLowerCase(),
        course.category.toLowerCase(),
        'curso',
        'online',
        'português',
      ],
      ogImage: `/images/courses/${course.slug}-og.jpg`,
    },
    
    digitalAssets: [],
    features: course.features || ['Vídeo-aulas', 'Projetos práticos', 'Certificado', 'Comunidade', 'Suporte'],
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Generate relevant tags for a course
function generateTags(course: CourseData): string[] {
  const tags: string[] = [];
  
  // Tool-specific tags
  const toolLower = course.tool.toLowerCase();
  if (toolLower.includes('chatgpt')) tags.push('prompt-engineering', 'gpt-4');
  if (toolLower.includes('n8n')) tags.push('workflow', 'api');
  if (toolLower.includes('make')) tags.push('no-code', 'visual-automation');
  if (toolLower.includes('gemini')) tags.push('multimodal', 'google-workspace');
  if (toolLower.includes('leonardo')) tags.push('product-photography', 'concept-art');
  if (toolLower.includes('banana')) tags.push('serverless', 'mlops');
  if (toolLower.includes('midjourney')) tags.push('nft', 'illustration');
  if (toolLower.includes('claude')) tags.push('constitutional-ai', 'document-analysis');
  if (toolLower.includes('perplexity')) tags.push('fact-checking', 'market-research');
  
  // Category tags
  if (course.category.includes('Automação')) tags.push('automation', 'integration');
  if (course.category.includes('IA')) tags.push('artificial-intelligence', 'ai');
  if (course.category.includes('Visual') || course.category.includes('Arte')) tags.push('design', 'creative');
  
  return tags;
}

// Main seeding function
async function seedProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Create indexes if they don't exist
    console.log('📇 Creating indexes...');
    await collection.createIndex({ slug: 1 }, { unique: true, name: 'idx_slug' });
    await collection.createIndex({ categoryPrimary: 1, status: 1 }, { name: 'idx_category_status' });
    await collection.createIndex({ tags: 1 }, { name: 'idx_tags' });
    await collection.createIndex({ productId: 1 }, { unique: true, name: 'idx_productId' });
    await collection.createIndex({ 'pricing.price': 1 }, { name: 'idx_price' });
    console.log('✅ Indexes created');
    
    // Transform and upsert products
    console.log('📦 Seeding products...');
    const documents = allCourses.map(courseToProductDocument);
    
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const doc of documents) {
      const result = await collection.updateOne(
        { slug: doc.slug },
        { 
          $set: {
            ...doc,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            createdAt: new Date().toISOString(),
          }
        },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        insertedCount++;
        console.log(`  ✅ Inserted: ${doc.name}`);
      } else if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`  🔄 Updated: ${doc.name}`);
      }
    }
    
    console.log('\n🎉 Seeding complete!');
    console.log(`   Inserted: ${insertedCount} products`);
    console.log(`   Updated: ${updatedCount} products`);
    console.log(`   Total: ${documents.length} products`);
    
    // Display category summary
    const categories = await collection.aggregate([
      {
        $group: {
          _id: '$categoryPrimary',
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.price' },
          totalStudents: { $sum: '$metrics.students' },
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📊 Category Summary:');
    categories.forEach((cat: any) => {
      console.log(`   ${cat._id}: ${cat.count} products | Avg R$${cat.avgPrice.toFixed(0)} | ${cat.totalStudents.toLocaleString()} students`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed');
  }
}

// Run if executed directly
if (require.main === module) {
  seedProducts().catch(console.error);
}

export { seedProducts, courseToProductDocument };
