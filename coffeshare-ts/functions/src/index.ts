import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Import function modules
export * from "./qrCodeFunctions";
export * from "./partnerAnalytics";

// Simple example of a direct function export
export const helloWorld = functions.https.onCall(async (data, context) => {
  return {
    message: "Hello from Firebase Functions!",
  };
});
