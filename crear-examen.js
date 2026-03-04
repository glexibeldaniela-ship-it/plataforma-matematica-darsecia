import { auth, db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let contador = 0;

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("btnAgregar")
    .addEventListener("click", agregarPregunta);

  document.getElementById("btnGuardar")
    .addEventListener("click", guardarExamen);

});

function agregarPregunta() {

  const contenedor = document.getElementById("contenedorPreguntas");

  const div = document.createElement("div");
  div.classList.add("pregunta");
  div.dataset.index = contador;
  div.style.border = "1px solid gray";
  div.style.padding = "10px";
  div.style.marginBottom = "15px";

  const idLocal = contador;

  div.innerHTML = `
    <h4>Pregunta ${contador + 1}</h4>

    <select class="tipoPregunta">
      <option value="">Seleccione tipo</option>
      <option value="opcion_multiple">Opción múltiple</option>
      <option value="numerica">Respuesta numérica</option>
      <option value="completar">Completar expresión</option>
      <option value="verdadero_falso">Verdadero / Falso</option>
      <option value="desarrollo">Desarrollo</option>
    </select><br><br>

    <input type="text" class="enunciado" placeholder="Enunciado"><br><br>

    <div class="contenidoDinamico"></div>
  `;

  contenedor.appendChild(div);

  const select = div.querySelector(".tipoPregunta");
  const contenido = div.querySelector(".contenidoDinamico");

  select.addEventListener("change", () => {

    contenido.innerHTML = "";

    if (select.value === "opcion_multiple") {

      const btnAgregar = document.createElement("button");
      btnAgregar.textContent = "Agregar opción";
      btnAgregar.type = "button";

      const lista = document.createElement("div");

      btnAgregar.onclick = () => {

        const opcionDiv = document.createElement("div");

        opcionDiv.innerHTML = `
          <input type="radio" name="correcta_${idLocal}" class="correcta">
          <input type="text" class="opcionTexto" placeholder="Texto de la opción">
          <button type="button" class="eliminar">❌</button>
        `;

        opcionDiv.querySelector(".eliminar").onclick = () => opcionDiv.remove();

        lista.appendChild(opcionDiv);
      };

      contenido.appendChild(btnAgregar);
      contenido.appendChild(document.createElement("br"));
      contenido.appendChild(lista);
    }

    if (select.value === "numerica") {
      contenido.innerHTML = `
        <input type="number" class="respuestaNumerica" placeholder="Respuesta correcta"><br><br>
        <input type="number" class="margenError" placeholder="Margen de error (opcional)">
      `;
    }

    if (select.value === "completar") {
      contenido.innerHTML = `
        <input type="text" class="respuestaCompletar" placeholder="Respuesta correcta">
      `;
    }

    if (select.value === "verdadero_falso") {
      contenido.innerHTML = `
        <select class="respuestaVF">
          <option value="verdadero">Verdadero</option>
          <option value="falso">Falso</option>
        </select>
      `;
    }

    if (select.value === "desarrollo") {
      contenido.innerHTML = `
        <p>El estudiante responderá manualmente.</p>
      `;
    }

  });

  contador++;
}

async function guardarExamen() {

  const user = auth.currentUser;
  if (!user) {
    alert("No autorizado");
    return;
  }

  const titulo = document.getElementById("titulo").value.trim();
  const anio = document.getElementById("anio").value.trim();
  const seccion = document.getElementById("seccion").value.trim();
  const lapso = document.getElementById("lapso").value.trim();
  const duracion = parseInt(document.getElementById("duracion").value);
  const repaso = document.getElementById("repaso").value.trim();
  const tiempoRepaso = 2; // 🔥 fijo 2 minutos obligatorio

  if (!titulo || !anio || !seccion || !lapso || !duracion || !repaso) {
    alert("Complete todos los campos incluyendo el link de repaso");
    return;
  }

  const examenRef = await addDoc(collection(db, "examenes"), {
    titulo,
    anio,
    seccion,
    lapso,
    duracion,
    repaso_link: repaso,
    tiempo_repaso_minutos: tiempoRepaso,
    escala: 20,
    activo: false,
    creado_por: user.uid,
    creado_en: new Date()
  });

  const preguntas = document.querySelectorAll(".pregunta");

  for (const preguntaDiv of preguntas) {

    const tipo = preguntaDiv.querySelector(".tipoPregunta").value;
    const enunciado = preguntaDiv.querySelector(".enunciado").value;

    let datosPregunta = {
      tipo,
      enunciado,
      puntos: 1
    };

    if (tipo === "opcion_multiple") {

      const opciones = [];
      const opcionesDiv = preguntaDiv.querySelectorAll(".opcionTexto");
      const radios = preguntaDiv.querySelectorAll(".correcta");

      opcionesDiv.forEach((input, index) => {
        opciones.push({
          texto: input.value,
          correcta: radios[index].checked
        });
      });

      datosPregunta.opciones = opciones;
    }

    if (tipo === "numerica") {
      datosPregunta.respuestaCorrecta =
        parseFloat(preguntaDiv.querySelector(".respuestaNumerica")?.value || 0);

      datosPregunta.margenError =
        parseFloat(preguntaDiv.querySelector(".margenError")?.value || 0);
    }

    if (tipo === "completar") {
      datosPregunta.respuestaCorrecta =
        preguntaDiv.querySelector(".respuestaCompletar")?.value || "";
    }

    if (tipo === "verdadero_falso") {
      datosPregunta.respuestaCorrecta =
        preguntaDiv.querySelector(".respuestaVF")?.value;
    }

    await addDoc(
      collection(db, "examenes", examenRef.id, "preguntas"),
      datosPregunta
    );
  }

  alert("Examen creado correctamente");
  window.location.href = "panel-profesor.html";
}

window.volver = function () {
  window.location.href = "panel-profesor.html";
};