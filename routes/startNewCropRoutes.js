import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// POST – add new crop
router.post("/", async (req, res) => {
   try {
      const cropCollection = await getCollection("crops");
      const {
         name,
         image,
         field,
         expectedHarvest,
         growthStage,
         healthStatus,
         yieldPredictionKg,
         productType,
         categoryId,
         subCategoryId,
         variantId,
         startDate,
         createdBy,
      } = req.body;

      // Server-side validation
      const missing = [];
      if (!name) missing.push("name");
      if (!createdBy) missing.push("createdBy");
      if (!field) missing.push("field");
      if (!expectedHarvest) missing.push("expectedHarvest");
      if (!growthStage) missing.push("growthStage");
      if (!healthStatus) missing.push("healthStatus");
      if (!yieldPredictionKg && yieldPredictionKg !== 0)
         missing.push("yieldPredictionKg");
      if (!productType) missing.push("productType");
      if (!categoryId) missing.push("categoryId");
      if (!subCategoryId) missing.push("subCategoryId");
      if (!variantId) missing.push("variantId");

      if (missing.length > 0) {
         return res.status(400).json({
            message: "Missing required fields",
            missingFields: missing,
         });
      }

      // Convert dates
      const expectedHarvestDate = expectedHarvest
         ? new Date(expectedHarvest)
         : null;
      const startDateObj = startDate ? new Date(startDate) : null;

      if (expectedHarvestDate && isNaN(expectedHarvestDate.getTime()))
         return res
            .status(400)
            .json({ message: "Invalid expectedHarvest date" });

      if (startDateObj && isNaN(startDateObj.getTime()))
         return res.status(400).json({ message: "Invalid startDate" });

      const yieldNumber = Number(yieldPredictionKg);
      if (isNaN(yieldNumber))
         return res
            .status(400)
            .json({ message: "yieldPredictionKg must be a number" });

      const cropData = {
         name,
         image: image || null,
         field,
         expectedHarvest: expectedHarvestDate,
         growthStage,
         healthStatus,
         yieldPredictionKg: yieldNumber,
         productType,
         categoryId,
         subCategoryId,
         variantId,
         startDate: startDateObj,
         createdBy,
         createdAt: new Date(),
      };

      const result = await cropCollection.insertOne(cropData);
      res.status(201).json({ _id: result.insertedId, ...cropData });
   } catch (error) {
      console.error("POST /crops error:", error);
      res.status(500).json({
         message: "Failed to add crop",
         error: error.message,
      });
   }
});

// GET – get crops by createdBy (frontend uses farmerEmail)
router.get("/", async (req, res) => {
   try {
      const cropCollection = await getCollection("crops");
      const createdBy = req.query.email || req.query.createdBy;
      if (!createdBy)
         return res.status(400).json({ message: "Email is required" });

      const crops = await cropCollection.find({ createdBy }).toArray();
      res.json(crops);
   } catch (error) {
      console.error("GET /crops error:", error);
      res.status(500).json({
         message: "Failed to fetch crops",
         error: error.message,
      });
   }
});

export default router;
