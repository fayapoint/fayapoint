/**
 * Seed POD Providers
 * Run with: npx tsx scripts/seed-pod-providers.ts
 */

import mongoose from 'mongoose';
import PODProvider, { DEFAULT_POD_PROVIDERS } from '../src/models/PODProvider';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ricardofaya:3VJKNjK65tn5srSC@aicornercluster.2kiwt1o.mongodb.net/fayapoint';

async function seedPODProviders() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing providers
    const existingCount = await PODProvider.countDocuments();
    console.log(`📊 Found ${existingCount} existing providers`);

    if (existingCount > 0) {
      console.log('🗑️ Clearing existing providers...');
      await PODProvider.deleteMany({});
    }

    console.log(`\n🌱 Seeding ${DEFAULT_POD_PROVIDERS.length} POD providers...\n`);

    const results = await Promise.all(
      DEFAULT_POD_PROVIDERS.map(async (provider) => {
        try {
          const newProvider = new PODProvider(provider);
          await newProvider.save();
          console.log(`  ✅ ${provider.displayName} (${provider.slug})`);
          return { slug: provider.slug, success: true };
        } catch (err) {
          console.error(`  ❌ ${provider.slug}:`, err);
          return { slug: provider.slug, success: false, error: String(err) };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully seeded: ${successCount} providers`);
    if (failedCount > 0) {
      console.log(`❌ Failed: ${failedCount} providers`);
    }
    console.log('='.repeat(50));

    // Summary
    const providers = await PODProvider.find().lean();
    console.log('\n📋 Provider Summary:');
    console.log('');
    
    const active = providers.filter(p => p.integrationStatus === 'active');
    const testing = providers.filter(p => p.integrationStatus === 'testing');
    const comingSoon = providers.filter(p => p.integrationStatus === 'coming_soon');
    
    console.log(`  🟢 Active (${active.length}):`);
    active.forEach(p => console.log(`     - ${p.displayName}: ${p.productCount}+ products`));
    
    console.log(`\n  🟡 Testing (${testing.length}):`);
    testing.forEach(p => console.log(`     - ${p.displayName}`));
    
    console.log(`\n  ⏳ Coming Soon (${comingSoon.length}):`);
    comingSoon.forEach(p => console.log(`     - ${p.displayName}`));

    // Specializations breakdown
    console.log('\n📦 By Specialization:');
    const specs = [...new Set(providers.map(p => p.specialization))];
    specs.forEach(spec => {
      const count = providers.filter(p => p.specialization === spec).length;
      console.log(`   ${spec}: ${count}`);
    });

    // Brazil shipping
    const brazilShipping = providers.filter(p => p.shipping?.shipsToBrazil);
    console.log(`\n🇧🇷 Ships to Brazil: ${brazilShipping.length} providers`);

  } catch (error) {
    console.error('❌ Error seeding POD providers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

seedPODProviders();
