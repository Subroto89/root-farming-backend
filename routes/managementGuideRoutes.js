import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// CREATE Guide
router.post("/", async (req, res) => {
    try {
        const guidesCollection = await getCollection("guides");
        const result = await guidesCollection.insertOne(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to create guide", error });
    }
});

// READ all guides (optionally filtered by role)
router.get("/", async (req, res) => {
    try {
        const guidesCollection = await getCollection("guides");
        const role = req.query.role;
        const query = role ? { targetRole: role } : {};
        const guides = await guidesCollection.find(query).toArray();
        res.status(200).json(guides);
    } catch (error) {
        res.status(500).json({ message: "Failed to get guides", error });
    }
});

// UPDATE Guide
router.put("/:id", async (req, res) => {
    try {
        const { ObjectId } = await import("mongodb");
        const guidesCollection = await getCollection("guides");

        // Exclude _id field if it exists in the body
        const { _id, ...updateFields } = req.body;

        // Update the guide safely
        const result = await guidesCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateFields }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: "Guide updated successfully", result });
        } else {
            res
                .status(404)
                .json({ message: "No guide found or no changes were made" });
        }
    } catch (error) {
        console.error("Error updating guide:", error);
        res.status(500).json({ message: "Failed to update guide", error });
    }
});


// DELETE Guide
router.delete("/:id", async (req, res) => {
    try {
        const { ObjectId } = await import("mongodb");
        const guidesCollection = await getCollection("guides");
        const result = await guidesCollection.deleteOne({
            _id: new ObjectId(req.params.id),
        });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Failed to delete guide", error });
    }
});

export default router;
