import express from 'express';
import { getCollection } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();
const COLLECTION_NAME = 'farmerFields'; // ✅ renamed collection

// ---------------------------------------------------------------------------
// POST → Create a new farmer field
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const field = req.body;
    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.insertOne(field);

    res.status(201).json({
      success: true,
      message: 'Farmer field created successfully',
      data: { ...field, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Create Farmer Field Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET → Fetch all farmer fields
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const collection = await getCollection(COLLECTION_NAME);
    const fields = await collection.find({}).toArray();

    res.status(200).json({
      success: true,
      message: 'Farmer fields fetched successfully',
      data: fields,
    });
  } catch (error) {
    console.error('Get Farmer Fields Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET → Fetch single farmer field by ID
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid field ID' });
    }

    const collection = await getCollection(COLLECTION_NAME);
    const field = await collection.findOne({ _id: new ObjectId(id) });

    if (!field) {
      return res
        .status(404)
        .json({ success: false, message: 'Farmer field not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Farmer field fetched successfully',
      data: field,
    });
  } catch (error) {
    console.error('Get Farmer Field by ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// PUT → Update farmer field by ID
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid field ID' });
    }

    const updateData = { ...req.body };
    delete updateData._id;

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Farmer field not found' });
    }

    const updatedField = await collection.findOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Farmer field updated successfully',
      data: updatedField,
    });
  } catch (error) {
    console.error('Update Farmer Field Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE → Remove farmer field by ID
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid field ID' });
    }

    const collection = await getCollection(COLLECTION_NAME);
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Farmer field not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Farmer field deleted successfully',
      data: { _id: id },
    });
  } catch (error) {
    console.error('Delete Farmer Field Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
