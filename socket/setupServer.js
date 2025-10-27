const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const NotificationSocketHandler = require('./socket/notificationHandler');

// Initialize notification handler with socket.io instance
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/task-socket' // Match the frontend socket path
  });

  // Initialize notification handler
  const notificationHandler = new NotificationSocketHandler(io);
  
  // Make notification handler available to routes
  return notificationHandler;
};

const setupServer = () => {
  const app = express();
  const server = http.createServer(app);
  
  // CORS setup
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Initialize socket handlers
  const notificationHandler = initializeSocket(server);

  // Make notification handler available to routes
  app.set('notificationHandler', notificationHandler);

  return { app, server };
};

module.exports = setupServer;