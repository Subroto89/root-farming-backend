const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model");
const { verifyToken } = require("../middleware/authMiddleware");

// Get all notifications for the authenticated user
router.get("/", verifyToken, async (req, res) => {
   try {
      const { page = 1, limit = 20, status } = req.query;
      const query = { userId: req.user.uid };

      // Add status filter if provided
      if (status === "unread") {
         query.read = false;
      } else if (status === "read") {
         query.read = true;
      }

      const notifications = await Notification.find(query)
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(limit);

      const total = await Notification.countDocuments(query);

      res.json({
         notifications,
         totalPages: Math.ceil(total / limit),
         currentPage: page,
         total,
      });
   } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
   }
});

// Mark notification as read
router.patch("/:id/read", verifyToken, async (req, res) => {
   try {
      const notification = await Notification.findOne({
         _id: req.params.id,
         userId: req.user.uid,
      });

      if (!notification) {
         return res.status(404).json({ error: "Notification not found" });
      }

      await notification.markAsRead();

      // Notify connected devices via socket
      const notificationHandler = req.app.get("notificationHandler");
      if (notificationHandler) {
         notificationHandler.io
            .to(`user:${req.user.uid}`)
            .emit("notificationUpdated", {
               id: notification._id,
               read: true,
            });
      }

      res.json({ success: true });
   } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to update notification" });
   }
});

// Mark all notifications as read
router.post("/mark-all-read", verifyToken, async (req, res) => {
   try {
      await Notification.updateMany(
         { userId: req.user.uid, read: false },
         { $set: { read: true } }
      );

      // Notify connected devices via socket
      const notificationHandler = req.app.get("notificationHandler");
      if (notificationHandler) {
         notificationHandler.io
            .to(`user:${req.user.uid}`)
            .emit("allNotificationsRead");
      }

      res.json({ success: true });
   } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to update notifications" });
   }
});

// Delete a notification
router.delete("/:id", verifyToken, async (req, res) => {
   try {
      const result = await Notification.deleteOne({
         _id: req.params.id,
         userId: req.user.uid,
      });

      if (result.deletedCount === 0) {
         return res.status(404).json({ error: "Notification not found" });
      }

      // Notify connected devices via socket
      const notificationHandler = req.app.get("notificationHandler");
      if (notificationHandler) {
         notificationHandler.io
            .to(`user:${req.user.uid}`)
            .emit("notificationRemoved", {
               id: req.params.id,
            });
      }

      res.json({ success: true });
   } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
   }
});

// Get notification counts
router.get("/counts", verifyToken, async (req, res) => {
   try {
      const unreadCount = await Notification.countDocuments({
         userId: req.user.uid,
         read: false,
      });

      const totalCount = await Notification.countDocuments({
         userId: req.user.uid,
      });

      res.json({ unreadCount, totalCount });
   } catch (error) {
      console.error("Error fetching notification counts:", error);
      res.status(500).json({ error: "Failed to fetch notification counts" });
   }
});

export default router;
