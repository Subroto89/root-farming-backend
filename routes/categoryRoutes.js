import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// Add Category Route
router.post("/save-category", async (req, res) => {
   try {
      const categoryData = req.body;
      const categoryCollection = await getCollection("categories");

      // Check if category already exists
      const existingCategory = await categoryCollection.findOne({
         name: categoryData.categoryName,
      });
      if (existingCategory) {
         return res.status(400).json({ error: "Category already exists" });
      }

      // Insert new category
      categoryData.createdAt = new Date().toISOString();
      categoryData.updatedAt = new Date().toISOString();
      categoryData.status = "Active";
      categoryData.productCount = 0;

      const result = await categoryCollection.insertOne(categoryData);
      return res.status(201).json({
         message: "Category created successfully",
         insertedId: result.insertedId,
      });
   } catch (error) {
      console.error("Error saving category:", error);
      res.status(500).json({ error: "Failed to save category" });
   }
});

// GET All Categories Route

router.get("/get-categories", async (req, res) => {
   try {
      const categoryCollection = await getCollection("categories");
      const categories = await categoryCollection.find({}).toArray();
      res.status(200).json(categories);
   } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
   }
});

router.get("/get-by-type/:typeId", async (req, res) => {
   try {
      const { typeId } = req.params;
      const categoryCollection = await getCollection("categories");

      // Build OR conditions to match common stored shapes
      const orConditions = [
         { typeId: typeId }, // string stored in typeId
         { type: typeId }, // alternative key
         { productType: typeId }, // your doc uses productType
         { type_id: typeId },
      ];

      // If it's a valid ObjectId, add ObjectId variants
      try {
         const oid = new ObjectId(typeId);
         orConditions.push(
            { typeId: oid },
            { "type._id": oid },
            { productType: oid }
         );
      } catch (err) {
         // not an ObjectId, ignore
      }

      const categories = await categoryCollection
         .find({ $or: orConditions })
         .toArray();
      return res.status(200).json(categories);
   } catch (err) {
      console.error("Error fetching categories by type:", err);
      return res
         .status(500)
         .json({ error: "Failed to fetch categories for the given type" });
   }
});

// Update Category API
router.patch("/update-category/:id", async (req, res) => {
   const categoryId = req.params.id;
   console.log(categoryId);

   const { categoryName, categoryImage, categoryStatus } = req.body;

   const updateFields = {};
   if (categoryName !== undefined) {
      updateFields.categoryName = categoryName;
   }
   if (categoryImage !== undefined) {
      updateFields.categoryPhoto = categoryImage;
   }
   if (categoryStatus !== undefined) {
      const allowedStatuses = ["active", "inactive"];
      if (!allowedStatuses.includes(categoryStatus)) {
         return res.status(400).json({
            message: `Invalid status value. Must be one of: ${allowedStatuses.join(
               ", "
            )}`,
         });
      }
      updateFields.status = categoryStatus;
   }

   updateFields.updatedAt = new Date().toISOString();

   try {
      const categoryCollection = await getCollection("categories");
      const result = await categoryCollection.updateOne(
         { _id: new ObjectId(categoryId) },
         { $set: updateFields }
      );
      res.send(result);
   } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
         message: "Server error during category update.",
         error: error.message,
      });
   }
});

router.delete("/delete-category/:id", async (req, res) => {
   try {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const categoryCollection = await getCollection("categories");
      const result = await categoryCollection.deleteOne(query);
      res.status(200).send(result);
   } catch (error) {
      console.log(error);
      res.status(500).send({
         message: "Internal Server Error. Please try again later.",
      });
   }
});

export default router;
