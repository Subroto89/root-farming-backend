import express from 'express';
import { addUser } from '../controllers/userController.js';

const router = express.Router();

// Add a new user
router.post('/add', addUser);

// You can add more routes here (GET, PUT, DELETE, etc.)

export default router;
