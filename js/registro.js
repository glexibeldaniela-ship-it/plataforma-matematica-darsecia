// js/registro.js

// ============================================
// REGISTRAR USUARIO (Registro Directo y Simplificado)
// ============================================
async function registrar() {
    const supabase = window.n;

    // Captura de datos del formulario
    const cedula          = document.getElementById("cedula").value.trim();
    const nombres         = document.getElementById("nombres").value.trim();
    const apellidos       = document.getElementById("apellidos").value.trim();
    const email           = document.getElementById("email").value.trim();
    const password        = document.getElementById("password").value.trim();
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;
    const anioTexto       = document.getElementById("anio").value; // "1er Año", "2do Año"...
    const seccion         = document.getElementById("seccion").value;
    const lapso           = document.getElementById("lapso").value;

    // Validaciones Básicas
    if (!email || !cedula || !nombres) {
        alert("Por favor, completa los campos obligatorios.");
        return;
    }
    if (password.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres por seguridad.");
        return;
    }
    if (!anioTexto || !seccion) {
        alert("Debes seleccionar tu año y sección.");
        return;
    }

    // SOLUCIÓN DEFINITIVA: Ya no convertimos a número. 
    // Guardamos el texto completo para que coincida con la tabla de examenes.
    // (Borramos la línea del anioNumerico)

    try {
        // 1. Verificar disponibilidad de la cédula
        const { data: cedulaExistente, error: cedulaError } = await supabase
            .from('estudiantes')
            .select('cedula')
            .eq('cedula', cedula);

        if (cedulaError) throw cedulaError;
        if (cedulaExistente && cedulaExistente.length > 0) {
            alert("Esta cédula ya se encuentra registrada en el sistema.");
            return;
        }

        // 2. Registro en Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombres: nombres,
                    apellidos: apellidos,
                    cedula: cedula,
                    rol: 'estudiante'
                }
            }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("No se pudo crear el usuario de autenticación.");

        // 3. Insertar datos en la tabla académica 'estudiantes'
        const { error: insertError } = await supabase
            .from('estudiantes')
            .insert([{
                id: authData.user.id,
                nombres_completos: nombres,
                apellido_completo: apellidos,
                cedula: cedula,
                email: email,
                fecha_nacimiento: fechaNacimiento,
                // AHORA GUARDAMOS EL TEXTO COMPLETO (Ej: "1er Año")
                anio: anioTexto, 
                seccion: seccion,
                lapso: lapso,
                created_at: new Date()
            }]);

        if (insertError) throw insertError;

        alert("¡Registro exitoso! Bienvenido a MateEduPro.");
        window.location.href = "login.html";

    } catch (err) {
        console.error("Error en el proceso de registro:", err);
        alert("Hubo un problema: " + err.message);
    }
}

// ============================================
// EVENT LISTENER
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegistro");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            registrar();
        });
    }
});
