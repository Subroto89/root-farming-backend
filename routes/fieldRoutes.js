import express from 'express';
import { getCollection } from '../config/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// POST → Create a new field

router.post('/', async (req, res) => {
  try {
    const field = req.body;
    const fieldsCollection = await getCollection('fields');
    const result = await fieldsCollection.insertOne(field);

    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      data: { ...field, _id: result.insertedId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET → Fetch all fields

router.get('/', async (req, res) => {
  try {
    const fieldsCollection = await getCollection('fields');
    const fields = await fieldsCollection.find({}).toArray();

    res.status(200).json({
      success: true,
      message: 'Fields fetched successfully',
      data: fields,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT → Update field by ID

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid field ID' });
    }

    const updateData = { ...req.body };
    delete updateData._id; // Remove _id if sent

    const fieldsCollection = await getCollection('fields');

    const result = await fieldsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Field not found' });
    }

    const updatedField = await fieldsCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: 'Field updated successfully',
      data: updatedField,
    });
  } catch (error) {
    console.error('Update Field Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE → Remove field by ID

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid field ID' });
    }

    const fieldsCollection = await getCollection('fields');
    const result = await fieldsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Field not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Field deleted successfully',
      data: { _id: id },
    });
  } catch (error) {
    console.error('Delete Field Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
