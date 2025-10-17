import express from 'express';
import { getCollection } from '../config/db.js';
import { ObjectId } from 'mongodb';
const router = express.Router();

// GET wishlist for user
router.get('/:userEmail', async (req, res) => {
  try {
    const wishlist = await getCollection('wishlist');
    const items = await wishlist
      .find({ userEmail: req.params.userEmail })
      .toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get wishlist' });
  }
});

// POST add to wishlist
router.post('/', async (req, res) => {
  try {
    const wishlist = await getCollection('wishlist');
    const { userEmail, product } = req.body;

    if (!userEmail || !product) {
      return res.status(400).json({ message: 'Missing userEmail or product' });
    }

    // Prevent duplicates
    const exists = await wishlist.findOne({
      userEmail,
      'product._id': product._id,
    });
    if (exists) {
      return res.status(409).json({ message: 'Product already in wishlist' });
    }

    const result = await wishlist.insertOne({
      userEmail,
      product,
      createdAt: new Date(),
    });
    res
      .status(201)
      .json({ message: 'Added to wishlist', id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add to wishlist' });
  }
});

// DELETE wishlist item by userEmail + productId
router.delete('/:userEmail/:productId', async (req, res) => {
  try {
    const wishlist = await getCollection('wishlist');
    const { userEmail, productId } = req.params;

    const result = await wishlist.deleteOne({
      userEmail,
      'product._id': productId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove wishlist item' });
  }
});

export default router;
