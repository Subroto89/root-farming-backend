import express from 'express';
import { getCollection } from '../config/db.js';
import { ObjectId } from 'mongodb';

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
   } catch (error) {
    res.status(500).json("Server Error");
   }})


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
