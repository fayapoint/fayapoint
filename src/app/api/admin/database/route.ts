import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAdminToken, logAdminAction } from '@/lib/admin-auth';
import mongoose from 'mongoose';

// GET - List databases and collections
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    if (action === 'test') {
      // Test connection
      const startTime = Date.now();
      try {
        await mongoose.connection.db?.admin().ping();
        const latency = Date.now() - startTime;
        
        return NextResponse.json({
          success: true,
          status: 'connected',
          latency,
          connectionString: process.env.MONGODB_URI?.replace(/:[^:@]+@/, ':****@') || 'Not set',
        });
      } catch (e) {
        return NextResponse.json({
          success: false,
          status: 'disconnected',
          error: String(e),
        });
      }
    }

    // Get list of databases and their collections
    const databasesInfo = [];
    
    try {
      // Try to list all databases (requires admin privileges)
      const admin = mongoose.connection.db?.admin();
      const result = await admin?.listDatabases();
      const databases = result?.databases || [];

      for (const db of databases) {
        try {
          const dbConn = mongoose.connection.useDb(db.name);
          const collections = await dbConn.db!.listCollections().toArray();
          
          const collectionsInfo = [];
          for (const col of collections) {
            try {
              const count = await dbConn.collection(col.name).countDocuments();
              collectionsInfo.push({
                name: col.name,
                type: col.type,
                count,
              });
            } catch {
              collectionsInfo.push({
                name: col.name,
                type: col.type,
                count: 0,
                error: 'Unable to count',
              });
            }
          }

          databasesInfo.push({
            name: db.name,
            sizeOnDisk: db.sizeOnDisk,
            empty: db.empty,
            collections: collectionsInfo,
          });
        } catch {
          databasesInfo.push({
            name: db.name,
            sizeOnDisk: db.sizeOnDisk,
            empty: db.empty,
            collections: [],
            error: 'Unable to list collections',
          });
        }
      }
    } catch (adminError) {
      // If listDatabases fails (no admin privileges), just show the current database
      console.log('listDatabases failed, falling back to current db:', adminError);
      
      const currentDb = mongoose.connection.db;
      if (currentDb) {
        try {
          const collections = await currentDb.listCollections().toArray();
          const collectionsInfo = [];
          
          for (const col of collections) {
            try {
              const count = await currentDb.collection(col.name).countDocuments();
              collectionsInfo.push({
                name: col.name,
                type: col.type,
                count,
              });
            } catch {
              collectionsInfo.push({
                name: col.name,
                type: col.type,
                count: 0,
                error: 'Unable to count',
              });
            }
          }

          // Get db stats for size info
          let sizeOnDisk = 0;
          try {
            const stats = await currentDb.stats();
            sizeOnDisk = stats.dataSize || 0;
          } catch {}

          databasesInfo.push({
            name: currentDb.databaseName,
            sizeOnDisk,
            empty: collectionsInfo.length === 0,
            collections: collectionsInfo,
          });
        } catch (dbError) {
          console.error('Error listing current db collections:', dbError);
        }
      }
    }

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      'Listed databases',
      'database'
    );

    return NextResponse.json({
      success: true,
      databases: databasesInfo,
    });

  } catch (error) {
    console.error('Admin database list error:', error);
    return NextResponse.json(
      { error: 'Erro ao listar bancos de dados' },
      { status: 500 }
    );
  }
}

// POST - Execute database operations (drop collection, create index, etc.)
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminToken(request);
    if (!authResult.valid || !authResult.admin) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { action, database, collection, options } = body;

    if (!action || !database) {
      return NextResponse.json(
        { error: 'Action and database are required' },
        { status: 400 }
      );
    }

    const db = mongoose.connection.useDb(database);

    let result;

    switch (action) {
      case 'createCollection':
        if (!collection) {
          return NextResponse.json({ error: 'Collection name required' }, { status: 400 });
        }
        await db.createCollection(collection);
        result = { message: `Collection ${collection} created` };
        break;

      case 'dropCollection':
        if (!collection) {
          return NextResponse.json({ error: 'Collection name required' }, { status: 400 });
        }
        await db.dropCollection(collection);
        result = { message: `Collection ${collection} dropped` };
        break;

      case 'createIndex':
        if (!collection || !options?.keys) {
          return NextResponse.json({ error: 'Collection and index keys required' }, { status: 400 });
        }
        await db.collection(collection).createIndex(options.keys, options.indexOptions || {});
        result = { message: `Index created on ${collection}` };
        break;

      case 'getIndexes':
        if (!collection) {
          return NextResponse.json({ error: 'Collection name required' }, { status: 400 });
        }
        const indexes = await db.collection(collection).indexes();
        result = { indexes };
        break;

      case 'collectionStats':
        if (!collection) {
          return NextResponse.json({ error: 'Collection name required' }, { status: 400 });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stats = await (db.collection(collection) as any).stats();
        result = { stats };
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Log action
    await logAdminAction(
      authResult.admin.id,
      authResult.admin.email,
      `Database action: ${action}`,
      'database',
      {
        details: { database, collection, action },
      }
    );

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Admin database action error:', error);
    return NextResponse.json(
      { error: 'Erro na operação do banco de dados: ' + String(error) },
      { status: 500 }
    );
  }
}
