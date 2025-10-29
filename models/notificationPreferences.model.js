const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // General notification settings
  enabled: {
    type: Boolean,
    default: true
  },
  
  emailNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    email: {
      type: String,
      required: false
    }
  },

  // Task notifications
  tasks: {
    dueToday: {
      type: Boolean,
      default: true
    },
    upcoming: {
      type: Boolean,
      default: true
    },
    statusChanges: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: Number,
      default: 3,
      min: 1,
      max: 7
    }
  },

  // Cultivation notifications
  cultivation: {
    phaseChanges: {
      type: Boolean,
      default: true
    },
    criticalAlerts: {
      type: Boolean,
      default: true
    },
    weeklyProgress: {
      type: Boolean,
      default: true
    },
    instructionUpdates: {
      type: Boolean,
      default: true
    }
  },

  // Quiet hours (user's local time)
  quietHours: {
    enabled: {
      type: Boolean,
      default: false
    },
    start: {
      type: String,
      default: '22:00', // 10 PM
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Invalid time format (HH:mm required)'
      }
    },
    end: {
      type: String,
      default: '07:00', // 7 AM
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Invalid time format (HH:mm required)'
      }
    }
  },

  timezone: {
    type: String,
    default: 'UTC'
  },

  // When these notifications were last modified
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt timestamp
notificationPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create default preferences for a user
notificationPreferencesSchema.statics.createDefault = async function(userId, email) {
  return this.create({
    userId,
    emailNotifications: {
      enabled: true,
      email: email
    }
  });
};

// Get preferences with default fallback
notificationPreferencesSchema.statics.getWithDefaults = async function(userId) {
  let prefs = await this.findOne({ userId });
  
  if (!prefs) {
    prefs = await this.createDefault(userId);
  }
  
  return prefs;
};

const NotificationPreferences = mongoose.model('NotificationPreferences', notificationPreferencesSchema);

module.exports = NotificationPreferences;