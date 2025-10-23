import express from "express";
import { getCollection } from "../config/db.js";
// import { getCollection } from "../config/db.js";

const router = express.Router();

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

router.get("/", async (req, res) => {
  try {
    const collection = await getCollection("activities");
    const response = await collection.find().toArray();
    res.send(response);

  } catch (error) {
    res.status(500).json({ message: "Failed to post data!!", error });
  }
});

export default router;
