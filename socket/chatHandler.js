// server/socket/chatHandler.js
import { getCollection } from "../config/db.js";
import { ObjectId } from "mongodb";

/**
 * registerSocketHandlers(io)
 * - call this once from your index.js AFTER setting up io and after io.use(verifySocketAuth)
 *
 * Responsibilities (Step 1):
 * - per-user personal room join on connect
 * - presence: mark user online on connect, offline+lastSeen on disconnect
 * - status:update event so clients (specialists) can change their status
 * - joinConversation / leaveConversation with participant validation
 * - message: store message in `messages`, update conversation metadata, emit to conv room & recipient, ack sender
 * - typing: notify recipient and conversation room
 * - markRead: update DB and notify other participants
 *
 * Assumptions:
 * - verifySocketAuth middleware sets socket.user = decodedToken (with uid)
 * - `users` collection documents have `firebaseUid` field (string)
 * - `conversations` stores participants as array of UIDs (strings)
 * - `messages` documents store conversationId as ObjectId
 */
const registerSocketHandlers = (io) => {
   io.on("connection", (socket) => {
      // Normalize uid as string or null
      const uid =
         String(
            socket.user?.uid ||
               socket.data?.user?.uid ||
               socket.handshake?.query?.userId ||
               ""
         ) || null;

      console.log("Socket connected:", uid, socket.id);

      // If authenticated, join a personal room for the user
      if (uid) {
         try {
            socket.join(uid);
            console.debug(`Socket ${socket.id} joined personal room ${uid}`);
         } catch (err) {
            console.warn("Failed to join personal room:", err);
         }
      }

      // --- PRESENCE: mark user online immediately on connection ---
      (async () => {
         try {
            if (!uid) return;
            const usersCol = await getCollection("users");
            await usersCol.updateOne(
               { firebaseUid: uid },
               {
                  $set: {
                     status: "online",
                     lastSeen: null,
                     lastLoggedIn: new Date().toISOString(),
                  },
               },
               { upsert: false }
            );

            // broadcast presence (you can restrict scope later)
            io.emit("presence", { uid, status: "online", lastSeen: null });
         } catch (err) {
            console.warn("Failed to mark user online:", err);
         }
      })();

      // --- allow manual status updates (specialist toggles: away/live/busy/online) ---
      socket.on("status:update", async ({ status } = {}) => {
         try {
            if (!uid) return;
            const usersCol = await getCollection("users");
            await usersCol.updateOne(
               { firebaseUid: uid },
               { $set: { status: status || "online" } },
               { upsert: false }
            );
            io.emit("presence", {
               uid,
               status: status || "online",
               lastSeen: null,
            });
         } catch (err) {
            console.warn("status:update failed:", err);
            socket.emit("status:error", {
               error: err?.message || "status update failed",
            });
         }
      });

      // --- join conversation room (validate participant) ---
      socket.on("joinConversation", async ({ conversationId } = {}) => {
         try {
            if (!conversationId) return;
            const conversationsCol = await getCollection("conversations");

            // validate conversation exists
            const conv = await conversationsCol.findOne({
               _id: new ObjectId(conversationId),
            });
            if (!conv) {
               socket.emit("join:error", {
                  conversationId,
                  error: "Conversation not found",
               });
               return;
            }

            // normalize participants to strings
            const participants = Array.isArray(conv.participants)
               ? conv.participants.map((p) => String(p))
               : [];

            const isParticipant = uid && participants.includes(String(uid));
            if (!isParticipant) {
               socket.emit("join:error", {
                  conversationId,
                  error: "Not a participant",
               });
               return;
            }

            socket.join(conversationId);
            socket.emit("join:ok", { conversationId });
            console.debug(
               `Socket ${socket.id} (${uid}) joined conv ${conversationId}`
            );
         } catch (err) {
            console.warn("joinConversation error:", err);
            socket.emit("join:error", {
               conversationId: conversationId || null,
               error: err?.message || "Join failed",
            });
         }
      });

      socket.on("leaveConversation", ({ conversationId } = {}) => {
         try {
            if (!conversationId) return;
            socket.leave(conversationId);
            socket.emit("leave:ok", { conversationId });
            console.debug(
               `Socket ${socket.id} (${uid}) left conv ${conversationId}`
            );
         } catch (err) {
            console.warn("leaveConversation error:", err);
         }
      });

      // ---------- MESSAGE EVENT ----------
      // payload: { tempId?, conversationId?, recipientUid, text, senderRole?, attachments? }
      socket.on("message", async (payload) => {
         try {
            const senderUid = String(uid || payload?.senderUid || "");
            const recipientUid = payload?.recipientUid
               ? String(payload.recipientUid)
               : null;
            const text =
               typeof payload?.text === "string" ? payload.text.trim() : "";

            if (!senderUid || !recipientUid) {
               socket.emit("message:error", {
                  tempId: payload?.tempId,
                  error: "Missing sender or recipient",
               });
               return;
            }

            if (
               !text &&
               (!payload?.attachments || payload.attachments.length === 0)
            ) {
               socket.emit("message:error", {
                  tempId: payload?.tempId,
                  error: "Empty message",
               });
               return;
            }

            // simple length guard
            const MAX_LENGTH = 5000;
            if (text.length > MAX_LENGTH) {
               socket.emit("message:error", {
                  tempId: payload?.tempId,
                  error: `Message too long (max ${MAX_LENGTH} chars)`,
               });
               return;
            }

            const conversationsCol = await getCollection("conversations");
            const messagesCol = await getCollection("messages");

            // find or create conversation (sorted participants array)
            let convId = payload?.conversationId;
            if (!convId) {
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

               if (!conv?.value || !conv?.value._id) {
                  throw new Error("Failed to create or fetch conversation");
               }

               convId = conv.value._id.toString();
            }

            // message doc
            const msgDoc = {
               conversationId: new ObjectId(convId),
               senderUid,
               senderRole: payload?.senderRole || "farmer",
               text,
               attachments: Array.isArray(payload?.attachments)
                  ? payload.attachments
                  : [],
               status: "sent",
               createdAt: new Date(),
            };

            const insertRes = await messagesCol.insertOne(msgDoc);
            msgDoc._id = insertRes.insertedId;

            // update conversation metadata
            await conversationsCol.updateOne(
               { _id: new ObjectId(convId) },
               {
                  $set: {
                     lastMessage:
                        text || (msgDoc.attachments[0] ? "Attachment" : ""),
                     lastUpdated: new Date(),
                  },
                  $inc: { [`unreadCounts.${recipientUid}`]: 1 },
               }
            );

            const emitPayload = { ...msgDoc, conversationId: convId };

            // Emit to conversation room (everyone joined that convo)
            try {
               io.to(convId).emit("message", emitPayload);
            } catch (e) {
               console.warn("Emit to conversation room failed:", e);
            }

            // Also emit to recipient personal room (all their devices)
            try {
               io.to(recipientUid).emit("message", emitPayload);
            } catch (e) {
               console.warn("Emit to recipient personal room failed:", e);
            }

            // Ack the sender so they can replace tempId with saved message
            socket.emit("message:ack", {
               tempId: payload?.tempId,
               savedMessage: emitPayload,
            });

            console.debug("message saved and emitted", {
               convId,
               senderUid,
               recipientUid,
               tempId: payload?.tempId,
            });
         } catch (err) {
            console.error("socket message handler error:", err);
            socket.emit("message:error", {
               tempId: payload?.tempId,
               error: err?.message || "Message handling failed",
            });
         }
      });

      // ---------- TYPING ----------
      socket.on("typing", ({ conversationId, isTyping, recipientUid } = {}) => {
         try {
            if (!recipientUid && !conversationId) return;
            const payload = { conversationId, userId: uid, isTyping };

            if (recipientUid) {
               io.to(recipientUid).emit("typing", payload);
            }
            if (conversationId) {
               io.to(conversationId).emit("typing", payload);
            }
         } catch (err) {
            console.warn("typing handler error:", err);
         }
      });

      // ---------- MARK AS READ ----------
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

            const conv = await convCol.findOne({
               _id: new ObjectId(conversationId),
            });
            if (conv?.participants) {
               conv.participants
                  .filter((p) => String(p) !== String(uid))
                  .forEach((p) =>
                     io.to(String(p)).emit("message:read", {
                        conversationId,
                        messageIds,
                        readerUid: uid,
                     })
                  );
            }

            // reset unread for this user in conversation
            await convCol.updateOne(
               { _id: new ObjectId(conversationId) },
               { $set: { [`unreadCounts.${uid}`]: 0 } }
            );
         } catch (err) {
            console.error("markRead error:", err);
         }
      });

      // ---------- DISCONNECT: presence cleanup ----------
      socket.on("disconnect", async (reason) => {
         try {
            console.log("Socket disconnected:", uid, reason);

            if (!uid) return;

            const usersCol = await getCollection("users");
            const lastSeen = new Date().toISOString();

            await usersCol.updateOne(
               { firebaseUid: uid },
               { $set: { status: "offline", lastSeen } },
               { upsert: false }
            );

            io.emit("presence", { uid, status: "offline", lastSeen });
         } catch (err) {
            console.warn("Error handling disconnect presence:", err);
         }
      });
   });
};

export default registerSocketHandlers;
