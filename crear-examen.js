import { auth, db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.getElementById("btnGuardar").addEventListener("click", async () => {

  const user = auth.currentUser;

  if (!user) {
    alert("No autorizado");
    return;
  }

  const titulo = document.getElementById("titulo").value;
  const anio = document.getElementById("anio").value;
  const seccion = document.getElementById("seccion").value;
  const lapso = document.getElementById("lapso").value;
  const duracion = parseInt(document.getElementById("duracion").value);
  const repaso = document.getElementById("repaso").value;

  if (!titulo || !anio || !seccion || !lapso || !duracion) {
    alert("Complete todos los campos");
    return;
  }

  await addDoc(collection(db, "examenes"), {
    titulo,
    anio,
    seccion,
    lapso,
    duracion,
    repaso_link: repaso,
    escala: 20,
    activo: false,
    creado_por: user.uid,
    creado_en: new Date()
  });

  alert("Examen creado correctamente");
  window.location.href = "panel-profesor.html";

});

window.volver = function () {
  window.location.href = "panel-profesor.html";
};