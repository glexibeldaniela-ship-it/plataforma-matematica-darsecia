import { auth, db } from "./firebase.js";
import {
  collection, addDoc, getDoc, doc, getDocs, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let contador = 0;
let examenIdEditando = null;
let usuarioActual = null;

// 🔐 Monitorear el estado de la autenticación
onAuthStateChanged(auth, (user) => {
  usuarioActual = user;
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnAgregar")
    .addEventListener("click", agregarPregunta);

  document.getElementById("btnGuardar")
    .addEventListener("click", guardarExamen);

  // ---- MODO EDICIÓN: detectar ?id en la URL ----
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (id) {
    examenIdEditando = id;
    cargarExamenParaEditar(id);
  }
});

async function cargarExamenParaEditar(id) {
  try {
    const h2 = document.querySelector(".header h2");
    if (h2) h2.textContent = "Editar Examen";
    document.getElementById("btnGuardar").textContent = "Actualizar Examen";

    const examenSnap = await getDoc(doc(db, "examenes", id));
    if (!examenSnap.exists()) {
      alert("No se encontró el examen.");
      window.location.href = "panel-profesor.html";
      return;
    }
    const data = examenSnap.data();
    document.getElementById("titulo").value   = data.titulo      || "";
    document.getElementById("anio").value     = data.anio        || "";
    
    // Ajuste para el nuevo select de sección
    document.getElementById("seccion").value  = data.seccion     || "A"; 
    
    document.getElementById("lapso").value    = data.lapso       || "";
    document.getElementById("duracion").value = data.duracion    || "";
    document.getElementById("repaso").value   = data.repaso_link || "";

    const preguntasSnap = await getDocs(collection(db, "examenes", id, "preguntas"));
    preguntasSnap.forEach(pDoc => {
      agregarPreguntaConDatos(pDoc.data());
    });
  } catch (e) {
    console.error("Error cargando examen para editar:", e);
    alert("Error al cargar el examen.");
  }
}

function agregarPregunta() {
  agregarPreguntaConDatos({}); 
}

function agregarPreguntaConDatos(p) {
  const contenedor = document.getElementById("contenedorPreguntas");
  const div = document.createElement("div");
  div.classList.add("pregunta");
  div.dataset.index = contador;
  div.style.border = "1px solid #00bcd4";
  div.style.borderRadius = "10px";
  div.style.padding = "15px";
  div.style.marginBottom = "15px";
  div.style.background = "#fff";

  const idLocal = contador;

  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h4 style="margin:0;">Pregunta ${contador + 1}</h4>
      <button type="button" onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:red; cursor:pointer;">Eliminar ❌</button>
    </div>
    <br>
    <select class="tipoPregunta" style="width:100%; padding:8px; border-radius:8px;">
      <option value="">Seleccione tipo</option>
      <option value="opcion_multiple">Opción múltiple</option>
      <option value="numerica">Respuesta numérica</option>
      <option value="completar">Completar expresión</option>
      <option value="verdadero_falso">Verdadero / Falso</option>
      <option value="desarrollo">Desarrollo</option>
    </select><br><br>
    <input type="text" class="enunciado" placeholder="Enunciado de la pregunta" style="width:95%; padding:8px; border-radius:8px; border:1px solid #ccc;"><br><br>
    <div class="contenidoDinamico"></div>
  `;
  contenedor.appendChild(div);

  const select = div.querySelector(".tipoPregunta");
  const contenido = div.querySelector(".contenidoDinamico");
  const enunciadoInput = div.querySelector(".enunciado");

  select.value = p.tipo || "";
  enunciadoInput.value = p.enunciado || "";

  select.addEventListener("change", () => renderContenidoDinamico(select, contenido, idLocal, null));
  if (p.tipo) renderContenidoDinamico(select, contenido, idLocal, p);

  contador++;
}

function renderContenidoDinamico(select, contenido, idLocal, datos) {
  contenido.innerHTML = "";

  if (select.value === "opcion_multiple") {
    const btnAgregar = document.createElement("button");
    btnAgregar.textContent = "➕ Agregar opción";
    btnAgregar.type = "button";
    btnAgregar.style.padding = "5px 10px";
    btnAgregar.style.borderRadius = "5px";

    const lista = document.createElement("div");
    lista.style.marginTop = "10px";

    btnAgregar.onclick = () => {
      crearFilaOpcion(lista, idLocal, "", false);
    };

    contenido.appendChild(btnAgregar);
    contenido.appendChild(document.createElement("br"));
    contenido.appendChild(lista);

    if (datos && datos.opciones) {
      datos.opciones.forEach(op => {
        crearFilaOpcion(lista, idLocal, op.texto, op.correcta);
      });
    }
  }

  if (select.value === "numerica") {
    contenido.innerHTML = `
      <input type="number" class="respuestaNumerica" value="${datos?.respuestaCorrecta ?? ""}" placeholder="Respuesta correcta" style="padding:8px; border-radius:8px; border:1px solid #ccc;"><br><br>
      <input type="number" class="margenError" value="${datos?.margenError ?? ""}" placeholder="Margen de error (opcional)" style="padding:8px; border-radius:8px; border:1px solid #ccc;">
    `;
  }

  if (select.value === "completar") {
    contenido.innerHTML = `
      <input type="text" class="respuestaCompletar" value="${datos?.respuestaCorrecta ?? ""}" placeholder="Respuesta correcta" style="width:95%; padding:8px; border-radius:8px; border:1px solid #ccc;">
    `;
  }

  if (select.value === "verdadero_falso") {
    contenido.innerHTML = `
      <select class="respuestaVF" style="padding:8px; border-radius:8px;">
        <option value="verdadero" ${datos?.respuestaCorrecta === "verdadero" ? "selected" : ""}>Verdadero</option>
        <option value="falso"     ${datos?.respuestaCorrecta === "falso"     ? "selected" : ""}>Falso</option>
      </select>
    `;
  }

  if (select.value === "desarrollo") {
    contenido.innerHTML = `<p style="color:gray; font-style:italic;">El estudiante responderá libremente en un cuadro de texto.</p>`;
  }
}

function crearFilaOpcion(lista, idLocal, texto, esCorrecta) {
  const opcionDiv = document.createElement("div");
  opcionDiv.style.marginBottom = "5px";
  opcionDiv.innerHTML = `
    <input type="radio" name="correcta_${idLocal}" class="correcta" ${esCorrecta ? "checked" : ""}>
    <input type="text" class="opcionTexto" value="${texto}" placeholder="Opción" style="padding:5px; border-radius:5px; border:1px solid #ccc;">
    <button type="button" class="eliminar" style="border:none; background:none; cursor:pointer;">❌</button>
  `;
  opcionDiv.querySelector(".eliminar").onclick = () => opcionDiv.remove();
  lista.appendChild(opcionDiv);
}

// 🚀 FUNCIÓN DE GUARDADO CORREGIDA
async function guardarExamen() {
  const user = usuarioActual || auth.currentUser;
  if (!user) { 
    alert("❌ Error: No se detectó sesión de usuario. Intenta recargar la página."); 
    return; 
  }

  try {
    const titulo   = document.getElementById("titulo").value.trim();
    const anio     = document.getElementById("anio").value.trim();
    
    // Captura el valor del nuevo SELECT (A, B o Ambas)
    const seccion  = document.getElementById("seccion").value;
    
    const lapso    = document.getElementById("lapso").value.trim();
    const duracion = parseInt(document.getElementById("duracion").value);
    const repaso   = document.getElementById("repaso").value.trim();

    if (!titulo)   { alert("Falta el título"); return; }
    if (!anio)     { alert("Falta el año"); return; }
    if (!seccion)  { alert("Falta la sección"); return; }
    if (!lapso)    { alert("Falta el lapso"); return; }
    if (!duracion) { alert("Falta la duración"); return; }

    const datosExamen = {
      titulo, anio, seccion, lapso, duracion,
      repaso_link: repaso,
      tiempo_repaso_minutos: 2,
      escala: 20,
      creado_por: user.uid
    };

    let examenId;
    if (examenIdEditando) {
      await updateDoc(doc(db, "examenes", examenIdEditando), datosExamen);
      examenId = examenIdEditando;
      const viejasSnap = await getDocs(collection(db, "examenes", examenId, "preguntas"));
      for (const pDoc of viejasSnap.docs) {
        await deleteDoc(doc(db, "examenes", examenId, "preguntas", pDoc.id));
      }
    } else {
      const examenRef = await addDoc(collection(db, "examenes"), {
        ...datosExamen,
        activo: false,
        creado_en: new Date()
      });
      examenId = examenRef.id;
    }

    const preguntas = document.querySelectorAll(".pregunta");
    for (const preguntaDiv of preguntas) {
      const tipo = preguntaDiv.querySelector(".tipoPregunta").value;
      const enunciado = preguntaDiv.querySelector(".enunciado").value;
      if (!tipo || !enunciado) continue; 

      let datosPregunta = { tipo, enunciado, puntos: 1 };

      if (tipo === "opcion_multiple") {
        const opciones = [];
        const opcionesDiv = preguntaDiv.querySelectorAll(".opcionTexto");
        const radios = preguntaDiv.querySelectorAll(".correcta");
        opcionesDiv.forEach((input, index) => {
          opciones.push({ texto: input.value, correcta: radios[index].checked });
        });
        datosPregunta.opciones = opciones;
      }
      if (tipo === "numerica") {
        datosPregunta.respuestaCorrecta = parseFloat(preguntaDiv.querySelector(".respuestaNumerica")?.value || 0);
        datosPregunta.margenError = parseFloat(preguntaDiv.querySelector(".margenError")?.value || 0);
      }
      if (tipo === "completar") {
        datosPregunta.respuestaCorrecta = preguntaDiv.querySelector(".respuestaCompletar")?.value || "";
      }
      if (tipo === "verdadero_falso") {
        datosPregunta.respuestaCorrecta = preguntaDiv.querySelector(".respuestaVF")?.value;
      }

      await addDoc(collection(db, "examenes", examenId, "preguntas"), datosPregunta);
    }

    alert(examenIdEditando ? "✅ Examen actualizado correctamente" : "✅ Examen creado correctamente");
    window.location.href = "panel-profesor.html";

  } catch (error) {
    console.error("Error al guardar:", error);
    alert("❌ Error de Firebase al guardar: " + error.message);
  }
}

window.volver = function () {
  window.location.href = "panel-profesor.html";
};
