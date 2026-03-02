// 🔥 IMPORTAR FIREBASE DESDE CDN

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔐 CONFIGURACIÓN DE TU PROYECTO

const firebaseConfig = {
  apiKey: "AIzaSyBe0p3dhiPwwGobUdvMVUi14JD5S8X9Wvg",
  authDomain: "plataforma-matematica-darsecia.firebaseapp.com",
  projectId: "plataforma-matematica-darsecia",
  storageBucket: "plataforma-matematica-darsecia.firebasestorage.app",
  messagingSenderId: "864021303329",
  appId: "1:864021303329:web:b3c61e6631edb1ff34d360"
};

// 🚀 INICIALIZAR FIREBASE

const app = initializeApp(firebaseConfig);

// 🔑 ACTIVAR SERVICIOS

export const auth = getAuth(app);
export const db = getFirestore(app);