// js/registro.js
import { supabase } from './supabase.js';

// ============================================
// 1. ENVIAR CÓDIGO DE VERIFICACIÓN (OTP Nativo)
// ============================================
window.enviarCodigoVerificacion = async function () {
    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Escribe un correo válido primero.");
        return;
    }

    try {
        // Aquí le decimos a Supabase: "Mándale un código a este chamo"
        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: true // Si no existe, lo va creando en la lista de espera
            }
        });

        if (error) throw error;

        alert("Código enviado a " + email + ". Revisa tu bandeja de entrada.");
        document.getElementById("estadoCodigo").textContent = "📧 Código enviado. Revisa tu correo.";
        document.getElementById("estadoCodigo").className = "estado-codigo espera";
    } catch (err) {
        console.error(err);
        // Si sale este error, revisa si no te pasaste del límite de correos por hora
        alert("Error al generar código: " + err.message);
    }
};

// ============================================
// 2. VALIDAR CÓDIGO (Verificar con Supabase)
// ============================================
window.validarCodigo = async function () {
    const email = document.getElementById("email").value.trim();
    const codigoInput = document.getElementById("codigoInput").value.trim();

    if (codigoInput.length !== 6) {
        alert("El código debe tener 6 dígitos.");
        return;
    }

    try {
        // Le preguntamos a Supabase si el código que metió el chamo es el correcto
        const { data, error } = await supabase.auth.verifyOtp({
            email: email,
            token: codigoInput,
            type: 'email'
        });

        if (error) throw error;

        // Si pasó, activamos los checks de "Validado" que ya tenías
        document.getElementById("badgeValidado").style.display = "block";
        document.getElementById("estadoCodigo").textContent = "✅ Correo verificado";
        document.getElementById("estadoCodigo").className = "estado-codigo ok";

        alert("Correo verificado correctamente");
    } catch (err) {
        console.error(err);
        alert("Código incorrecto o expirado.");
    }
};

// ============================================
// 3. REGISTRAR USUARIO (Guardar datos finales)
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
        // Primero chequeamos si la cédula ya está en la tabla
        const { data: cedulaExistente, error: cedulaError } = await supabase
            .from('estudiantes')
            .select('cedula')
            .eq('cedula', cedula);

        if (cedulaError) throw cedulaError;
        if (cedulaExistente && cedulaExistente.length > 0) {
            alert("Cédula ya registrada.");
            return;
        }

        // Como el chamo ya verificó el OTP, ya está en el sistema. 
        // Solo le ponemos su clave y sus datos de perfil.
        const { data: { user }, error: updateError } = await supabase.auth.updateUser({
            password: password,
            data: {
                nombres: nombres,
                apellidos: apellidos,
                cedula: cedula,
                rol: 'estudiante'
            }
        });

        if (updateError) throw updateError;

        // Ahora sí, guardamos todo en tu tabla de 'estudiantes'
        const { error: insertError } = await supabase
            .from('estudiantes')
            .insert([
                {
                    id: user.id,
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

        alert("¡Registro exitoso!");
        window.location.href = "login.html";

    } catch (error) {
        console.error(error);
        alert("Error en registro: " + error.message);
    }
}

// ============================================
// EVENT LISTENERS (Esto se queda igualito)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formRegistro");
    if(form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            registrar();
        });
    }
});
