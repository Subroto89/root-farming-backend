import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// Add Type Route -------------------------------------
router.post("/save-subcategory", async (req, res) => {
  try {
    const subCategoryData = req.body;
    const subCategoryCollection = await getCollection("subCategories");

    // Check if category already exists
    const existingSubCategory = await subCategoryCollection.findOne({
      name: subCategoryData.subCategoryName,
    });
    if (existingSubCategory) {
      return res.status(400).json({ error: "Sub-category already exists" });
    }

    // Insert new type
    subCategoryData.createdAt = new Date().toISOString();
    subCategoryData.updatedAt = new Date().toISOString();
    subCategoryData.status = "Active";
    subCategoryData.productCount = 0;

    const result = await subCategoryCollection.insertOne(subCategoryData);
    return res.status(201).json({
      message: "Sub-category created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).json({ error: "Failed to save sub-category" });
  }
});

// GET All Sub-Categories Route
router.get("/get-subCategories", async (req, res) => {
  try {
    const subCategoryCollection = await getCollection("subCategories");
    const subCategories = await subCategoryCollection.find({}).toArray();
    res.status(200).json(subCategories);
  } catch (error) {
    console.error("Error fetching subCategories:", error);
    res.status(500).json({ error: "Failed to fetch subCategories" });
  }
});

// Update Sub-Category Route
router.patch("/update-subCategories/:id", async (req, res) => {
  const subCategoryId = req.params.id;

  const { subCategoryName, subCategoryPhoto, subCategoryStatus } = req.body;

  const updateFields = {};
  if (subCategoryName !== undefined) {
    updateFields.subCategoryName = subCategoryName;
  }
  if (subCategoryPhoto !== undefined) {
    updateFields.subCategoryPhoto = subCategoryPhoto;
  }
  if (subCategoryStatus !== undefined) {
    const allowedStatuses = ["active", "inactive"];
    if (!allowedStatuses.includes(subCategoryStatus)) {
      return res.status(400).json({
        message: `Invalid status value. Must be one of: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }
    updateFields.subCategoryStatus = subCategoryStatus;
  }

  updateFields.updatedAt = new Date().toISOString();

  try {
    const subCategoryCollection = await getCollection("subCategories");
    const result = await subCategoryCollection.updateOne(
      { _id: new ObjectId(subCategoryId) },
      { $set: updateFields }
    );
    res.send(result);
  } catch (error) {
    console.error("Error updating type:", error);
    res.status(500).json({
      message: "Server error during type update.",
      error: error.message,
    });
  }
});

// Delete Sub-category API
router.delete("/delete-subCategory/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const subCategoryCollection = await getCollection("subCategories");
    const result = await subCategoryCollection.deleteOne(query);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Internal Server Error. Please try again later." });
  }
});

export default router;
