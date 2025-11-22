import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || '';
const DATABASE_NAME = process.env.DATABASE_NAME || 'fayapoint';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'users'; // Mongoose usually pluralizes 'User' to 'users'
const JWT_SECRET = process.env.JWT_SECRET || '';

async function seedUser() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    const demoUser = {
      email: 'demo@fayapoint.com',
      password: await bcrypt.hash('123456', 10),
      name: 'Usuário Demo',
      role: 'student',
      subscription: {
        plan: 'pro',
        status: 'active',
      },
      progress: {
        totalHours: 15,
        coursesCompleted: 2,
        coursesInProgress: 3,
        currentStreak: 5,
        points: 1250,
        level: 5
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = await collection.findOneAndUpdate(
      { email: demoUser.email },
      { $set: demoUser },
      { upsert: true, returnDocument: 'after' }
    );

    const userId = user?._id || user?.value?._id;

    if (userId) {
       const progressCollection = db.collection('courseprogresses'); // Mongoose pluralizes to lowercase
       
       const progresses = [
         {
            userId: userId,
            courseId: 'chatgpt-masterclass',
            completedLessons: ['intro', 'setup', 'prompting-101'],
            progressPercent: 15,
            isCompleted: false,
            startedAt: new Date(),
            lastAccessedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
         },
         {
            userId: userId,
            courseId: 'n8n-automacao-avancada',
            completedLessons: [],
            progressPercent: 0,
            isCompleted: false,
            startedAt: new Date(),
            lastAccessedAt: new Date(),
             createdAt: new Date(),
            updatedAt: new Date()
         }
       ];

       for (const p of progresses) {
          await progressCollection.updateOne(
            { userId: p.userId, courseId: p.courseId },
            { $set: p },
            { upsert: true }
          );
       }
       console.log('✅ Course progress seeded');
    }


  } catch (error) {
    console.error('❌ Error seeding user:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  seedUser().catch(console.error);
}
