import express from 'express';
import { getCollection } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// ----------------- GET UNIQUE CATEGORIES -----------------
router.get('/categories', async (req, res) => {
  try {
    const products = await getCollection('products');
    const categories = await products.distinct('category');
    res.json(['All', ...categories]);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// ----------------- GET UNIQUE LOCATIONS -----------------
router.get('/locations', async (req, res) => {
  try {
    const products = await getCollection('products');
    const locations = await products.distinct('location');
    res.json(['All', ...locations]);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// ----------------- GET ALL PRODUCTS -----------------
router.get('/', async (req, res) => {
  try {
    const { search, category, location, sort } = req.query;
    const productsCollection = await getCollection('products');

    const query = {};

    if (category && category !== 'All') query.category = category;

    // ✅ Location filter (partial match)
    if (location && location !== 'All') {
      query.location = { $regex: location, $options: 'i' };
    }

    // ✅ Search in multiple fields (including location)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { farmer: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    let products = await productsCollection.find(query).toArray();

    // ✅ Sorting
    const sortMap = {
      'price-low': (a, b) => a.price - b.price,
      'price-high': (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    if (sort && sortMap[sort]) products.sort(sortMap[sort]);

    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// ----------------- GET SINGLE PRODUCT -----------------
router.get('/:id', async (req, res) => {
  try {
    const products = await getCollection('products');
    const product = await products.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// ----------------- ADD NEW PRODUCT -----------------
router.post('/', async (req, res) => {
  try {
    const products = await getCollection('products');
    const result = await products.insertOne(req.body);
    res.status(201).json({ message: 'Product added', id: result.insertedId });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ message: 'Failed to add product' });
  }
});

// ----------------- UPDATE PRODUCT -----------------
router.put('/:id', async (req, res) => {
  try {
    const products = await getCollection('products');
    const result = await products.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// ----------------- DELETE PRODUCT -----------------
router.delete('/:id', async (req, res) => {
  try {
    const products = await getCollection('products');
    const result = await products.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;
