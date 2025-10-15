import admin from "../config/firebaseAdmin.js";

export const verifyFirebaseToken = async (req, res, next) => {
   try {
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
         return res.status(401).json({ message: "No token provided" });
      }

      const idToken = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);

      req.user = decoded;
      next();
   } catch (error) {
      console.error("HTTP token verification failed:", error);
      res.status(403).json({ message: "Invalid or expired token" });
   }
};

// Usage in Express routes
// app.use('/some-protected-route', verifyFirebaseToken, someProtectedRouteHandler);
