import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Admin credentials
const ADMIN_EMAIL = 'ricardofaya@gmail.com';
const ADMIN_PASSWORD = 'dBwc17ooo';
const ADMIN_NAME = 'Ricardo Faya';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ricardofaya:3VJKNjK65tn5srSC@aicornercluster.2kiwt1o.mongodb.net/';

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
