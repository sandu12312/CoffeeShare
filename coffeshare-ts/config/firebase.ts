// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBsWM2zsYQMk6CC8HtH4vLRJc6AHJL_qns",
  authDomain: "coffeeshare-6e74d.firebaseapp.com",
  projectId: "coffeeshare-6e74d",
  storageBucket: "coffeeshare-6e74d.firebasestorage.app",
  messagingSenderId: "142812803794",
  appId: "1:142812803794:web:4e4db6e03c7cf13448730b",
  measurementId: "G-TVDYXD475T",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
