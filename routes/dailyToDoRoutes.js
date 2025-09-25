import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// ✅ GET all tasks
router.get("/", async (req, res) => {
  try {
    const tasksCollection = await getCollection("dailyTasks");
    const tasks = await tasksCollection.find({}).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// ✅ GET tasks by email (query param: ?email=user@example.com)
router.get("/by-email", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email query parameter is required" });
    }

    const tasksCollection = await getCollection("dailyTasks");
    const tasks = await tasksCollection.find({ email }).toArray();

    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found for this email" });
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks by email" });
  }
});

// ✅ POST - Add a new task
router.post("/", async (req, res) => {
  try {
    const tasksCollection = await getCollection("dailyTasks");
    const taskData = req.body;

    if (!taskData || !taskData.email || !taskData.task) {
      return res.status(400).json({ error: "Invalid task data" });
    }

    taskData.completed = false; // default value
    taskData.createdAt = new Date();

    const result = await tasksCollection.insertOne(taskData);

    res.status(201).json({
      message: "Task added successfully",
      id: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add task" });
  }
});

export default router;
