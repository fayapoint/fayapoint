import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { uriDoMongo } from "./lib/mongo.mjs";

// Credenciais do admin.
//
// ⚠️ A senha NUNCA volta para cá. `github.com/fayapoint/fayapoint` é público:
// senha escrita no fonte é senha publicada. A que estava aqui vazou junto com
// a MONGODB_URI (27/08/2026) — e nem depois de rotacionada ela volta para o
// comentário, porque quem lê um exemplo copia o exemplo.
//
// Sem `ADMIN_SEED_PASSWORD` no ambiente, o script não roda; ele não inventa
// um padrão.
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'ricardofaya@gmail.com';
const ADMIN_NAME = process.env.ADMIN_SEED_NAME || 'Ricardo Faya';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error(
    'Sem ADMIN_SEED_PASSWORD no ambiente. Defina-a antes de rodar seed-admin.',
  );
}

const MONGODB_URI = uriDoMongo();

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: 'fayapoint' });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });

    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (existingAdmin) {
      console.log('📝 Admin user exists, updating role and password...');
      
      await usersCollection.updateOne(
        { email: ADMIN_EMAIL },
        {
          $set: {
            role: 'admin',
            password: hashedPassword,
            name: ADMIN_NAME,
            updatedAt: new Date(),
          }
        }
      );
      
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('👤 Creating new admin user...');
      
      await usersCollection.insertOne({
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: hashedPassword,
        role: 'admin',
        subscription: {
          plan: 'business',
          status: 'active',
        },
        profile: {
          bio: 'System Administrator',
          interests: [],
          skills: [],
        },
        progress: {
          totalHours: 0,
          coursesCompleted: 0,
          coursesInProgress: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: [],
          points: 0,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          weeklyXp: 0,
          monthlyXp: 0,
        },
        gamification: {
          achievements: [],
          weeklyGoal: {
            target: 5,
            current: 0,
            type: 'lessons',
          },
          streakFreeze: 0,
          totalImagesGenerated: 0,
          totalAiChats: 0,
          referrals: 0,
        },
        preferences: {
          language: 'pt-BR',
          notifications: {
            email: true,
            push: true,
            marketing: false,
            courseUpdates: true,
            communityActivity: true,
          },
          theme: 'dark',
          playbackSpeed: 1,
        },
        enrolledCourses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎉 Admin setup complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🔐 Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Access the admin panel at: /admin/login');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seedAdmin();
