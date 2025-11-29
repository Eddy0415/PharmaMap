// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVPeTr-cBy1YESejr7uUzhAgM4LTG_UW0",
  authDomain: "pharmamap-cdea2.firebaseapp.com",
  projectId: "pharmamap-cdea2",
  storageBucket: "pharmamap-cdea2.firebasestorage.app",
  messagingSenderId: "507463249706",
  appId: "1:507463249706:web:9de134970d0ce49f803853",
  measurementId: "G-VFH19QQSV8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, auth };
