// js/registro.js
import { supabase } from './supabase.js';

let codigoGenerado = null;

// ============================================
// ENVIAR CÓDIGO DE VERIFICACIÓN (SOLO GUARDAR EN BD)
// ============================================
window.enviarCodigoVerificacion = async function () {
    const email = document.getElementById("email").value.trim();
    const nombres = document.getElementById("nombres").value.trim();

    if (!email) {
        alert("Escribe un correo válido primero.");
        return;
    }

    codigoGenerado = String(Math.floor(100000 + Math.random() * 900000));
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000);

    try {
        const { error } = await supabase
            .from('codigos_verificacion')
            .insert([
                {
                    email: email,
                    codigo: codigoGenerado,
                    creado_en: ahora.toISOString(),
                    expira_en: expira.toISOString(),
                    usado: false
                }
            ]);

        if (error) throw error;

        alert("Código guardado. Espera 1-2 minutos...");
        document.getElementById("estadoCodigo").textContent = "📧 Código generado. Revisa tu correo en 1-2 minutos";
        document.getElementById("estadoCodigo").className = "estado-codigo espera";
    } catch (err) {
        console.error(err);
        alert("Error al generar código");
    }
};

// ============================================
// VALIDAR CÓDIGO
// ============================================
window.validarCodigo = async function () {
    const email = document.getElementById("email").value.trim();
    const codigoInput = document.getElementById("codigoInput").value.trim();

    if (codigoInput.length !== 6) {
        alert("El código debe tener 6 dígitos.");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('codigos_verificacion')
            .select('*')
            .eq('email', email)
            .eq('codigo', codigoInput)
            .eq('usado', false)
            .gte('expira_en', new Date().toISOString());

        if (error) throw error;

        if (!data || data.length === 0) {
            alert("Código incorrecto o expirado.");
            return;
        }

        await supabase
            .from('codigos_verificacion')
            .update({ usado: true })
            .eq('id', data[0].id);

        document.getElementById("badgeValidado").style.display = "block";
        document.getElementById("estadoCodigo").textContent = "✅ Correo verificado";
        document.getElementById("estadoCodigo").className = "estado-codigo ok";

        alert("Correo verificado correctamente");
    } catch (err) {
        console.error(err);
        alert("Error al verificar código");
    }
};

// ============================================
// REGISTRAR USUARIO
// ============================================
async function registrar() {
    const cedula    = document.getElementById("cedula").value.trim();
    const nombres   = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const email     = document.getElementById("email").value.trim();
    const password  = document.getElementById("password").value.trim();
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;
    const anio      = document.getElementById("anio").value;
    const seccion   = document.getElementById("seccion").value;
    const lapso     = document.getElementById("lapso").value;

    if (password.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    try {
        // Verificar si la cédula ya existe
        const { data: cedulaExistente, error: cedulaError } = await supabase
            .from('estudiantes')
            .select('cedula')
            .eq('cedula', cedula);

        if (cedulaError) throw cedulaError;
        if (cedulaExistente && cedulaExistente.length > 0) {
            alert("Cédula ya registrada");
            return;
        }

        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
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

        if (authError) throw authError;

        const userId = authData.user.id;

        // Guardar en tabla estudiantes (SIN CLAVE)
        const { error: insertError } = await supabase
            .from('estudiantes')
            .insert([
                {
                    id: userId,
                    nombres_completos: nombres,
                    apellido_completo: apellidos,
                    cedula: cedula,
                    email: email,
                    fecha_nacimiento: fechaNacimiento,
                    usuario: email,
                    año: anio,
                    seccion: seccion,
                    lapso: lapso,
                    created_at: new Date()
                }
            ]);

        if (insertError) throw insertError;

        alert("¡Registro exitoso! Revisa tu correo para confirmar.");
        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        alert("Error en registro: " + error.message);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formRegistro").addEventListener("submit", (e) => {
        e.preventDefault();
        registrar();
    });
});