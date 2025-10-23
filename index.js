import express from "express";
import cors from "cors";
import "dotenv/config";

//import http module to create server
import http from "http";
import { Server } from "socket.io";

// middlewares (HTTP + Socket)
import { verifySocketAuth } from "./middleware/verifySocketAuth.js";

// chat socket handler
import registerSocketHandlers from "./socket/chatHandler.js";

// import routes
import activityRoutes from "./routes/activityRoutes.js";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import fieldsRoutes from "./routes/fieldsRoutes.js";
import dailyToDoRoutes from "./routes/dailyToDoRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import starNewCropRoutes from "./routes/startNewCropRoutes.js";
import managementGuideRoutes from "./routes/managementGuideRoutes.js";
import govtNewsRoutes from "./routes/govtNewsRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import typeRoutes from "./routes/typeRoutes.js";
import subCategoryRoutes from "./routes/subCategoryRoutes.js";
import variantRoutes from "./routes/variantRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// chat related....
import chatRoutes from "./routes/chatRoutes.js"; // add chat routes

// Initialize Express app
const PORT = process.env.PORT || 3001; // choose 3001 for chat server to avoid frontend port conflicts
const app = express();

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS config
app.use(
   cors({
      origin: [
         "http://localhost:5173",
         "http://localhost:5174",
         "https://elegant-buttercream-cd3400.netlify.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-custom-header"],
   })
);

// Health check route
app.get("/", (req, res) => {
   res.send("Root Farming Is Alive!");
});

// mount chat routes (protected routes inside will use verifyFirebaseToken)
app.use("/api/chat", chatRoutes);

// Other existing routes
app.use("/users", userRoutes);
app.use("/products", productsRoutes);
app.use("/fields", fieldsRoutes);
app.use("/tasks", dailyToDoRoutes);
app.use("/resources", resourceRoutes);
app.use("/activities", activityRoutes);
app.use("/govt-news", govtNewsRoutes);
app.use("/blogs", blogRoutes);
app.use("/crops", starNewCropRoutes);
app.use("/api/guides", managementGuideRoutes);
app.use("/categories", categoryRoutes);

app.use("/types", typeRoutes);
app.use("/subCategories", subCategoryRoutes);
app.use("/variants", variantRoutes);

app.use("/reviews", reviewRoutes);
app.use("/wishlist", wishlistRoutes);

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: [
         "http://localhost:5173",
         "http://localhost:5174",
         "https://elegant-buttercream-cd3400.netlify.app",
      ],
      credentials: true,
      methods: ["GET", "POST"],
   },
});

// Use socket auth middleware (verify token on handshake)
// verifySocketAuth must set socket.user = decodedToken and call next()
io.use(verifySocketAuth);

// Register socket event handlers (message, typing, markRead, etc.)
registerSocketHandlers(io);

// Start server after DB connect
const startServer = async () => {
   try {
      await connectDB();
      server.listen(PORT, () => {
         console.log(`Server running at http://localhost:${PORT}`);
      });
   } catch (err) {
      console.error("Failed to start server:", err);
      process.exit(1);
   }

   // Health check route
   app.get("/", (req, res) => {
      res.send("Root Farming Is Alive!");
   });

   // Only listen locally if not deployed on Vercel
   if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      app.listen(PORT, () => {
         console.log(`Server running at http://localhost:${PORT}`);
      });
   }
};

startServer();

export default app;
