import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// GET All Users
router.get("/", async (req, res) => {
   
   try {
      const userCollection = await getCollection("users");
      const users = await userCollection.find({  }).toArray();
      res.status(200).json(users);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch users" });
   }
});

// POST - Add a new user
router.post("/save-user", async (req, res) => {

      try {
      const userData = req.body;
      const query = { userEmail: userData?.userEmail };
      const usersCollection = await getCollection("users");

      
        const alreadyUserExist = await usersCollection.findOne(query);
        if (alreadyUserExist) {
          await usersCollection.updateOne(query, {
            $set: { lastLoggedIn: new Date().toISOString() },
          });
          return res.status(200).send({ message: "User login time updated." });
        }

        userData.status =
          userData?.userRole === "customer" ? "Customer" : `Request for ${userData.userRole} account`;
        userData.userRole = "Customer";
        userData.createdAt = new Date().toISOString();
        userData.lastLoggedIn = new Date().toISOString();
        const result = await usersCollection.insertOne(userData);
        return res.status(201).send({ 
            message: "User created successfully.", 
            insertedId: result.insertedId 
        })
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .send({ error: "Server error. Please try again later." });
      }
    });

export default router;




   
