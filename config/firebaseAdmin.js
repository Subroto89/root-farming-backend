import admin from "firebase-admin";

import fs from "fs";

//import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };

const serviceAccount = JSON.parse(
   fs.readFileSync(new URL("../serviceAccountKey.json", import.meta.url))
);

// Initialize the Firebase Admin SDK
admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
});

export default admin;
