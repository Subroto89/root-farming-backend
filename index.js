import express from "express";
import cors from "cors";
import "dotenv/config";
import activityRoutes from "./routes/activityRoutes.js";

import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

// CORS config
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const startServer = async () => {

   // Initialize MongoDB connection (lazy connection is fine)
   await connectDB();

   // Use routes
   app.use("/users", userRoutes);
   app.use("/products", productsRoutes);
   app.use("/resources", resourceRoutes);
   app.use("/activities", activityRoutes);

   // Health check route
   app.get("/", (req, res) => {
      res.send("Server is live and connected to MongoDB!");
   });

   // Only listen locally if not deployed on Vercel
   if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      app.listen(port, () => {
         console.log(`Server running at http://localhost:${port}`);
      });
   }

 
};

// Start server
startServer();

// Export for serverless platforms like Vercel
export default app;
