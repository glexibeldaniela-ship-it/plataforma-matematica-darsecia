import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnRegistro").addEventListener("click", registrar);
});

async function registrar() {

  const cedula = document.getElementById("cedula").value.trim();
  const nombres = document.getElementById("nombres").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const fechaNacimiento = document.getElementById("fechaNacimiento")?.value; // campo fecha
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const anio = document.getElementById("anio").value;
  const seccion = document.getElementById("seccion").value;
  const lapso = document.getElementById("lapso").value;

  if (!cedula || !nombres || !apellidos || !fechaNacimiento || !email || !password || !anio || !seccion || !lapso) {
    alert("Complete todos los campos");
    return;
  }

  try {
    // ✅ Verificar que la cédula no esté registrada
    const cedulaRef = doc(db, "cedulas", cedula);
    const cedulaSnap = await getDoc(cedulaRef);
    if (cedulaSnap.exists()) {
      alert("Cédula ya registrada");
      return;
    }

    // 🔑 Crear usuario en Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 📝 Guardar datos en Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
      cedula,
      nombres,
      apellidos,
      fechaNacimiento,
      email,
      anio,
      seccion,
      lapso,
      rol: "estudiante",
      creado_en: new Date(),
      intento: false,
      nota: null,
      estado: "sin_presentar"
    });

    // Registrar cédula para evitar duplicados
    await setDoc(doc(db, "cedulas", cedula), { uid: user.uid });

    alert("Estudiante registrado correctamente");
    window.location.href = "login.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
}