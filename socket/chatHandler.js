// server/socket/chatHandler.js
import { getCollection } from "../config/db.js";
import { ObjectId } from "mongodb";

/**
 * registerSocketHandlers(io)
 * - call this once from your index.js AFTER setting up io (and after io.use(authMiddleware) if you're using it)
 */
const registerSocketHandlers = (io) => {
   io.on("connection", (socket) => {
      // authenticated uid (set by verifySocketAuth middleware)
      // make sure your verifySocketAuth sets socket.user = decodedToken
      const uid =
         socket.user?.uid ||
         socket.data?.user?.uid ||
         socket.handshake.query?.userId;
      console.log("Socket connected:", uid, socket.id);

      // Optional: join a per-user room so we can target users by uid
      if (uid) {
         socket.join(uid);
      }

      // ---------- MESSAGE EVENT ----------
      // payload: { tempId?, conversationId?, recipientUid, text, senderRole?, attachments? }
      socket.on("message", async (payload) => {
         try {
            const senderUid = uid || payload.senderUid;
            const recipientUid = payload.recipientUid;
            if (!senderUid || !recipientUid) {
               socket.emit("message:error", {
                  tempId: payload.tempId,
                  error: "Missing sender or recipient",
               });
               return;
            }

            const conversationsCol = await getCollection("conversations");
            const messagesCol = await getCollection("messages");

            // find or create conversation
            let convId = payload.conversationId;
            if (!convId) {
               // use sorted participants key to avoid duplicate conversations
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

               convId = conv.value._id.toString();
            }

            // create message document
            const msgDoc = {
               conversationId: new ObjectId(convId),
               senderUid,
               senderRole: payload.senderRole || "farmer",
               text: payload.text || "",
               attachments: payload.attachments || [],
               status: "sent",
               createdAt: new Date(),
            };

            const insertRes = await messagesCol.insertOne(msgDoc);
            msgDoc._id = insertRes.insertedId;

            // update conversation metadata (lastMessage, lastUpdated, unread count)
            await conversationsCol.updateOne(
               { _id: new ObjectId(convId) },
               {
                  $set: {
                     lastMessage: payload.text || "",
                     lastUpdated: new Date(),
                  },
                  $inc: { [`unreadCounts.${recipientUid}`]: 1 },
               }
            );

            // Emit message to recipient (if online they will get it)
            io.to(recipientUid).emit("message", {
               ...msgDoc,
               conversationId: convId, // make it a string for clients
            });

            // Acknowledge sender so client can replace tempId
            socket.emit("message:ack", {
               tempId: payload.tempId,
               savedMessage: { ...msgDoc, conversationId: convId },
            });
         } catch (err) {
            console.error("socket message handler error:", err);
            socket.emit("message:error", {
               tempId: payload?.tempId,
               error: err.message,
            });
         }
      });

      // ---------- TYPING ----------
      // payload: { conversationId, isTyping, recipientUid }
      socket.on("typing", ({ conversationId, isTyping, recipientUid } = {}) => {
         if (!recipientUid) return;
         io.to(recipientUid).emit("typing", {
            conversationId,
            userId: uid,
            isTyping,
         });
      });

      // ---------- MARK AS READ ----------
      // payload: { conversationId, messageIds: [] }
      socket.on("markRead", async ({ conversationId, messageIds } = {}) => {
         try {
            if (!conversationId || !Array.isArray(messageIds)) return;
            const messagesCol = await getCollection("messages");
            const convCol = await getCollection("conversations");

            const objectIds = messageIds.map((id) => new ObjectId(id));
            await messagesCol.updateMany(
               { _id: { $in: objectIds } },
               { $set: { status: "read", readAt: new Date() } }
            );

            // notify other participants
            const conv = await convCol.findOne({
               _id: new ObjectId(conversationId),
            });
            if (conv?.participants) {
               conv.participants
                  .filter((p) => p !== uid)
                  .forEach((p) =>
                     io.to(p).emit("message:read", {
                        conversationId,
                        messageIds,
                        readerUid: uid,
                     })
                  );
            }

            // reset unread for this user
            await convCol.updateOne(
               { _id: new ObjectId(conversationId) },
               { $set: { [`unreadCounts.${uid}`]: 0 } }
            );
         } catch (err) {
            console.error("markRead error:", err);
         }
      });

      socket.on("disconnect", (reason) => {
         console.log("Socket disconnected:", uid, reason);
         // optional: update user presence in DB
      });
   });
};

export default registerSocketHandlers;
