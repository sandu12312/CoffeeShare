// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
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

export { app, db };
