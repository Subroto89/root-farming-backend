import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// Add Variant API -------------------------------------
router.post("/save-variant", async (req, res) => {
    try {
        const variantData = req.body;
        const variantCollection = await getCollection("variants");
        
        
        // Check if variant already exists
        const existingVariant = await variantCollection.findOne({
            name: variantData.variantName,
        });
        if (existingVariant) {
            return res.status(400).json({ error: "Variant already exists" });
        }
        
        // Insert new variant
        variantData.createdAt = new Date().toISOString();
        variantData.updatedAt = new Date().toISOString();
        variantData.variantStatus = "Active";
        variantData.productCount = 0;
        
        const result = await variantCollection.insertOne(variantData);
        return res.status(201).json({
            message: "Variant created successfully",
            insertedId: result.insertedId,
        });
        
  } catch (error) {
    console.error("Error saving variant:", error);
    res.status(500).json({ error: "Failed to save variant" });
  }
});


// GET All Types API

router.get("/get-variants", async (req, res) => {
  try {
    const variantCollection = await getCollection("variants");
    const variants = await variantCollection.find({}).toArray();
    res.status(200).json(variants);
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ error: "Failed to fetch variants" });
  }
});


// Update Variant API
 router.patch("/update-variant/:id", async (req, res) => {
      const variantId = req.params.id;

      const { variantName, variantPhoto, variantStatus } = req.body;

      const updateFields = {};
      if (variantName !== undefined) {
        updateFields.variantName = variantName;
      }
      if (variantPhoto !== undefined) {
        updateFields.variantPhoto = variantPhoto;
      }
      if (variantStatus !== undefined) {
        const allowedStatuses = ["active", "inactive"];
        if (!allowedStatuses.includes(variantStatus)) {
          return res.status(400).json({
            message: `Invalid status value. Must be one of: ${allowedStatuses.join(
              ", "
            )}`,
          });
        }
        updateFields.variantstatus = variantStatus;
      }

      updateFields.updatedAt = new Date().toISOString();

      try {
        const variantCollection = await getCollection("variants");
        const result = await variantCollection.updateOne(
          { _id: new ObjectId(variantId) },
          { $set: updateFields }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating variant:", error);
        res.status(500).json({
          message: "Server error during variant update.",
          error: error.message,
        });
      }
    });

// Delete Variant API
    router.delete("/delete-variant/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const variantCollection = await getCollection("variants");
        const result = await variantCollection.deleteOne(query);
        res.status(200).send(result);
      } catch (error) {
        console.log(error);
        res
          .status(500)
          .send({ message: "Internal Server Error. Please try again later." });
      }
    });

export default router;