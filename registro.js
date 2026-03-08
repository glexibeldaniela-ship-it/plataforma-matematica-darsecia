import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// ⚙️ CONFIGURACIÓN DE EMAILJS (Extraída de tus imágenes)
// ──────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY"; // Tu Public Key
const EMAILJS_SERVICE_ID  = "service_43ampij";   // Tu Service ID (Gmail)
const EMAILJS_TEMPLATE_ID = "template_lfbez2i";  // Tu Template ID

// Variables de control de estado
let codigoValidado = false;
let countdownTimer = null;
let segundosRestantes = 0;

// 🔧 FUNCIÓN AUXILIAR: Extraer el mensaje real de error (evita el "undefined")
function mensajeDeError(err) {
  if (!err) return "Error desconocido";
  return err.message || err.text || JSON.stringify(err);
}

// 🔧 FUNCIÓN AUXILIAR: Mostrar estado en la pantalla
function setEstado(msg, tipo = "info") {
  const el = document.getElementById("estadoCodigo");
  if (el) {
    el.textContent = msg;
    el.className = `estado-codigo ${tipo}`;
  }
}

// 📨 1. ENVIAR EL CÓDIGO (Visible para el HTML mediante 'window')
window.enviarCodigoVerificacion = async function () {
  const email = document.getElementById("email").value.trim();
  const nombres = document.getElementById("nombres").value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Escribe un correo válido primero.");
    return;
  }

  const btnEnviar = document.getElementById("btnEnviarCodigo");
  btnEnviar.disabled = true;
  setEstado("⏳ Generando código...", "espera");

  try {
    // Inicialización de EmailJS con tu Public Key
    if (typeof emailjs === "undefined") {
      throw new Error("La librería EmailJS no se detecta. Revisa el orden de los scripts.");
    }
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

    // Generar código de 6 dígitos
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000); // 10 minutos

    // Limpiar códigos anteriores de este correo en Firebase
    const colRef = collection(db, "codigos_verificacion");
    const q = query(colRef, where("email", "==", email));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);

    // Guardar nuevo código en la base de datos
    await addDoc(collection(db, "codigos_verificacion"), {
      email,
      codigo,
      creado_en: Timestamp.fromDate(ahora),
      expira_en: Timestamp.fromDate(expira),
      usado: false
    });

    // ENVIAR CORREO: Usa los nombres {{to_email}}, {{to_name}} y {{codigo}}
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      to_name: nombres || "Estudiante",
      codigo: codigo
    });

    // Activar campos de verificación
    document.getElementById("codigoInput").disabled = false;
    document.getElementById("btnVerificar").disabled = false;
    setEstado(`📨 Código enviado a ${email}`, "ok");
    iniciarCuentaRegresiva(60);

  } catch (err) {
    console.error("Error completo:", err);
    alert("Error al enviar el código: " + mensajeDeError(err));
    btnEnviar.disabled = false;
    setEstado("❌ Error al enviar. Intenta de nuevo.", "error");
  }
};

// ✔️ 2. VALIDAR EL CÓDIGO INGRESADO
window.validarCodigo = async function () {
  const email = document.getElementById("email").value.trim();
  const codigoInput = document.getElementById("codigoInput").value.trim();

  if (codigoInput.length !== 6) {
    alert("El código debe tener 6 dígitos.");
    return;
  }

  setEstado("⏳ Verificando...", "espera");

  try {
    const q = query(
      collection(db, "codigos_verificacion"),
      where("email", "==", email),
      where("codigo", "==", codigoInput)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      setEstado("❌ Código incorrecto.", "error");
      alert("Código incorrecto. Revisa el correo.");
      return;
    }

    const datos = snap.docs[0].data();
    if (new Date() > datos.expira_en.toDate()) {
      setEstado("❌ Código expirado.", "error");
      alert("El código ha expirado. Solicita uno nuevo.");
      return;
    }

    // Código exitoso
    codigoValidado = true;
    await deleteDoc(snap.docs[0].ref);

    document.getElementById("badgeValidado").style.display = "block";
    document.getElementById("btnRegistro").disabled = false;
    document.getElementById("btnEnviarCodigo").disabled = true;
    document.getElementById("codigoInput").disabled = true;
    document.
