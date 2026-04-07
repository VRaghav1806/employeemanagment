const { MongoClient } = require('mongodb');
require('dotenv').config();

const LOCAL_URI = 'mongodb://localhost:27017';
const ATLAS_URI = process.env.MONGO_URI;

const DB_NAME = 'manager_dashboard';
const COLLECTIONS = ['attendances', 'users', 'tasks'];

async function migrate() {
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    console.log('--- Database Migration Started ---');
    
    console.log('Connecting to Local MongoDB...');
    await localClient.connect();
    const localDb = localClient.db(DB_NAME);
    
    console.log('Connecting to Atlas MongoDB...');
    await atlasClient.connect();
    const atlasDb = atlasClient.db(DB_NAME);
    
    console.log('Connection established.\n');

    for (const collectionName of COLLECTIONS) {
      console.log(`Migrating collection: [${collectionName}]`);
      
      // Get all documents from local
      const documents = await localDb.collection(collectionName).find({}).toArray();
      
      if (documents.length === 0) {
        console.log(`  -> No documents found in [${collectionName}]. Skipping.`);
        continue;
      }

      console.log(`  -> Found ${documents.length} documents.`);

      // (Optional) Clear existing Atlas data? No, let's just append or let user know.
      // For this migration, we'll replace to ensure a clean copy.
      await atlasDb.collection(collectionName).deleteMany({});
      
      // Insert into Atlas
      const result = await atlasDb.collection(collectionName).insertMany(documents);
      console.log(`  -> Successfully migrated ${result.insertedCount} documents to Atlas.\n`);
    }

    console.log('--- Migration Completed Successfully ---');
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.name === 'MongoNetworkError') {
      console.error('  -> Please check your Atlas IP whitelist (0.0.0.0/0).');
    }
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrate();
 residential_address: () => migrate()
