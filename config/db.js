import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import "dotenv/config";

const uri=process.env.MONGODB_URI;

// ✅ Safety check
if (!uri) {
  console.error("Error: MONGODB_URL is not defined in .env");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function connectDB() {
  try {
    // await client.connect(); // optional, MongoClient connects lazily
    console.log('MongoDB client initialized.');
    return client.db('rootFarmingDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Optional export for convenience
export default {connectDB} ;
