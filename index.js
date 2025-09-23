const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');

const app = express();
const port = process.env.PORT || 3000;

// ✅ CORS config
app.use(cors({
  origin: ['http://localhost:5173', 'https://fitness-web-app-e4c78.web.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true })); // for form-encoded (not multipart)

async function startServer() {
  const db = await connectDB();

    app.get('/', (req, res) => {
    res.send('Server is live');
  });


  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }

}


startServer();
// ✅ Export handler for Vercel
module.exports = app;
