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

// POST /conversations/:id/messages
router.post(
   "/conversations/:id/messages",
   verifyFirebaseTokenMiddleware,
   async (req, res) => {
      try {
         const { id } = req.params;
         const { text } = req.body;
         const senderUid = req.user.uid;

         if (!text?.trim()) {
            return res.status(400).json({ error: "Message text required" });
         }

         const messagesCol = await getCollection("messages");
         const conversationsCol = await getCollection("conversations");

         // Create message document
         const messageDoc = {
            conversationId: new ObjectId(id),
            senderUid,
            text,
            createdAt: new Date(),
         };

         const result = await messagesCol.insertOne(messageDoc);

         // Update conversation lastUpdated + ensure it exists
         await conversationsCol.updateOne(
            { _id: new ObjectId(id) },
            { $set: { lastUpdated: new Date() } }
         );

         // Return saved message
         res.status(201).json({ ...messageDoc, _id: result.insertedId });
      } catch (err) {
         console.error("Message save failed:", err);
         res.status(500).json({ error: "Internal server error" });
      }
   }
);

// in root/routes/chatRoutes.js (add near other routes)
router.post(
   "/conversations/start",
   verifyFirebaseTokenMiddleware,
   async (req, res) => {
      try {
         const senderUid = req.user.uid;
         const { recipientUid } = req.body;
         if (!recipientUid) {
            return res.status(400).json({ error: "recipientUid required" });
         }

         const conversationsCol = await getCollection("conversations");

         // Sorted participants to avoid duplicates
         const participants = [senderUid, recipientUid].sort();

         const conv = await conversationsCol.findOneAndUpdate(
            { participants },
            {
               $setOnInsert: {
                  participants,
                  lastMessage: "",
                  lastUpdated: new Date(),
                  unreadCounts: { [recipientUid]: 0, [senderUid]: 0 },
               },
            },
            { upsert: true, returnDocument: "after" }
         );

         // conv.value should be the conversation doc
         if (!conv?.value) {
            return res
               .status(500)
               .json({ error: "Failed to create conversation" });
         }

         // return conversation (string _id and other fields)
         const conversation = {
            ...conv.value,
            _id: conv.value._id.toString(),
         };

         res.status(200).json(conversation);
      } catch (err) {
         console.error("start conversation error:", err);
         res.status(500).json({ error: "Server error" });
      }
   }
);

export default router;
