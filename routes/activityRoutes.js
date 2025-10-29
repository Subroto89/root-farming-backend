import express from "express";
import { ObjectId } from "mongodb"; 
import { getCollection } from "../config/db.js";

const router = express.Router();

// POST new activity
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const collection = await getCollection("activities");
    const response = await collection.insertOne(data);
    res.send(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to post data!!", error });
  }
});

// GET all activities
router.get("/", async (req, res) => {
  try {
    const collection = await getCollection("activities");
    const response = await collection.find().toArray();
    res.send(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch data!!", error });
  }
});

// PATCH: Update activity status (Pending ⇄ Complete)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status field is required" });
    }

    const collection = await getCollection("activities");
    const filter = { _id: new ObjectId(id) };
    const update = { $set: { status } };

    const result = await collection.updateOne(filter, update);
    res.json(result);
  } catch (error) {
    console.error("❌ Error updating activity:", error);
    res.status(500).json({ message: "Failed to update activity!", error });
  }
});

export default router;
