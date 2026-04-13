// MateEduPro - Lógica de Creación de Exámenes
let examenIdEditando = null;
let usuarioActual = null;

// 🔐 Verificar sesión con Supabase Global
async function verificarSesion() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        usuarioActual = session.user;
    } else {
        window.location.href = "login.html";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await verificarSesion();

    document.getElementById("btnAgregar").addEventListener("click", () => agregarPreguntaConDatos({}));
    document.getElementById("btnGuardar").addEventListener("click", guardarExamen);

    // MODO EDICIÓN: Si viene un ID en la URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
        examenIdEditando = id;
        cargarExamenParaEditar(id);
    }
});

function agregarPreguntaConDatos(p) {
    const contenedor = document.getElementById("contenedorPreguntas");
    const div = document.createElement("div");
    div.classList.add("pregunta-item");

    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="color:#00796b;">Pregunta</strong>
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
        <input type="text" class="enunciado" placeholder="Ej: ¿Cuánto es 5x5?" value="${p.enunciado || ""}">
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
}

function renderContenidoDinamico(tipo, contenido, datos) {
    contenido.innerHTML = "";
    const idLocal = Date.now();

    if (tipo === "opcion_multiple") {
        contenido.innerHTML = `<button type="button" class="btn-accion btn-agregar" style="padding:5px; font-size:12px;">➕ Añadir Opción</button><div class="lista-opciones" style="margin-top:10px;"></div>`;
        const btn = contenido.querySelector("button");
        const lista = contenido.querySelector(".lista-opciones");

        btn.onclick = () => crearFilaOpcion(lista, idLocal, "", false);

        if (datos.opciones) {
            datos.opciones.forEach(op => crearFilaOpcion(lista, idLocal, op.texto, op.correcta));
        } else {
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
    }
}

function crearFilaOpcion(lista, idLocal, texto, esCorrecta) {
    const opDiv = document.createElement("div");
    opDiv.className = "opcion-fila";
    opDiv.innerHTML = `
        <input type="radio" name="radio_${idLocal}" class="esCorrecta" ${esCorrecta ? "checked" : ""}>
        <input type="text" class="txtOpcion" placeholder="Opción..." value="${texto}" style="flex:1;">
        <button type="button" style="background:none; border:none; cursor:pointer;" onclick="this.parentElement.remove()">❌</button>
    `;
    lista.appendChild(opDiv);
}

async function cargarExamenParaEditar(id) {
    const { data: ex, error } = await window.supabaseClient.from('examenes').select('*').eq('id', id).single();
    if (ex) {
        document.getElementById("titulo").value = ex.titulo;
        document.getElementById("anio").value = ex.anio;
        document.getElementById("seccion").value = ex.seccion;
        document.getElementById("lapso").value = ex.lapso;
        document.getElementById("duracion").value = ex.duracion;
        document.getElementById("repaso").value = ex.repaso_link || "";
        document.getElementById("descripcion").value = ex.descripcion || "";

        ex.preguntas.forEach(p => agregarPreguntaConDatos(p));
    }
}

async function guardarExamen() {
    if (!usuarioActual) return;

    const btn = document.getElementById("btnGuardar");
    btn.disabled = true;
    btn.innerText = "Guardando...";

    const preguntasArr = [];
    document.querySelectorAll(".pregunta-item").forEach(pDiv => {
        const tipo = pDiv.querySelector(".tipoPregunta").value;
        const enunciado = pDiv.querySelector(".enunciado").value.trim();
        
        let pData = { tipo, enunciado };

        if (tipo === "opcion_multiple") {
            pData.opciones = Array.from(pDiv.querySelectorAll(".lista-opciones .opcion-fila")).map(row => ({
                texto: row.querySelector(".txtOpcion").value.trim(),
                correcta: row.querySelector(".esCorrecta").checked
            }));
        } else if (tipo === "numerica") {
            pData.respuestaCorrecta = pDiv.querySelector(".resCorrecta").value;
        } else if (tipo === "verdadero_falso") {
            pData.respuestaCorrecta = pDiv.querySelector(".resVF").value;
        }
        preguntasArr.push(pData);
    });

    const datosExamen = {
        titulo: document.getElementById("titulo").value.trim(),
        anio: document.getElementById("anio").value,
        seccion: document.getElementById("seccion").value,
        lapso: document.getElementById("lapso").value,
        duracion: parseInt(document.getElementById("duracion").value) || 45,
        repaso_link: document.getElementById("repaso").value.trim(),
        descripcion: document.getElementById("descripcion").value.trim(),
        creado_por: usuarioActual.id,
        preguntas: preguntasArr,
        activo: true // Por defecto lo creamos activo
    };

    let res;
    if (examenIdEditando) {
        res = await window.supabaseClient.from('examenes').update(datosExamen).eq('id', examenIdEditando);
    } else {
        res = await window.supabaseClient.from('examenes').insert([datosExamen]);
    }

    if (res.error) {
        alert("Error al guardar: " + res.error.message);
        btn.disabled = false;
        btn.innerText = "Reintentar Guardar";
    } else {
        alert("✅ Examen guardado exitosamente");
        window.location.href = "panel-profesor.html";
    }
                }
                
