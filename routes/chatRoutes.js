
import express from "express";
import { getCollection } from "../config/db.js";
import { ObjectId } from "mongodb";
import { verifyFirebaseToken as verifyFirebaseTokenMiddleware } from "../middleware/verifyFirebaseToken.js";

const router = express.Router();

// GET /conversations  (for current user)
router.get(
   "/conversations",
   verifyFirebaseTokenMiddleware,
   async (req, res) => {
      const userId = req.user.uid;
      const conversations = await getCollection("conversations");
      const list = await conversations
         .find({ participants: userId })
         .sort({ lastUpdated: -1 })
         .toArray();
      res.json(list);
   }
);

// GET /conversations/:id/messages?page=1&limit=30
router.get(
   "/conversations/:id/messages",
   verifyFirebaseTokenMiddleware,
   async (req, res) => {
      const { id } = req.params;
      const page = Math.max(1, parseInt(req.query.page || "1"));
      const limit = Math.min(100, parseInt(req.query.limit || "30"));
      const messagesCol = await getCollection("messages");
      const msgs = await messagesCol
         .find({ conversationId: new ObjectId(id) })
         .sort({ createdAt: -1 })
         .skip((page - 1) * limit)
         .limit(limit)
         .toArray();
      res.json(msgs.reverse()); // return oldest-first for UI
   }
);

export default router;

