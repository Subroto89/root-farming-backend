import express from "express";
import { getCollection } from "../config/db.js";
const router = express.Router();
import { verifyFirebaseToken as verifyJWT } from "../middleware/verifyFirebaseToken.js";
import { ObjectId } from "mongodb";

// GET – get all published instructions
router.get("/", async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");
      const { categoryId, variantId, status = "published" } = req.query;

      const query = { status };
      if (categoryId) query.categoryId = categoryId;
      if (variantId) query.variantId = variantId;

      const instructions = await instructionCollection
         .find(query)
         .sort({ createdAt: -1 })
         .toArray();

      res.json(instructions);
   } catch (error) {
      console.error("GET /instructions error:", error);
      res.status(500).json({
         message: "Failed to fetch instructions",
         error: error.message,
      });
   }
});

// GET – fetch all instructions (no filter)
router.get("/all", async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");

      const instructions = await instructionCollection
         .find({})
         .sort({ createdAt: -1 })
         .toArray();

      res.json(instructions);
   } catch (error) {
      console.error("GET /instructions/all error:", error);
      res.status(500).json({
         message: "Failed to fetch all instructions",
         error: error.message,
      });
   }
});

// GET – get instruction by ID
router.get("/:id", verifyJWT, async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");
      const instruction = await instructionCollection.findOne({
         _id: new ObjectId(req.params.id),
      });

      if (!instruction)
         return res.status(404).json({ message: "Instruction not found" });

      res.json(instruction);
   } catch (error) {
      console.error("GET /instructions/:id error:", error);
      res.status(500).json({
         message: "Failed to fetch instruction",
         error: error.message,
      });
   }
});

// POST – create new instruction (Specialist only)
router.post("/", verifyJWT, async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");
      const instructionData = {
         ...req.body,
         authorId: req.user.uid,
         createdAt: new Date(),
      };

      const result = await instructionCollection.insertOne(instructionData);
      res.status(201).json({ _id: result.insertedId, ...instructionData });
   } catch (error) {
      console.error("POST /instructions error:", error);
      res.status(400).json({
         message: "Failed to add instruction",
         error: error.message,
      });
   }
});

// PUT – update instruction (Specialist only)
router.put("/:id", verifyJWT, async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");
      const { modifiedCount, matchedCount } =
         await instructionCollection.updateOne(
            { _id: new ObjectId(req.params.id), authorId: req.user.uid },
            { $set: req.body }
         );

      if (!matchedCount)
         return res
            .status(404)
            .json({ message: "Instruction not found or unauthorized" });

      const updatedInstruction = await instructionCollection.findOne({
         _id: new ObjectId(req.params.id),
      });
      res.json(updatedInstruction);
   } catch (error) {
      console.error("PUT /instructions/:id error:", error);
      res.status(400).json({
         message: "Failed to update instruction",
         error: error.message,
      });
   }
});

// DELETE – delete instruction (Specialist only)
router.delete("/:id", verifyJWT, async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");
      const { deletedCount } = await instructionCollection.deleteOne({
         _id: new ObjectId(req.params.id),
         authorId: req.user.uid,
      });

      if (!deletedCount)
         return res
            .status(404)
            .json({ message: "Instruction not found or unauthorized" });

      res.status(204).send();
   } catch (error) {
      console.error("DELETE /instructions/:id error:", error);
      res.status(500).json({
         message: "Failed to delete instruction",
         error: error.message,
      });
   }
});

// GET – get all instructions by author (Specialist only)
router.get("/my-instructions", verifyJWT, async (req, res) => {
   try {
      const instructionCollection = await getCollection("instructions");
      const instructions = await instructionCollection
         .find({ authorId: req.user.uid })
         .sort({ createdAt: -1 })
         .toArray();

      res.json(instructions);
   } catch (error) {
      console.error("GET /my-instructions error:", error);
      res.status(500).json({
         message: "Failed to fetch your instructions",
         error: error.message,
      });
   }
});

export default router;
