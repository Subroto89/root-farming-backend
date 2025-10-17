import admin from "../config/firebaseAdmin.js";

export const verifySocketAuth = async (socket, next) => {
   try {
      const token = socket.handshake.auth.token;
      if (!token) {
         return next(new Error("No token provided"));
      }

      const decoded = await admin.auth().verifyIdToken(token);
      socket.user = decoded;
      next();
   } catch (error) {
      console.error("Socket.IO auth failed:", error);
      next(new Error("Unauthorized"));
   }
};
