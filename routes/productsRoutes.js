import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();


// Add Product API ----------------------------------------------
router.post("/add-product", async (req, res) => {
   try{
      const productsCollection = await getCollection("products");
      const productData = req.body;
      
      // Add Aditional Info with the Received Data --------------------
      productData.rating = 0;
      productData.reviewCount = 0;
      productData.soldAmount = 0;
      productData.quantity = 0;
      productData.createdAt = new Date().toISOString();
      productData.updatedAt = new Date().toISOString();
      productData.productStatus = 'Out of stock'; 
      productData.accountStatus = "inactive";
      productData.isApproved = false;

      console.log(productData)

      // Save into Products Collection -------------------------------
      const data = await productsCollection.insertOne(productData);
      res.status(201).send(data);
   }
   catch(error){
      res.status(400).send("Product Insertion Failed Due to Server Error!")
   }
})

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
