import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Kimlik doğrulama için gerekli

const firebaseConfig = {
  apiKey: "AIzaSyDy59tpalbYM8nD3mYuUKswueSIilHJB2c",
  authDomain: "synapse-91b16.firebaseapp.com",
  projectId: "synapse-91b16",
  storageBucket: "synapse-91b16.firebasestorage.app",
  messagingSenderId: "126499449426",
  appId: "1:126499449426:web:b93c05ea9fdf62f9be0d8b",
  measurementId: "G-XSTD5LJK40"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Diğer dosyalarda kullanabilmek için auth'u dışarı aktar
export const auth = getAuth(app);