const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} = require("firebase/firestore");

// Firebase config (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyAmyBgGbMF7n6ckA8VfqJWCNgbxtgLPTr4",
  authDomain: "coffeeshare-b4098.firebaseapp.com",
  projectId: "coffeeshare-b4098",
  storageBucket: "coffeeshare-b4098.firebasestorage.app",
  messagingSenderId: "947075506777",
  appId: "1:947075506777:web:0d65be2a5ffaa5d8e62b71",
  measurementId: "G-H6GQSN37P3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function promoteUserToAdmin() {
  const userId = "YywOKLC2d9MVBQjrCuUcUbBc7Vx1";

  try {
    // Create admin document
    await setDoc(doc(db, "admins", userId), {
      uid: userId,
      email: "gheorghitasandu998@gmail.com", // Replace with actual email
      displayName: "Gheorghita Alexandru", // Replace with actual name
      photoURL: null,
      phoneNumber: null,
      status: "active",
      permissions: [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_partners",
        "system_admin",
      ],
      accessLevel: "super",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    console.log(`✅ Successfully promoted user ${userId} to super admin!`);
    console.log("📱 You can now use all admin features in the app.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error promoting user to admin:", error);
    process.exit(1);
  }
}

promoteUserToAdmin();
