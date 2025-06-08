// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Auth with AsyncStorage persistence
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: AsyncStorage as any,
  });
} catch (error: any) {
  // If already initialized, just get the existing instance
  if (error.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    // Fallback to basic auth for Expo Go compatibility
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
