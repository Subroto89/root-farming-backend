import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
   const _id = req.query._id;

   try {
      const userCollection = await getCollection("users");
      const users = await userCollection.findOne({ _id: new ObjectId(_id) });
      res.status(200).json(users);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch users" });
   }
});

// POST - Add a new user
router.post("/", async (req, res) => {
   try {
      const userCollection = await getCollection("users");
      const userData = req.body;

      if (!userData || Object.keys(userData).length === 0) {
         return res.status(400).json({ error: "Invalid user data" });
      }

      const result = await userCollection.insertOne(userData);
      res.status(201).json({
         message: "User added successfully",
         id: result.insertedId,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add user" });
   }
});

export default router;
