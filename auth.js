// 🔥 IMPORTACIONES NECESARIAS
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// 🔹 REGISTRO COMPLETO CON VALIDACIÓN DE CÉDULA
async function registrar() {

  const cedula = document.getElementById("cedula").value.trim();
  const nombres = document.getElementById("nombres").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const anio = document.getElementById("anio").value;
  const seccion = document.getElementById("seccion").value;
  const lapso = document.getElementById("lapso").value;

  if (!cedula || !nombres || !apellidos || !email || !password || !anio || !seccion || !lapso) {
    alert("Complete todos los campos");
    return;
  }

  try {

    // 🔎 Verificar si la cédula ya existe
    const cedulaRef = doc(db, "cedulas", cedula);
    const cedulaSnap = await getDoc(cedulaRef);

    if (cedulaSnap.exists()) {
      alert("Esta cédula ya está registrada");
      return;
    }

    // 🔐 Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 💾 Guardar datos del estudiante
    await setDoc(doc(db, "usuarios", user.uid), {
      cedula,
      nombres,
      apellidos,
      email,
      rol: "estudiante",
      anio,
      seccion,
      lapso_actual: lapso,
      intento: false,
      nota: null,
      estado: "sin_presentar",
      creado_en: new Date()
    });

    // 💾 Guardar cédula para bloquear repetidos
    await setDoc(doc(db, "cedulas", cedula), {
      uid: user.uid
    });

    alert("Estudiante registrado correctamente");
    window.location.href = "login.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
}


// 🔥 ACTIVAR BOTÓN CUANDO CARGUE EL DOM
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnRegistro");
  if (btn) {
    btn.addEventListener("click", registrar);
  }
});