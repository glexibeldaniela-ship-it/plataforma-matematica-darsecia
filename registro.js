import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnRegistro")
    .addEventListener("click", registrar);
});

async function registrar() {

  const cedula = document.getElementById("cedula").value;
  const nombres = document.getElementById("nombres").value;
  const apellidos = document.getElementById("apellidos").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const anio = document.getElementById("anio").value;
  const seccion = document.getElementById("seccion").value;
  const lapso = document.getElementById("lapso").value;

  if (!cedula || !nombres || !apellidos || !email || !password || !anio || !seccion || !lapso) {
    alert("Complete todos los campos");
    return;
  }

  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      cedula,
      nombres,
      apellidos,
      email,
      anio,
      seccion,
      lapso,
      rol: "estudiante",
      creado_en: new Date()
    });

    alert("Estudiante registrado correctamente");

    window.location.href = "login.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
}