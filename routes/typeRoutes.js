import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// Add Type Route -------------------------------------
router.post("/save-type", async (req, res) => {
  try {
    const typeData = req.body;
    const typeCollection = await getCollection("types");

    // const data = typeCollection.insertOne(typeData);

    // Check if category already exists
    const existingType = await typeCollection.findOne({
      name: typeData.typeName,
    });
    if (existingType) {
      return res.status(400).json({ error: "Type already exists" });
    }

    // Insert new type
    typeData.createdAt = new Date().toISOString();
    typeData.updatedAt = new Date().toISOString();
    typeData.status = "Active";
    typeData.productCount = 0;

    const result = await typeCollection.insertOne(typeData);
    return res.status(201).json({
      message: "Type created successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving category:", error);
    res.status(500).json({ error: "Failed to save type" });
  }
});

// GET All Types Route
router.get("/get-types", async (req, res) => {
  try {
    const typeCollection = await getCollection("types");
    const types = await typeCollection.find({}).toArray();
    res.status(200).json(types);
  } catch (error) {
    console.error("Error fetching types:", error);
    res.status(500).json({ error: "Failed to fetch types" });
  }
});

router.patch("/update-type/:id", async (req, res) => {
  const typeId = req.params.id;
  console.log(typeId);

  const { typeName, typeImage, typeStatus } = req.body;

  const updateFields = {};
  if (typeName !== undefined) {
    updateFields.typeName = typeName;
  }
  if (typeImage !== undefined) {
    updateFields.typePhoto = typeImage;
  }
  if (typeStatus !== undefined) {
    const allowedStatuses = ["active", "inactive"];
    if (!allowedStatuses.includes(typeStatus)) {
      return res.status(400).json({
        message: `Invalid status value. Must be one of: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }
    updateFields.status = typeStatus;
  }

  updateFields.updatedAt = new Date().toISOString();

  try {
    const typeCollection = await getCollection("types");
    const result = await typeCollection.updateOne(
      { _id: new ObjectId(typeId) },
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

// Delete Type API
router.delete("/delete-type/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    const typeCollection = await getCollection("types");
    const result = await typeCollection.deleteOne(query);
    res.status(200).send(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Internal Server Error. Please try again later." });
  }
});

export default router;
