import { auth, db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let contador = 0;

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnAgregar").addEventListener("click", agregarPregunta);

  document.getElementById("btnGuardar").addEventListener("click", guardarExamen);

});

function agregarPregunta() {

  const contenedor = document.getElementById("contenedorPreguntas");

  const div = document.createElement("div");
  div.innerHTML = `
    <hr>
    <h4>Pregunta ${contador + 1}</h4>

    <select id="tipo_${contador}">
      <option value="opcion_multiple">Opción múltiple</option>
      <option value="numerica">Numérica</option>
      <option value="completar">Completar palabra</option>
    </select><br><br>

    <input type="text" id="enunciado_${contador}" placeholder="Enunciado"><br><br>
  `;

  contenedor.appendChild(div);

  contador++;
}

async function guardarExamen() {

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

  const examenRef = await addDoc(collection(db, "examenes"), {
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

  for (let i = 0; i < contador; i++) {

    const tipo = document.getElementById(`tipo_${i}`).value;
    const enunciado = document.getElementById(`enunciado_${i}`).value;

    await addDoc(collection(db, "examenes", examenRef.id, "preguntas"), {
      tipo,
      enunciado,
      puntos: 1
    });
  }

  alert("Examen creado correctamente");
  window.location.href = "panel-profesor.html";
}

window.volver = function () {
  window.location.href = "panel-profesor.html";
};