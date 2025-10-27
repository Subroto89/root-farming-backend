const Notification = require('../models/notification.model');

class NotificationService {
  constructor(notificationHandler) {
    this.notificationHandler = notificationHandler;
  }

  // Send task due notification
  async sendTaskDueNotification(userId, task) {
    return this.notificationHandler.sendNotification(userId, {
      type: 'task_due',
      title: 'Task Due Today',
      message: `Task "${task.title}" is due today`,
      taskId: task._id,
      metadata: {
        taskType: task.type,
        dueDate: task.dueDate,
        priority: task.priority
      }
    });
  }

  // Send task reminder notification
  async sendTaskReminder(userId, task, daysUntilDue) {
    return this.notificationHandler.sendNotification(userId, {
      type: 'task_reminder',
      title: 'Upcoming Task Reminder',
      message: `Task "${task.title}" is due in ${daysUntilDue} days`,
      taskId: task._id,
      metadata: {
        taskType: task.type,
        dueDate: task.dueDate,
        daysUntilDue
      }
    });
  }

  // Send instruction update notification
  async sendInstructionUpdateNotification(userId, instruction) {
    return this.notificationHandler.sendNotification(userId, {
      type: 'instruction_update',
      title: 'Cultivation Instructions Updated',
      message: `Instructions for ${instruction.cropName} have been updated`,
      metadata: {
        cropId: instruction.cropId,
        version: instruction.version,
        changedBy: instruction.updatedBy
      }
    });
  }

  // Send task status update notification
  async sendTaskStatusNotification(userId, task, oldStatus, newStatus) {
    return this.notificationHandler.sendNotification(userId, {
      type: 'task_update',
      title: 'Task Status Changed',
      message: `Task "${task.title}" status changed from ${oldStatus} to ${newStatus}`,
      taskId: task._id,
      metadata: {
        oldStatus,
        newStatus,
        updatedAt: new Date()
      }
    });
  }

  // Helper method to send notifications to multiple users
  async broadcastToUsers(userIds, notificationData) {
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.notificationHandler.sendNotification(userId, notificationData)
      )
    );
    return notifications;
  }

  // Schedule future notifications
  async scheduleNotification(userId, notificationData, scheduledTime) {
    const timeUntilNotification = scheduledTime.getTime() - Date.now();
    
    if (timeUntilNotification <= 0) {
      // Send immediately if scheduled time has passed
      return this.notificationHandler.sendNotification(userId, notificationData);
    }

    // Schedule the notification
    setTimeout(async () => {
      try {
        await this.notificationHandler.sendNotification(userId, notificationData);
      } catch (error) {
        console.error('Failed to send scheduled notification:', error);
      }
    }, timeUntilNotification);
  }
}

module.exports = NotificationService;