const express = require('express');
const router = express.Router();
const NotificationPreferences = require('../models/notificationPreferences.model');
const { verifyToken } = require('../middleware/authMiddleware');

// Get user's notification preferences
router.get('/', verifyToken, async (req, res) => {
  try {
    const preferences = await NotificationPreferences.getWithDefaults(req.user.uid);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
router.patch('/', verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    
    // Find and update preferences, create if doesn't exist
    let preferences = await NotificationPreferences.findOne({ userId: req.user.uid });
    
    if (!preferences) {
      preferences = new NotificationPreferences({ userId: req.user.uid });
    }

    // Update each section if provided
    if (updates.enabled !== undefined) {
      preferences.enabled = updates.enabled;
    }

    if (updates.emailNotifications) {
      preferences.emailNotifications = {
        ...preferences.emailNotifications,
        ...updates.emailNotifications
      };
    }

    if (updates.tasks) {
      preferences.tasks = {
        ...preferences.tasks,
        ...updates.tasks
      };
    }

    if (updates.cultivation) {
      preferences.cultivation = {
        ...preferences.cultivation,
        ...updates.cultivation
      };
    }

    if (updates.quietHours) {
      preferences.quietHours = {
        ...preferences.quietHours,
        ...updates.quietHours
      };
    }

    if (updates.timezone) {
      preferences.timezone = updates.timezone;
    }

    await preferences.save();
    res.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Reset preferences to default
router.post('/reset', verifyToken, async (req, res) => {
  try {
    await NotificationPreferences.deleteOne({ userId: req.user.uid });
    const preferences = await NotificationPreferences.createDefault(req.user.uid);
    res.json(preferences);
  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    res.status(500).json({ error: 'Failed to reset notification preferences' });
  }
});

module.exports = router;