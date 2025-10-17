import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import "dotenv/config";

const uri = process.env.MONGODB_URI;

// Safety check
if (!uri) {
   throw new Error("MONGO_URI is not defined in environment variables");
   process.exit(1);
}
const client = new MongoClient(uri, {
   serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
   },
});

export const connectDB = async () => {
   try {
      console.log("MongoDB client initialized.");
      return client.db("Root-Farming");
   } catch (error) {
      console.error("MongoDB connection error:", error);
      process.exit(1);
   }
};

// Dynamic collection getter
export const getCollection = async (collectionName) => {
   try {
      const db = await connectDB();
      return db.collection(collectionName);
   } catch (error) {
      console.error(`Error getting collection "${collectionName}":`, error);
      throw error;
   }
};

export default { connectDB, getCollection };
