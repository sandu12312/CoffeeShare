// Script to add a subscription to a user
// Run with: node scripts/addSubscription.js

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

// Get the service account key path
const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

// Check if service account file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error("Service account key not found at", serviceAccountPath);
  console.error(
    "Please place your Firebase service account key at this location"
  );
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Email of the user to update
const EMAIL_TO_UPDATE = "maximcapinus@gmail.com";

async function addSubscription() {
  try {
    // Find the user by email
    const usersSnapshot = await db
      .collection("users")
      .where("email", "==", EMAIL_TO_UPDATE)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`No user found with email: ${EMAIL_TO_UPDATE}`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    console.log(
      `Found user: ${userData.displayName || EMAIL_TO_UPDATE} (${userId})`
    );

    // Current timestamp
    const now = new Date();

    // Expiry date (1 month from now)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    // Prepare subscription data
    const subscriptionData = {
      type: "Student Pack",
      isActive: true,
      startDate: now,
      expiryDate: expiryDate,
      dailyLimit: 2,
      remainingToday: 2, // Set initial daily coffees
      lastReset: now,
      price: 19.99,
      currency: "USD",
      paymentInfo: {
        paymentMethod: "Manual Update",
        autoRenew: false,
      },
    };

    // Update the user document
    await db.collection("users").doc(userId).update({
      subscription: subscriptionData,
      updatedAt: now,
    });

    console.log(
      `Successfully added subscription to user: ${
        userData.displayName || EMAIL_TO_UPDATE
      }`
    );
    console.log("Subscription details:");
    console.log(`- Type: ${subscriptionData.type}`);
    console.log(`- Daily Limit: ${subscriptionData.dailyLimit} coffees`);
    console.log(
      `- Remaining Today: ${subscriptionData.remainingToday} coffees`
    );
    console.log(`- Expiry Date: ${expiryDate.toLocaleDateString()}`);
  } catch (error) {
    console.error("Error adding subscription:", error);
    process.exit(1);
  }
}

// Run the function
addSubscription()
  .then(() => {
    console.log("Script completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
