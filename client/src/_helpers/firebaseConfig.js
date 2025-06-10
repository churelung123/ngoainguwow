// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDaixrMM8ajzhsUckrvz4oCjFItEwd7MCU",
  authDomain: "studentmanagement-670fe.firebaseapp.com",
  projectId: "studentmanagement-670fe",
  storageBucket: "studentmanagement-670fe.firebasestorage.app",
  messagingSenderId: "659270467375",
  appId: "1:659270467375:web:9c0b09c85d8d175b35ebda",
  measurementId: "G-HRWPRH9497"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };