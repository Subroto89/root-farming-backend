import admin from "firebase-admin";
import fs from "fs";
import path from "path";

/* const serviceAccount = JSON.parse(
   fs.readFileSync(new URL("../serviceAccountKey.json", import.meta.url))
); */

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
   try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
   } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", err);
      throw err;
   }
} else {
   const filePath = path.resolve(process.cwd(), "serviceAccountKey.json");
   if (!fs.existsSync(filePath)) {
      throw new Error(
         "No Firebase service account found. Set FIREBASE_SERVICE_ACCOUNT env var or add serviceAccountKey.json locally for development."
      );
   }
   serviceAccount = JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Initialize the Firebase Admin SDK
admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
});

export default admin;
