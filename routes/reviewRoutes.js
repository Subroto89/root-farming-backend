import express from 'express';
import { getCollection } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

/* =============================
   ✅ GET latest 4 reviews
============================= */
router.get('/', async (req, res) => {
  try {
    const reviews = await getCollection('reviews');
    const latest = await reviews
      .find()
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();
    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

/* =============================
   ✅ GET reviews for a specific product
============================= */
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await getCollection('reviews');
    const list = await reviews
      .find({ productId: req.params.productId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch product reviews' });
  }
});

/* =============================
   ✅ GET all reviews by logged-in user (My Reviews)
============================= */
// Get reviews for a user with product info
router.get('/user/:email', async (req, res) => {
  try {
    const reviewsCollection = await getCollection('reviews');
    const productsCollection = await getCollection('products');
    const email = req.params.email;

    const reviews = await reviewsCollection
      .find({ 'user.email': email })
      .sort({ createdAt: -1 })
      .toArray();

    // Fetch product name and farmer for each review
    const reviewsWithProduct = await Promise.all(
      reviews.map(async r => {
        const product = await productsCollection.findOne({
          _id: new ObjectId(r.productId),
        });
        return {
          ...r,
          productTitle: product?.name || 'Unknown Product',
          farmerName: product?.farmer || 'Unknown Farmer',
        };
      })
    );

    res.json(reviewsWithProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user reviews' });
  }
});

/* =============================
   ✅ POST add new review
   - Prevent multiple reviews by same user for same product
============================= */
router.post('/', async (req, res) => {
  try {
    const reviews = await getCollection('reviews');
    const { productId, user } = req.body;

    if (!user || !user.email) {
      return res.status(400).json({ message: 'User info missing' });
    }

    // Check if user already reviewed this product
    const existing = await reviews.findOne({
      productId,
      'user.email': user.email,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: 'You already reviewed this product' });
    }

    const payload = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await reviews.insertOne(payload);
    res.status(201).json({ message: 'Review added', id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add review' });
  }
});

/* =============================
   ✅ DELETE review by ID
   - Used for My Reviews page
============================= */
router.delete('/:id', async (req, res) => {
  try {
    const reviews = await getCollection('reviews');
    const id = req.params.id;

    const result = await reviews.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

export default router;
