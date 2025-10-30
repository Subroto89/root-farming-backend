import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// Add Sub-Category Route -------------------------------------
router.post("/save-subcategory", async (req, res) => {
   try {
      const subCategoryData = req.body;
      const subCategoryCollection = await getCollection("subCategories");

      // Basic validation
      if (!subCategoryData || !subCategoryData.subCategoryName) {
         return res.status(400).json({ error: "subCategoryName is required" });
      }

      // Normalize incoming name for comparison to avoid case-sensitivity issues
      const incomingName = String(subCategoryData.subCategoryName).trim();

      // Check if sub-category already exists (support both current and legacy fields)
      const existingSubCategory = await subCategoryCollection.findOne({
         $or: [
            { subCategoryName: { $regex: `^${incomingName}$`, $options: "i" } },
            { name: { $regex: `^${incomingName}$`, $options: "i" } },
         ],
      });

      if (existingSubCategory) {
         return res.status(400).json({ error: "Sub-category already exists" });
      }

      // Prepare document to insert (use consistent keys)
      const docToInsert = {
         subCategoryName: incomingName,
         subCategoryPhoto: subCategoryData.subCategoryPhoto || null,
         // consistent lowercase status
         status: "active",
         productCount: 0,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
         // attach any other fields passed through (but do not overwrite keys above)
         ...Object.fromEntries(
            Object.entries(subCategoryData).filter(
               ([k]) =>
                  ![
                     "subCategoryName",
                     "subCategoryPhoto",
                     "status",
                     "productCount",
                     "createdAt",
                     "updatedAt",
                  ].includes(k)
            )
         ),
      };

      const result = await subCategoryCollection.insertOne(docToInsert);
      return res.status(201).json({
         message: "Sub-category created successfully",
         insertedId: result.insertedId,
      });
   } catch (error) {
      console.error("Error saving sub-category:", error);
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

// ---------------- Get Sub-Category ----------------------
router.get("/get-subCategory/:id", async (req, res) => {
   try {
      const subCategoryId = req.params.id;

      const subCategoriesCollection = await getCollection("subCategories");

      const subCategory = await subCategoriesCollection.findOne({
         _id: new ObjectId(subCategoryId),
      });
      if (!subCategory) {
         return res.status(404).json({ message: "Sub-Category not found." });
      }
      // Success response
      res.status(200).send(subCategory);
   } catch (err) {
      console.error("Error fetching sub-Category:", err);
      res.status(500).json({ message: "Failed to fetch sub-Category" });
   }
});

// GET sub-categories by categoryId
router.get("/get-by-category/:categoryId", async (req, res) => {
   try {
      const { categoryId } = req.params;
      const subCategoryCollection = await getCollection("subCategories");

      const orConditions = [
         { categoryId: categoryId }, // string form
         { category: categoryId }, // alternate key
      ];

      try {
         const oid = new ObjectId(categoryId);
         orConditions.push({ categoryId: oid }, { "category._id": oid });
      } catch (err) {}

      const subCategories = await subCategoryCollection
         .find({ $or: orConditions })
         .toArray();
      res.status(200).json(subCategories);
   } catch (error) {
      console.error("Error fetching sub-categories by category:", error);
      res.status(500).json({
         error: "Failed to fetch sub-categories for the given category",
      });
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
      // Normalize and validate status value
      const normalizedStatus = String(subCategoryStatus).toLowerCase();
      const allowedStatuses = ["active", "inactive"];
      if (!allowedStatuses.includes(normalizedStatus)) {
         return res.status(400).json({
            message: `Invalid status value. Must be one of: ${allowedStatuses.join(
               ", "
            )}`,
         });
      }
      // store normalized status to keep DB consistent
      updateFields.status = normalizedStatus;
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
      console.error("Error updating sub-category:", error);
      res.status(500).json({
         message: "Server error during sub-category update.",
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
      res.status(500).send({
         message: "Internal Server Error. Please try again later.",
      });
   }
});

export default router;
