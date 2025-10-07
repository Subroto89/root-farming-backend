import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';

const router = express.Router();

// GET all blogs
router.get('/', async (req, res) => {
  try {
    const collection = await getCollection('blogs');
    const blogs = await collection.find().sort({ _id: -1 }).toArray();
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: 'Failed to fetch blogs', error: err.message });
  }
});

// ---------------- Featured blog ----------------
router.get('/featured', async (req, res) => {
  try {
    const blog = await (
      await getCollection('blogs')
    ).findOne({ featured: true });
    res.json(blog);
  } catch (err) {
    console.error('Error fetching featured blog:', err);
    res.status(500).json({ message: 'Failed to fetch featured blog' });
  }
});

// POST create new blog
router.post('/', async (req, res) => {
  try {
    const blog = req.body;

    if (!blog.title || !blog.content || !blog.author || !blog.category) {
      return res
        .status(400)
        .json({ message: 'Title, content, author, and category are required' });
    }

    blog.createdAt = new Date();
    blog.tags = blog.tags || []; // Ensure tags is always an array
    blog.likes = 0;
    blog.dislikes = 0;
    blog.likedBy = [];
    blog.dislikedBy = [];
    blog.comments = [];

    const collection = await getCollection('blogs');
    const result = await collection.insertOne(blog);

    res.status(201).json({ ...blog, _id: result.insertedId });
  } catch (err) {
    console.error('Error creating blog:', err);
    res
      .status(500)
      .json({ message: 'Failed to create blog', error: err.message });
  }
});

// PUT update blog
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const collection = await getCollection('blogs');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const updatedBlog = await collection.findOne({ _id: new ObjectId(id) });
    res.json(updatedBlog);
  } catch (err) {
    console.error('Error updating blog:', err);
    res
      .status(500)
      .json({ message: 'Failed to update blog', error: err.message });
  }
});
// DELETE blog
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid blog ID' });
    }

    const collection = await getCollection('blogs');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    res
      .status(500)
      .json({ message: 'Failed to delete blog', error: err.message });
  }
});
export default router;
