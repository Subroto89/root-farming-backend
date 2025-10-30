import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// ------------------ ADD TO CART ------------------
router.post("/add-to-cart", async (req, res) => {
  try {
    const {
      productId,
      name,
      price,
      image,
      userEmail,
      shippingAddress,
      userPhone,
    } = req.body;

    if (!productId || !userEmail)
      return res.status(400).json({ error: "Missing required fields" });

    const cartCollection = await getCollection("cart");

    const existingItem = await cartCollection.findOne({ productId, userEmail });

    if (existingItem) {
      await cartCollection.updateOne(
        { productId, userEmail },
        {
          $inc: { quantity: 1 },
          $set: {
            updatedAt: new Date().toISOString(),
            shippingAddress,
            userPhone,
          },
        }
      );
      return res.status(200).json({ message: "Quantity updated" });
    }

    const newItem = {
      productId,
      name,
      price,
      image,
      userEmail,
      shippingAddress: shippingAddress || null,
      userPhone: userPhone || null,
      quantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await cartCollection.insertOne(newItem);
    res.status(201).json({
      message: "Added to cart successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// ------------------ GET USER CART ------------------
router.get("/get-cart", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const cartCollection = await getCollection("cart");
    const cartItems = await cartCollection.find({ userEmail: email }).toArray();

    res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error fetching cart items:", error.message);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});// ------------------ UPDATE QUANTITY ------------------
router.patch("/update-cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const cartCollection = await getCollection("cart");

    await cartCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { quantity, updatedAt: new Date().toISOString() } }
    );

    res.status(200).json({ message: "Cart quantity updated" });
  } catch (error) {
    console.error("Error updating quantity:", error.message);
    res.status(500).json({ error: "Failed to update cart quantity" });
  }
});

// ------------------ REMOVE ITEM ------------------
router.delete("/delete-cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid ID" });

    const cartCollection = await getCollection("cart");
    const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ message: "Item removed from cart", result });
  } catch (error) {
    console.error("Error deleting cart item:", error.message);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});



export default router;
