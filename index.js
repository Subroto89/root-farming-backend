import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

// ✅ CORS config
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

async function startServer() {
  // ✅ Connect to MongoDB
  const db = await connectDB();

  // ✅ Inject DB collections dynamically
  const { setCollections } = await import('./controllers/userController.js');
  setCollections(db);

  // ✅ Use routes
  app.use('/api/users', userRoutes);

  // ✅ Health check
  app.get('/', (req, res) => {
    res.send('Server is live');
  });

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }
}

// Start server
startServer();

// ✅ Export handler for Vercel
export default app;
