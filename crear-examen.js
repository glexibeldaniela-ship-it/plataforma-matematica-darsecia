import { auth, db } from "./firebase.js";
import { collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let preguntas = [];

window.agregarPregunta = function () {

  const index = preguntas.length;

  const div = document.createElement("div");
  div.innerHTML = `
    <hr>
    <select id="tipo_${index}">
      <option value="opcion_multiple">Opción múltiple</option>
      <option value="numerica">Numérica</option>
      <option value="completar">Completar palabra</option>
    </select><br><br>

    <input type="text" id="enunciado_${index}" placeholder="Enunciado"><br><br>

    <div id="extra_${index}"></div>
  `;

  document.getElementById("contenedorPreguntas").appendChild(div);

  preguntas.push({});
};

document.getElementById("btnGuardar").addEventListener("click", async () => {

  const user = auth.currentUser;
  if (!user) return alert("No autorizado");

  const titulo = titulo.value;
  const anio = anio.value;
  const seccion = seccion.value;
  const lapso = lapso.value;
  const duracion = parseInt(document.getElementById("duracion").value);
  const repaso = repaso.value;

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

  for (let i = 0; i < preguntas.length; i++) {

    const tipo = document.getElementById(`tipo_${i}`).value;
    const enunciado = document.getElementById(`enunciado_${i}`).value;

    await addDoc(collection(db, "examenes", examenRef.id, "preguntas"), {
      tipo,
      enunciado,
      puntos: 1
    });

  }

  alert("Examen con preguntas creado correctamente");
  window.location.href = "panel-profesor.html";

});

window.volver = function () {
  window.location.href = "panel-profesor.html";
};