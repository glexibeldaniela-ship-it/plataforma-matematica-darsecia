// js/registro.js
import { supabase } from './supabase.js';

// CONFIGURACIÓN EMAILJS (tus mismas claves)
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY";
const EMAILJS_SERVICE_ID  = "service_43ampij";
const EMAILJS_TEMPLATE_ID = "template_lfbez2i";

// Inicializar EmailJS
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

let codigoValidado = false;

// ============================================
// ENVIAR CÓDIGO DE VERIFICACIÓN
// ============================================
window.enviarCodigoVerificacion = async function () {
    const email = document.getElementById("email").value.trim();
    const nombres = document.getElementById("nombres").value.trim();

    if (!email) {
        alert("Escribe un correo válido primero.");
        return;
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000); // 10 minutos

    try {
        // Guardar código en Supabase (tabla codigos_verificacion)
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
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            to_name: nombres || "Estudiante",
            codigo: codigo
        });

        alert("Código enviado al correo");
        document.getElementById("estadoCodigo").textContent = "📧 Revisa tu bandeja";
        document.getElementById("estadoCodigo").className = "estado-codigo espera";
    } catch (err) {
        console.error(err);
        alert("Error al enviar código");
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
        // Buscar código válido en Supabase
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

        // Marcar como usado
        await supabase
            .from('codigos_verificacion')
            .update({ usado: true })
            .eq('id', data[0].id);

        codigoValidado = true;

        // Mostrar badge de verificado
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

    // Obtener valores del formulario
    const cedula    = document.getElementById("cedula").value.trim();
    const nombres   = document.getElementById("nombres").value.trim();
    const apellidos = document.getElementById("apellidos").value.trim();
    const email     = document.getElementById("email").value.trim();
    const password  = document.getElementById("password").value.trim();
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;
    const anio      = document.getElementById("anio").value;
    const seccion   = document.getElementById("seccion").value;
    const lapso     = document.getElementById("lapso").value;

    // Validar contraseña
    if (password.length < 8) {
        alert("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    try {
        // 1. Verificar si la cédula ya existe
        const { data: cedulaExistente, error: cedulaError } = await supabase
            .from('estudiantes')
            .select('cedula')
            .eq('cedula', cedula);

        if (cedulaError) throw cedulaError;
        if (cedulaExistente && cedulaExistente.length > 0) {
            alert("Cédula ya registrada");
            return;
        }

        // 2. Crear usuario en Supabase 