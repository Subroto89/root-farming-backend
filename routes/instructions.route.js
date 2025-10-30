const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/verifyJWT');
const { verifySpecialist } = require('../middleware/verifySpecialist');
const Instruction = require('../models/instruction.model');

// Get all published instructions
router.get('/instructions', verifyJWT, async (req, res) => {
  try {
    const { categoryId, variantId, status = 'published' } = req.query;
    const query = { status };
    
    if (categoryId) query.categoryId = categoryId;
    if (variantId) query.variantId = variantId;
    
    const instructions = await Instruction.find(query)
      .sort('-createdAt')
      .populate('categoryId')
      .populate('subCategoryId')
      .populate('variantId');
      
    res.json(instructions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get instruction by ID
router.get('/instructions/:id', verifyJWT, async (req, res) => {
  try {
    const instruction = await Instruction.findById(req.params.id)
      .populate('categoryId')
      .populate('subCategoryId')
      .populate('variantId');
      
    if (!instruction) {
      return res.status(404).json({ error: 'Instruction not found' });
    }
    res.json(instruction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new instruction (Specialist only)
router.post('/instructions', verifyJWT, verifySpecialist, async (req, res) => {
  try {
    const instruction = new Instruction({
      ...req.body,
      authorId: req.user.uid
    });
    await instruction.save();
    res.status(201).json(instruction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update instruction (Specialist only)
router.put('/instructions/:id', verifyJWT, verifySpecialist, async (req, res) => {
  try {
    const instruction = await Instruction.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user.uid },
      req.body,
      { new: true }
    );
    
    if (!instruction) {
      return res.status(404).json({ error: 'Instruction not found or unauthorized' });
    }
    res.json(instruction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete instruction (Specialist only)
router.delete('/instructions/:id', verifyJWT, verifySpecialist, async (req, res) => {
  try {
    const instruction = await Instruction.findOneAndDelete({
      _id: req.params.id,
      authorId: req.user.uid
    });
    
    if (!instruction) {
      return res.status(404).json({ error: 'Instruction not found or unauthorized' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all instructions by author (Specialist only)
router.get('/my-instructions', verifyJWT, verifySpecialist, async (req, res) => {
  try {
    const instructions = await Instruction.find({ authorId: req.user.uid })
      .sort('-createdAt')
      .populate('categoryId')
      .populate('subCategoryId')
      .populate('variantId');
    res.json(instructions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;