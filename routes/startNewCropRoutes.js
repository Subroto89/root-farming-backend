
import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// POST – add new crop
router.post("/", async (req, res) => {
  try {
    const cropCollection = await getCollection("crops")
    const {name, description, amount, unit, price, discount, quality, type, farmerEmail, image } = req.body;

    if (!description || !amount || !price || !farmerEmail) {
      return res.status(400).json({ message: "Description, amount, price, and email are required" });
    }

    const cropData = {
      name,
      description,
      amount,
      unit: unit || null,
      price,
      discount: discount || 0,
      quality: quality || "",
      type: type || "pieces",
      image,
      farmerEmail,
      createdAt: new Date(),
    };

    const result = await cropCollection.insertOne(cropData);
    res.status(201).json({ _id: result.insertedId, ...cropData });
  } catch (error) {
    console.error("POST /crops error:", error);
    res.status(500).json({ message: "Failed to add crop", error: error.message });
  }
});

// GET – get crops by email query
router.get("/", async (req, res) => {
  try {
     const cropCollection = await getCollection("crops")
    const farmerEmail = req.query.email;
    if (!farmerEmail) return res.status(400).json({ message: "Email is required" });

    const crops = await cropCollection.find({ farmerEmail }).toArray();
    res.json(crops);
  } catch (error) {
    console.error("GET /crops error:", error);
    res.status(500).json({ message: "Failed to fetch crops", error: error.message });
  }
});

export default router;
