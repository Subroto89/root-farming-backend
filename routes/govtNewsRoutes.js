// ====================================
// Govt News Routes
// ====================================

import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';

const router = express.Router();

// ✅ GET all govt news
router.get('/', async (req, res) => {
  try {
    const collection = await getCollection('govtNews');
    const result = await collection.find().sort({ _id: -1 }).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({ message: 'Failed to fetch news' });
  }
});

// ✅ POST new govt news
router.post('/', async (req, res) => {
  try {
    const collection = await getCollection('govtNews');
    const data = req.body;
    const result = await collection.insertOne(data);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Error adding news:', error);
    res.status(500).json({ message: 'Failed to add news' });
  }
});

// ✅ PUT update govt news by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const collection = await getCollection('govtNews');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json({ message: 'News updated successfully' });
  } catch (error) {
    console.error('❌ Error updating news:', error);
    res.status(500).json({ message: 'Failed to update news' });
  }
});

// ✅ DELETE govt news by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await getCollection('govtNews');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error deleting news:', error);
    res.status(500).json({ message: 'Failed to delete news' });
  }
});

export default router;
