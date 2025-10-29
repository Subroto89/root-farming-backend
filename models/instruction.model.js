const mongoose = require('mongoose');

const instructionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropCategory',
    required: true
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropSubCategory',
    required: true
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropVariant',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  authorId: {
    type: String,
    required: true,
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  phases: [{
    name: {
      type: String,
      required: true
    },
    dayOffset: {
      type: Number,
      required: true,
      min: 0
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    description: {
      type: String,
      required: true
    },
    tasks: [{
      title: {
        type: String,
        required: true
      },
      description: String,
      importance: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      requiredResources: [String],
      estimatedTime: Number // in hours
    }]
  }],
  totalDuration: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total duration before saving
instructionSchema.pre('save', function(next) {
  this.totalDuration = this.phases.reduce((total, phase) => total + phase.duration, 0);
  this.updatedAt = new Date();
  next();
});

// Create new version when updating published instruction
instructionSchema.pre('findOneAndUpdate', async function(next) {
  const instruction = await this.model.findOne(this.getQuery());
  
  if (instruction && instruction.status === 'published') {
    // Create new version
    const newVersion = new this.model({
      ...instruction.toObject(),
      _id: new mongoose.Types.ObjectId(),
      version: instruction.version + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.getUpdate()
    });

    // Archive old version
    await this.model.findByIdAndUpdate(instruction._id, { status: 'archived' });

    // Replace update operation with new version
    this.setUpdate(newVersion);
  }
  next();
});

// Methods for finding active instructions
instructionSchema.statics.findActiveByCategory = function(categoryId) {
  return this.find({
    categoryId,
    status: 'published'
  }).sort('-createdAt');
};

instructionSchema.statics.findActiveByVariant = function(variantId) {
  return this.find({
    variantId,
    status: 'published'
  }).sort('-createdAt');
};

const Instruction = mongoose.model('Instruction', instructionSchema);

module.exports = Instruction;