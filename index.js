import express from "express";
import cors from "cors";
import "dotenv/config";
import activityRoutes from "./routes/activityRoutes.js";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import fieldsRoutes from "./routes/fieldsRoutes.js";
import dailyToDoRoutes from "./routes/dailyToDoRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";


const app = express();
const port = process.env.PORT || 3000;

// CORS config
app.use(
  cors({
    origin: ["http://localhost:5173", "https://elegant-buttercream-cd3400.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-custom-header"],
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
   app.use("/fields", fieldsRoutes);
   app.use("/tasks", dailyToDoRoutes);
   app.use("/resources", resourceRoutes);
   app.use("/activities", activityRoutes);
   app.use("/categories", categoryRoutes);

   // Health check route
   app.get("/", (req, res) => {
      res.send("Root Farming Is Alive!");
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
