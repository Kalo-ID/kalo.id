// Import fungsi yang kita perlukan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// TAMBAHKAN 'setPersistence' dan 'browserLocalPersistence' di baris di bawah
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ▼▼▼ PASTIKAN INI ADALAH KONFIGURASI FIREBASE ASLI ANDA ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyD0UenQNNxv9YphNHU8QC2JKoD7nD4igv0", // (Kunci asli Anda - GANTI INI!)
  authDomain: "gizi-poin.firebaseapp.com",
  projectId: "gizi-poin",
  storageBucket: "gizi-poin.firebasestorage.app",
  messagingSenderId: "255141140757",
  appId: "1:255141140757:web:492c686a0c746d86af11c",
  measurementId: "G-J5NVDRC87B"
};
// ▲▲▲ PASTIKAN INI ADALAH KONFIGURASI FIREBASE ASLI ANDA ▲▲▲


// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor "alat" yang kita butuhkan agar bisa dipakai file lain
export const auth = getAuth(app);
export const db = getFirestore(app);
export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  doc, 
  setDoc,
  getDoc,
  sendPasswordResetEmail,
  setPersistence, // <-- Tambahkan ini
  browserLocalPersistence // <-- Tambahkan ini
};