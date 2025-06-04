// Test script for QR Flow
// This script tests the complete QR token generation and validation flow

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB4rX3X7RBfjDWLJ62GympGJRauwjFbV6I",
  authDomain: "coffeeshare-b4098.firebaseapp.com",
  projectId: "coffeeshare-b4098",
  storageBucket: "coffeeshare-b4098.firebasestorage.app",
  messagingSenderId: "947075506777",
  appId: "1:947075506777:web:b6ef9fa0ae586fd574c748",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testQRFlow() {
  try {
    console.log("🧪 Starting QR Flow Test...");

    // Sign in anonymously for testing
    console.log("🔐 Signing in anonymously...");
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    console.log(`✅ Signed in as: ${user.uid}`);

    // Import services (these need to be imported after Firebase is initialized)
    const { QRService } = await import("./services/qrService.js");
    const { SubscriptionService } = await import(
      "./services/subscriptionService.js"
    );

    console.log("📋 Services imported successfully");

    // Test 1: Check if user can generate QR token
    console.log("\n🔍 Test 1: Checking if user can generate QR token...");
    const canGenerate = await QRService.canUserGenerateQRToken(user.uid);
    console.log("Can generate QR:", canGenerate);

    // Test 2: Try to get active subscription plans
    console.log("\n📦 Test 2: Getting active subscription plans...");
    const plans = await SubscriptionService.getActiveSubscriptionPlans();
    console.log(`Found ${plans.length} active plans`);

    if (plans.length > 0) {
      console.log("First plan:", plans[0].name, "-", plans[0].credits, "beans");

      // Test 3: Create a user subscription
      console.log("\n🎫 Test 3: Creating user subscription...");
      try {
        const subscriptionId = await SubscriptionService.createUserSubscription(
          user.uid,
          plans[0].id
        );
        console.log(`✅ Subscription created: ${subscriptionId}`);

        // Test 4: Generate QR token
        console.log("\n🔲 Test 4: Generating QR token...");
        const qrToken = await QRService.generateQRToken(user.uid);
        if (qrToken) {
          console.log(`✅ QR Token generated: ${qrToken.id}`);
          console.log(`Token expires at: ${qrToken.expiresAt.toDate()}`);

          // Test 5: Validate QR token
          console.log("\n✅ Test 5: Validating QR token...");
          const validation = await QRService.validateAndRedeemQRToken(
            qrToken.token,
            "test_cafe"
          );
          console.log("Validation result:", validation);
        } else {
          console.log("❌ Failed to generate QR token");
        }
      } catch (subscriptionError) {
        console.log(
          "❌ Error creating subscription:",
          subscriptionError.message
        );
      }
    }

    console.log("\n🎉 QR Flow test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testQRFlow();
