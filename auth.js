// 🔥 IMPORTACIONES  
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


// ============================  
// 🔹 REGISTRO  
// ============================  

async function registrar() {  

  const cedula = document.getElementById("cedula")?.value.trim();  
  const nombres = document.getElementById("nombres")?.value.trim();  
  const apellidos = document.getElementById("apellidos")?.value.trim();  
  const email = document.getElementById("email")?.value.trim();  
  const password = document.getElementById("password")?.value.trim();  
  const anio = document.getElementById("anio")?.value;  
  const seccion = document.getElementById("seccion")?.value;  
  const lapso = document.getElementById("lapso")?.value;  

  if (!cedula || !nombres || !apellidos || !email || !password || !anio || !seccion || !lapso) {  
    alert("Complete todos los campos");  
    return;  
  }  

  try {  

    const cedulaRef = doc(db, "cedulas", cedula);  
    const cedulaSnap = await getDoc(cedulaRef);  

    if (cedulaSnap.exists()) {  
      alert("Esta cédula ya está registrada");  
      return;  
    }  

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);  
    const user = userCredential.user;  

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

    await setDoc(doc(db, "cedulas", cedula), {  
      uid: user.uid  
    });  

    alert("Estudiante registrado correctamente");  
    window.location.href = "login.html";  

  } catch (error) {  
    alert("Error al registrar: " + error.message);  
  }  
}  


// ============================  
// 🔹 LOGIN  
// ============================  

async function login() {  

  const email = document.getElementById("email")?.value.trim();  
  const password = document.getElementById("password")?.value.trim();  

  if (!email || !password) {  
    alert("Ingrese correo y contraseña");  
    return;  
  }  

  try {  

    const userCredential = await signInWithEmailAndPassword(auth, email, password);  
    const user = userCredential.user;  

    const docRef = doc(db, "usuarios", user.uid);  
    const docSnap = await getDoc(docRef);  

    if (!docSnap.exists()) {  
      alert("Usuario no autorizado");  
      return;  
    }

    const datos = docSnap.data();
    const rol = datos.rol;

    await setDoc(doc(db, "logs", crypto.randomUUID()), {
      uid: user.uid,
      email: user.email,
      rol: rol,
      accion: "login",
      fecha: new Date()
    });

    if (rol === "admin") {  
      window.location.href = "panel-admin.html";  
    } else if (rol === "profesor") {  
      window.location.href = "panel-profesor.html";  
    } else if (rol === "estudiante") {  
      window.location.href = "panel-estudiante.html";  
    } else {
      alert("Rol no válido");
    }

  } catch (error) {  

    alert(error.code + " - " + error.message);

  }  
}  


// ============================  
// 🔹 BOTÓN LOGIN  
// ============================  

document.addEventListener("DOMContentLoaded", () => {  

  const btnLogin = document.getElementById("btnLogin");  

  if (btnLogin) {  
    btnLogin.addEventListener("click", login);  
  }

});