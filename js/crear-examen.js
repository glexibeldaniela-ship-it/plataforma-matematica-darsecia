import { auth, db } from "./firebase.js";
import {
  collection, addDoc, getDoc, doc, getDocs, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

let contadorPreguntas = 0;
let examenIdEditando = null;
let usuarioActual = null;

// 🔐 Monitorear el estado de la autenticación con persistencia
onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioActual = user;
  } else {
    // Si no hay usuario, redirigir al login por seguridad
    window.location.href = "login.html";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnAgregar").addEventListener("click", () => agregarPreguntaConDatos({}));
  document.getElementById("btnGuardar").addEventListener("click", guardarExamen);

  // ---- MODO EDICIÓN ----
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
    document.getElementById("btnGuardar").textContent = "Actualizar Examen 🔄";

    const examenSnap = await getDoc(doc(db, "examenes", id));
    if (!examenSnap.exists()) {
      alert("No se encontró el examen.");
      window.location.href = "panel-profesor.html";
      return;
    }

    const data = examenSnap.data();
    document.getElementById("titulo").value = data.titulo || "";
    document.getElementById("anio").value = data.anio || "1";
    document.getElementById("seccion").value = data.seccion || "A"; 
    document.getElementById("lapso").value = data.lapso || "1";
    document.getElementById("duracion").value = data.duracion || "45";
    document.getElementById("repaso").value = data.repaso_link || "";

    const preguntasSnap = await getDocs(collection(db, "examenes", id, "preguntas"));
    preguntasSnap.forEach(pDoc => {
      agregarPreguntaConDatos(pDoc.data());
    });
  } catch (e) {
    console.error("Error al editar:", e);
    alert("Error al cargar los datos para editar.");
  }
}

function agregarPreguntaConDatos(p) {
  const contenedor = document.getElementById("contenedorPreguntas");
  const div = document.createElement("div");
  div.classList.add("pregunta-item"); // Usamos la clase definida en el CSS
  div.dataset.index = contadorPreguntas;

  div.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <strong style="color:#00796b;">Pregunta #${contadorPreguntas + 1}</strong>
      <button type="button" class="btn-eliminar-p" onclick="this.parentElement.parentElement.remove()">Eliminar 🗑️</button>
    </div>
    <label>Tipo de Pregunta</label>
    <select class="tipoPregunta">
      <option value="">Seleccione tipo...</option>
      <option value="opcion_multiple">Opción múltiple</option>
      <option value="numerica">Respuesta numérica</option>
      <option value="verdadero_falso">Verdadero / Falso</option>
      <option value="desarrollo">Desarrollo</option>
    </select>
    <br><br>
    <label>Enunciado</label>
    <input type="text" class="enunciado" placeholder="¿Cuánto es 2+2?" value="${p.enunciado || ""}">
    <div class="contenidoDinamico" style="margin-top:15px;"></div>
  `;

  contenedor.appendChild(div);

  const select = div.querySelector(".tipoPregunta");
  const contenido = div.querySelector(".contenidoDinamico");

  select.addEventListener("change", () => renderContenidoDinamico(select.value, contenido, p));

  if (p.tipo) {
    select.value = p.tipo;
    renderContenidoDinamico(p.tipo, contenido, p);
  }

  contadorPreguntas++;
}

function renderContenidoDinamico(tipo, contenido, datos) {
  contenido.innerHTML = "";
  const idLocal = Date.now(); // ID único para los radios

  if (tipo === "opcion_multiple") {
    contenido.innerHTML = `<button type="button" class="btn-agregar" style="padding:5px; font-size:0.8rem;">➕ Añadir Opción</button><div class="lista-opciones" style="margin-top:10px;"></div>`;
    const btn = contenido.querySelector("button");
    const lista = contenido.querySelector(".lista-opciones");

    btn.onclick = () => crearFilaOpcion(lista, idLocal, "", false);

    if (datos && datos.opciones) {
      datos.opciones.forEach(op => crearFilaOpcion(lista, idLocal, op.texto, op.correcta));
    } else {
      // Por defecto poner dos opciones vacías
      crearFilaOpcion(lista, idLocal, "", false);
      crearFilaOpcion(lista, idLocal, "", false);
    }
  } else if (tipo === "numerica") {
    contenido.innerHTML = `<input type="number" class="resCorrecta" placeholder="Resultado exacto" value="${datos.respuestaCorrecta || ""}">`;
  } else if (tipo === "verdadero_falso") {
    contenido.innerHTML = `
      <select class="resVF">
        <option value="verdadero" ${datos.respuestaCorrecta === "verdadero" ? "selected" : ""}>Verdadero</option>
        <option value="falso" ${datos.respuestaCorrecta === "falso" ? "selected" : ""}>Falso</option>
      </select>`;
  } else if (tipo === "desarrollo") {
    contenido.innerHTML = `<p style="font-size:0.8rem; color:#666;">El estudiante tendrá un cuadro de texto para escribir.</p>`;
  }
}

function crearFilaOpcion(lista, idLocal, texto, esCorrecta) {
  const opDiv = document.createElement("div");
  opDiv.style.display = "flex";
  opDiv.style.gap = "5px";
  opDiv.style.marginBottom = "5px";
  opDiv.innerHTML = `
    <input type="radio" name="radio_${idLocal}" class="esCorrecta" ${esCorrecta ? "checked" : ""}>
    <input type="text" class="txtOpcion" placeholder="Opción..." value="${texto}" style="flex:1;">
    <button type="button" onclick="this.parentElement.remove()" style="border:none; background:none;">❌</button>
  `;
  lista.appendChild(opDiv);
}

async function guardarExamen() {
  if (!usuarioActual) { alert("No se detectó sesión activa."); return; }

  const btn = document.getElementById("btnGuardar");
  btn.disabled = true;
  btn.innerText = "Guardando...";

  try {
    const datos = {
      titulo: document.getElementById("titulo").value.trim(),
      anio: document.getElementById("anio").value,
      seccion: document.getElementById("seccion").value,
      lapso: document.getElementById("lapso").value,
      duracion: parseInt(document.getElementById("duracion").value) || 45,
      repaso_link: document.getElementById("repaso").value.trim(),
      creado_por: usuarioActual.uid,
      ultima_modificacion: serverTimestamp()
    };

    if (!datos.titulo) throw new Error("El título es obligatorio.");

    let finalId = examenIdEditando;

    if (examenIdEditando) {
      // Actualizar cabecera
      await updateDoc(doc(db, "examenes", examenIdEditando), datos);
      // Borrar preguntas viejas para re-escribirlas
      const viejas = await getDocs(collection(db, "examenes", examenIdEditando, "preguntas"));
      for (const d of viejas.docs) await deleteDoc(doc(db, "examenes", examenIdEditando, "preguntas", d.id));
    } else {
      // Crear nuevo
      const nuevoEx = await addDoc(collection(db, "examenes"), {
        ...datos,
        activo: false,
        creado_en: serverTimestamp()
      });
      finalId = nuevoEx.id;
    }

    // Guardar preguntas
    const preguntasDivs = document.querySelectorAll(".pregunta-item");
    for (const pDiv of preguntasDivs) {
      const tipo = pDiv.querySelector(".tipoPregunta").value;
      const enunciado = pDiv.querySelector(".enunciado").value.trim();
      if (!tipo || !enunciado) continue;

      let pData = { tipo, enunciado };

      if (tipo === "opcion_multiple") {
        const ops = [];
        pDiv.querySelectorAll(".lista-opciones div").forEach(row => {
          ops.push({
            texto: row.querySelector(".txtOpcion").value.trim(),
            correcta: row.querySelector(".esCorrecta").checked
          });
        });
        pData.opciones = ops;
      } else if (tipo === "numerica") {
        pData.respuestaCorrecta = pDiv.querySelector(".resCorrecta").value;
      } else if (tipo === "verdadero_falso") {
        pData.respuestaCorrecta = pDiv.querySelector(".resVF").value;
      }

      await addDoc(collection(db, "examenes", finalId, "preguntas"), pData);
    }

    alert("✅ Examen guardado con éxito.");
    window.location.href = "panel-profesor.html";
  } catch (err) {
    alert("Error: " + err.message);
    btn.disabled = false;
    btn.innerText = "Guardar y Publicar Examen";
  }
}