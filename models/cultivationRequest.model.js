const mongoose = require('mongoose');

const cultivationRequestSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: true,
    index: true
  },
  instructionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instruction',
    required: true
  },
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  estimatedEndDate: {
    type: Date,
    required: true
  },
  actualEndDate: Date,
  progress: {
    currentPhase: Number,
    completedTasks: [{
      phaseIndex: Number,
      taskIndex: Number,
      completedAt: Date,
      notes: String
    }]
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps before saving
cultivationRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const CultivationRequest = mongoose.model('CultivationRequest', cultivationRequestSchema);

module.exports = CultivationRequest;