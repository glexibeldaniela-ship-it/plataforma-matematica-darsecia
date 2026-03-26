// Verificamos sesión al cargar
let usuarioActual = null;

async function verificarSesion() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        usuarioActual = session.user;
        cargarExamenes(); // Si hay usuario, buscamos sus exámenes
    } else {
        window.location.href = "login.html";
    }
}

async function cargarExamenes() {
    const lista = document.getElementById("listaExamenes");
    if (!lista) return;

    lista.innerHTML = "<p>Cargando exámenes...</p>";

    // Pedimos a Supabase los exámenes creados por este profesor
    const { data: examenes, error } = await window.supabaseClient
        .from('examenes')
        .select('*')
        .eq('creado_por', usuarioActual.id)
        .order('creado_en', { ascending: false });

    if (error) {
        lista.innerHTML = "<p>Error al cargar: " + error.message + "</p>";
        return;
    }

    if (examenes.length === 0) {
        lista.innerHTML = "<p>No has creado exámenes todavía. ¡Crea el primero!</p>";
        return;
    }

    lista.innerHTML = ""; // Limpiamos el mensaje de carga

    examenes.forEach(ex => {
        const card = document.createElement("div");
        card.className = "examen-card"; // Asegúrate de tener este estilo en tu CSS
        card.innerHTML = `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                <h3>${ex.titulo}</h3>
                <p><strong>Año:</strong> ${ex.anio} | <strong>Sección:</strong> ${ex.seccion}</p>
                <p><strong>Lapso:</strong> ${ex.lapso} | <strong>Preguntas:</strong> ${ex.preguntas ? ex.preguntas.length : 0}</p>
                <div style="margin-top: 10px;">
                    <button onclick="editarExamen('${ex.id}')" style="background: #00796b; color: white; border: none; padding: 5px 10px; cursor: pointer;">Editar ✏️</button>
                    <button onclick="eliminarExamen('${ex.id}')" style="background: #d32f2f; color: white; border: none; padding: 5px 10px; cursor: pointer;">Eliminar 🗑️</button>
                </div>
            </div>
        `;
        lista.appendChild(card);
    });
}

// Función para borrar un examen
async function eliminarExamen(id) {
    if (confirm("¿Estás seguro de eliminar este examen? Esta acción no se puede deshacer.")) {
        const { error } = await window.supabaseClient
            .from('examenes')
            .delete()
            .eq('id', id);

        if (error) {
            alert("No se pudo eliminar: " + error.message);
        } else {
            alert("Examen eliminado.");
            cargarExamenes(); // Recargamos la lista
        }
    }
}

// Función para redirigir a la edición
function editarExamen(id) {
    window.location.href = `crear-examen.html?id=${id}`;
}

// Arrancar al cargar la página
document.addEventListener("DOMContentLoaded", verificarSesion);
