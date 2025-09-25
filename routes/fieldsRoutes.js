import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// ✅ GET all fields
router.get("/", async (req, res) => {
   try {
      const fieldsCollection = await getCollection("fields");
      const fields = await fieldsCollection.find({}).toArray();
      res.status(200).json(fields);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch fields" });
   }
});

// ✅ GET fields by email (query param: ?email=someone@example.com)
router.get("/by-email", async (req, res) => {
   try {
      const { email } = req.query;

      if (!email) {
         return res.status(400).json({ error: "Email query parameter is required" });
      }

      const fieldsCollection = await getCollection("fields");
      // find all documents with matching email
      const fields = await fieldsCollection.find({ email }).toArray();

      if (!fields.length) {
         return res.status(404).json({ message: "No fields found for this email" });
      }

      res.status(200).json(fields);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch fields by email" });
   }
});

// ✅ POST - Add a new field
router.post("/", async (req, res) => {
   try {
      const fieldsCollection = await getCollection("fields");
      const fieldData = req.body;

      if (!fieldData || Object.keys(fieldData).length === 0) {
         return res.status(400).json({ error: "Invalid field data" });
      }

      const result = await fieldsCollection.insertOne(fieldData);
      res.status(201).json({
         message: "Field added successfully",
         id: result.insertedId,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add field" });
   }
});

export default router;
