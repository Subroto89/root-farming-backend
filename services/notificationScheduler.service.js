const cron = require('node-cron');
const Task = require('../models/task.model');
const Cultivation = require('../models/cultivation.model');
const { differenceInDays, startOfDay, endOfDay, addDays } = require('date-fns');

class NotificationScheduler {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.initializeSchedules();
  }

  initializeSchedules() {
    // Check for due tasks daily at 8 AM
    cron.schedule('0 8 * * *', () => this.checkDueTasks());

    // Check for upcoming tasks daily at 9 AM
    cron.schedule('0 9 * * *', () => this.checkUpcomingTasks());

    // Check cultivation phases daily at 7 AM
    cron.schedule('0 7 * * *', () => this.checkCultivationPhases());

    // Clean up old notifications weekly on Sunday at 1 AM
    cron.schedule('0 1 * * 0', () => this.cleanupOldNotifications());
  }

  async checkDueTasks() {
    try {
      const today = new Date();
      const tasks = await Task.find({
        dueDate: {
          $gte: startOfDay(today),
          $lte: endOfDay(today)
        },
        status: { $nin: ['completed', 'cancelled'] }
      }).populate('userId');

      for (const task of tasks) {
        await this.notificationService.sendTaskDueNotification(
          task.userId,
          task
        );
      }
    } catch (error) {
      console.error('Error checking due tasks:', error);
    }
  }

  async checkUpcomingTasks() {
    try {
      const today = new Date();
      const threeDaysFromNow = addDays(today, 3);
      
      const tasks = await Task.find({
        dueDate: {
          $gt: endOfDay(today),
          $lte: endOfDay(threeDaysFromNow)
        },
        status: { $nin: ['completed', 'cancelled'] }
      }).populate('userId');

      for (const task of tasks) {
        const daysUntilDue = differenceInDays(task.dueDate, today);
        await this.notificationService.sendTaskReminder(
          task.userId,
          task,
          daysUntilDue
        );
      }
    } catch (error) {
      console.error('Error checking upcoming tasks:', error);
    }
  }

  async checkCultivationPhases() {
    try {
      const today = new Date();
      const cultivations = await Cultivation.find({
        status: 'active',
        'phases.startDate': {
          $gte: startOfDay(today),
          $lte: endOfDay(today)
        }
      }).populate('farmerId');

      for (const cultivation of cultivations) {
        const activePhase = cultivation.phases.find(phase => 
          phase.startDate >= startOfDay(today) &&
          phase.startDate <= endOfDay(today)
        );

        if (activePhase) {
          await this.notificationService.sendNotification(cultivation.farmerId, {
            type: 'phase_start',
            title: 'New Cultivation Phase',
            message: `Phase "${activePhase.name}" has started for your ${cultivation.cropName} cultivation`,
            metadata: {
              cultivationId: cultivation._id,
              phaseId: activePhase._id,
              phaseName: activePhase.name,
              cropName: cultivation.cropName
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking cultivation phases:', error);
    }
  }

  async cleanupOldNotifications() {
    try {
      // This is a backup cleanup in case TTL index fails
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Method to schedule one-time notifications
  scheduleOneTimeNotification(userId, notification, scheduledTime) {
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      return; // Don't schedule if time has passed
    }

    setTimeout(async () => {
      try {
        await this.notificationService.sendNotification(userId, notification);
      } catch (error) {
        console.error('Error sending scheduled notification:', error);
      }
    }, delay);
  }

  // Method to schedule recurring notifications
  scheduleRecurringNotification(cronExpression, notification, userIds) {
    return cron.schedule(cronExpression, async () => {
      try {
        await Promise.all(
          userIds.map(userId =>
            this.notificationService.sendNotification(userId, notification)
          )
        );
      } catch (error) {
        console.error('Error sending recurring notification:', error);
      }
    });
  }
}

module.exports = NotificationScheduler;