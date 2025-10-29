import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// POST new Partners
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const collection = await getCollection("becomePartners");
    const response = await collection.insertOne(data);
    res.send(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to post data!!", error });
  }
});

// GET all Partners
router.get("/", async (req, res) => {
  try {
    const collection = await getCollection("becomePartners");
    const response = await collection.find().toArray();
    res.send(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch data!!", error });
  }
});

export default router;
