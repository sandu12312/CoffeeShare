// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
