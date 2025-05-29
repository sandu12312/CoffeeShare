// Test script to verify subscription queries
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} = require("firebase/firestore");

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBwP8u0Frt8_IaMyDT5xQ8F95A33cI7YLE",
  authDomain: "coffeeshare-b4098.firebaseapp.com",
  projectId: "coffeeshare-b4098",
  storageBucket: "coffeeshare-b4098.appspot.com",
  messagingSenderId: "303516133590",
  appId: "1:303516133590:web:30cf5b073db9b0e36b54ff",
  measurementId: "G-Q5RTZBRBV9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testQueries() {
  try {
    console.log("Testing subscription queries...\n");

    // Test 1: Simple query for all subscriptionPlans
    console.log("1. Fetching all subscription plans...");
    const allPlansQuery = query(collection(db, "subscriptionPlans"));
    const allPlansSnapshot = await getDocs(allPlansQuery);
    console.log(`   Found ${allPlansSnapshot.size} total plans\n`);

    // Test 2: Query with where clause only
    console.log("2. Fetching active subscription plans...");
    const activePlansQuery = query(
      collection(db, "subscriptionPlans"),
      where("isActive", "==", true)
    );
    const activePlansSnapshot = await getDocs(activePlansQuery);
    console.log(`   Found ${activePlansSnapshot.size} active plans\n`);

    // Show the plans
    console.log("Active plans:");
    activePlansSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(
        `   - ${data.name}: ${data.credits} beans for ${data.price} RON`
      );
    });

    console.log("\nAll queries completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.code === "failed-precondition") {
      console.error("\nThis error means an index is still required.");
      console.error(
        "Please check the Firebase Console to ensure the index is fully built."
      );
    }
    process.exit(1);
  }
}

testQueries();
