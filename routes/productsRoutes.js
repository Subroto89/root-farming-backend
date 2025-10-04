import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// GET all products
router.get("/all-products", async (req, res) => {
   try {
      const productsCollection = await getCollection("products");
      const products = await productsCollection.find({}).toArray();
      res.status(200).json(products);
   } catch (error) {}

});

// get best selling products
router.get("/best-selling", async (req, res) => {
   try {
      const productsCollection = await getCollection("products");
      const products = await productsCollection
         .find({})
         .sort({ sold: -1 })
         .limit(4)
         .toArray();
      res.status(200).json(products);
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch best selling products" });
   }
});

export default router;
