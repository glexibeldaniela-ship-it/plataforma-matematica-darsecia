import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// 🔹 REGISTRO
window.registrar = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Complete todos los campos");
    return;
  }

  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Guardar rol en Firestore (por defecto estudiante)
    await setDoc(doc(db, "usuarios", user.uid), {
      email: email,
      rol: "estudiante",
      intento: false
    });

    alert("Usuario creado correctamente");
    window.location.href = "login.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
};


// 🔹 LOGIN
window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {

      const data = docSnap.data();

      if (data.rol === "admin") {
        window.location.href = "panel-admin.html";
      }
      else if (data.rol === "profesor") {
        window.location.href = "panel-profesor.html";
      }
      else {
        window.location.href = "panel-estudiante.html";
      }

    } else {
      alert("No tiene rol asignado");
    }

  } catch (error) {
    alert("Error: " + error.message);
  }
};