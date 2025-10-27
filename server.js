const express = require('express');
const cors = require('cors');
const setupServer = require('./socket/setupServer');
const NotificationService = require('./services/notification.service');
const NotificationScheduler = require('./services/notificationScheduler.service');
const notificationRoutes = require('./routes/notifications.routes');

// Create server with socket.io support
const { app, server } = setupServer();

// Get notification handler from setup
const notificationHandler = app.get('notificationHandler');

// Create notification service instance
const notificationService = new NotificationService(notificationHandler);

// Initialize notification scheduler
const notificationScheduler = new NotificationScheduler(notificationService);

// Make services available to routes
app.set('notificationService', notificationService);
app.set('notificationScheduler', notificationScheduler);

// Routes
app.use('/api/notifications', notificationRoutes);

// Example of how to use notifications in other routes
app.post('/api/tasks/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const userId = req.user.uid; // From auth middleware

    // Update task status in database
    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    );

    // Send notification about status change
    await notificationService.sendTaskStatusNotification(
      userId,
      task,
      task.previousStatus,
      status
    );

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});