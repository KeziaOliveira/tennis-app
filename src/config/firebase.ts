// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_PKxPlEmgZbpaLVOAjVypSoWPkMJJISg",
  authDomain: "bttv-1442a.firebaseapp.com",
  projectId: "bttv-1442a",
  storageBucket: "bttv-1442a.firebasestorage.app",
  messagingSenderId: "532432127866",
  appId: "1:532432127866:web:8595d604f19adc496938c3",
  measurementId: "G-Z4JS6JPE5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, auth, analytics };