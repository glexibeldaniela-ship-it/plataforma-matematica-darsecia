// js/registro.js
import { supabase } from './supabase.js';

// CONFIGURACIÓN EMAILJS
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY";
const EMAILJS_SERVICE_ID  = "service_43ampij";
const EMAILJS_TEMPLATE_ID = "template_lfbez2i";

// Inicializar EmailJS
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

let codigoValidado = false;

// ============================================
// ENVIAR CÓDIGO DE VERIFICACIÓN (CORREGIDO)
// ============================================
window.enviarCodigoVerificacion = async function () {
    const email = document.getElementById("email").value.trim().toLowerCase();
    const nombres = document.getElementById("nombres").value.trim();

    if (!email) {
        alert("Escribe un correo válido primero.");
        return;
    }

    // Validar formato del correo
    if (!email.includes('@') || !email.includes('.')) {
        alert("El correo no tiene formato válido");
        return;
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000);

    try {
        // Guardar código en Supabase
        const { error } = await supabase
            .from('codigos_verificacion')
            .insert([
                {
                    email: email,
                    codigo: codigo,
                    creado_en: ahora.toISOString(),
                    expira_en: expira.toISOString(),
                    usado: false
                }
            ]);

        if (error) throw error;

        // Enviar correo con EmailJS
        const templateParams = {
            to_email: email,
            to_name: nombres || "Estudiante",
            codigo: codigo
        };

        console.log("Enviando a:", email); // Para debug

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

        alert("Código enviado al correo");
        document.getElementById("estadoCodigo").textContent = "📧 Revisa tu bandeja";
        document.getElementById("estadoCodigo").className = "estado-codigo espera";
    } catch (err) {
        console.error("Error completo:", err);
        alert("Error al enviar código. Verifica tu correo.");
    }
};

// ============================================
// VALIDAR CÓDIGO
// ============================================
window.validarCodigo = async function () {
    const email = document.getElementById("email").value.trim().toLowerCase();
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

        codigoValidado = true;

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
    if (!codigoValidado) {
        alert("Primero debes verificar tu correo con el código.");
        return;
    }

    const cedula    = document.getElementById("cedula").value.trim();
    const nombres   = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const email     = document.getElementById("email").value.trim().toLowerCase();
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

        // Verificar si el email ya existe
        const { data: emailExistente, error: emailError } = await supabase
            .from('estudiantes')
            .select('email')
            .eq('email', email);

        if (emailError) throw emailError;
        if (emailExistente && emailExistente.length > 0) {
            alert("Email ya registrado");
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

        // Guardar en tabla estudiantes
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
                    clave: password,
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

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("formRegistro").addEventListener("submit", (e) => {
        e.preventDefault();
        registrar();
    });
});