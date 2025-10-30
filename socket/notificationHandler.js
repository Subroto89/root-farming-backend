const socketAuth = require('../middleware/socketAuth');
const Notification = require('../models/notification.model');
const NotificationPreferences = require('../models/notificationPreferences.model');
const emailService = require('../services/email.service');

class NotificationSocketHandler {
  constructor(io) {
    // Create a separate namespace for task notifications
    this.io = io.of('/task-socket');
    
    // Apply authentication middleware
    this.io.use(socketAuth);
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const { userId, role } = socket.auth;
      
      console.log(`User connected to notification system: ${userId} (${role})`);
      
      // Join user-specific room
      socket.join(`user:${userId}`);
      
      // Handle join event
      socket.on('join', (data) => {
        if (data.userId === userId) {
          // Send existing unread notifications on join
          this.sendUnreadNotifications(userId);
        }
      });

      // Handle mark as read
      socket.on('markNotificationRead', async ({ notificationId }) => {
        try {
          const notification = await Notification.findOne({
            _id: notificationId,
            userId
          });

          if (notification) {
            await notification.markAsRead();
            // Emit update to all user's connected devices
            this.io.to(`user:${userId}`).emit('notificationUpdated', {
              id: notificationId,
              read: true
            });
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });

      // Handle clear notification
      socket.on('clearNotification', async ({ notificationId }) => {
        try {
          await Notification.deleteOne({
            _id: notificationId,
            userId
          });
          // Emit removal to all user's connected devices
          this.io.to(`user:${userId}`).emit('notificationRemoved', {
            id: notificationId
          });
        } catch (error) {
          console.error('Error clearing notification:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected from notification system: ${userId}`);
      });
    });
  }

  async sendUnreadNotifications(userId) {
    try {
      const notifications = await Notification.getRecentNotifications(userId);
      this.io.to(`user:${userId}`).emit('initialNotifications', notifications);
    } catch (error) {
      console.error('Error sending unread notifications:', error);
    }
  }

  // Method to send notification to a specific user
  async sendNotification(userId, notification) {
    try {
      // Check user preferences
      const preferences = await NotificationPreferences.getWithDefaults(userId);
      
      // Don't send if notifications are disabled
      if (!preferences.enabled) {
        return null;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled) {
        const now = new Date();
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: preferences.timezone }));
        const currentHour = userTime.getHours();
        const currentMinutes = userTime.getMinutes();
        const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        
        const isQuietHours = this.isTimeInRange(
          currentTime,
          preferences.quietHours.start,
          preferences.quietHours.end
        );

        if (isQuietHours && !notification.urgent) {
          return null;
        }
      }

      // Check specific notification preferences
      if (notification.type.startsWith('task_') && !preferences.tasks[notification.type.replace('task_', '')]) {
        return null;
      }

      if (notification.type.startsWith('cultivation_') && !preferences.cultivation[notification.type.replace('cultivation_', '')]) {
        return null;
      }

      const newNotification = new Notification({
        userId,
        ...notification
      });
      await newNotification.save();
      
      this.io.to(`user:${userId}`).emit('taskNotification', newNotification);

      // Send email if enabled in preferences
      if (preferences.emailNotifications?.enabled && preferences.emailNotifications?.email) {
        const shouldSendEmail = 
          (notification.type.startsWith('task_') && preferences.tasks[notification.type.replace('task_', '')]) ||
          (notification.type.startsWith('cultivation_') && preferences.cultivation[notification.type.replace('cultivation_', '')]) ||
          notification.urgent;

        if (shouldSendEmail) {
          if (notification.type.startsWith('task_')) {
            await emailService.sendTaskNotification(
              preferences.emailNotifications.email,
              notification
            );
          } else if (notification.type.startsWith('cultivation_')) {
            await emailService.sendCultivationUpdate(
              preferences.emailNotifications.email,
              notification
            );
          }
        }
      }

      return newNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  isTimeInRange(current, start, end) {
    // Convert times to minutes for easier comparison
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const currentMinutes = toMinutes(current);
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Handle overnight range (e.g., 22:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  // Method to update task status and notify user
  async updateTaskStatus(userId, taskId, status) {
    try {
      // Create notification for status update
      await this.sendNotification(userId, {
        type: 'task_update',
        taskId,
        title: 'Task Status Updated',
        message: `Task status changed to: ${status}`,
        metadata: { status }
      });

      // Emit task update event
      this.io.to(`user:${userId}`).emit('taskUpdate', {
        taskId,
        update: { status }
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
}

module.exports = NotificationSocketHandler;