import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// GET all products
router.get("/", async (req, res) => {
   try {
      const productsCollection = await getCollection("products");
      const products = await productsCollection.find({}).toArray();
      res.status(200).json(products);
   } catch (error) {}
});

export default router;
