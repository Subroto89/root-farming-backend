const nodemailer = require('nodemailer');
const Email = require('email-templates');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.email = new Email({
      message: {
        from: process.env.EMAIL_FROM || 'Root Farming <notifications@rootfarming.com>'
      },
      send: true,
      transport: this.transporter,
      views: {
        root: path.join(__dirname, 'templates'),
        options: {
          extension: 'ejs'
        }
      }
    });
  }

  async sendTaskNotification(to, { title, message, taskId, type, metadata }) {
    try {
      await this.email.send({
        template: 'task-notification',
        message: { to },
        locals: {
          title,
          message,
          taskId,
          type,
          metadata,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending task notification email:', error);
      throw error;
    }
  }

  async sendCultivationUpdate(to, { title, message, cultivationId, phase, metadata }) {
    try {
      await this.email.send({
        template: 'cultivation-update',
        message: { to },
        locals: {
          title,
          message,
          cultivationId,
          phase,
          metadata,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending cultivation update email:', error);
      throw error;
    }
  }

  async sendCriticalAlert(to, { title, message, type, metadata }) {
    try {
      await this.email.send({
        template: 'critical-alert',
        message: {
          to,
          priority: 'high'
        },
        locals: {
          title,
          message,
          type,
          metadata,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending critical alert email:', error);
      throw error;
    }
  }

  async sendWeeklyDigest(to, { tasks, cultivations, statistics }) {
    try {
      await this.email.send({
        template: 'weekly-digest',
        message: { to },
        locals: {
          tasks,
          cultivations,
          statistics,
          appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Error sending weekly digest email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();