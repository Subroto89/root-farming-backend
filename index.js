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

module.exports = { app, port, connectDB };
