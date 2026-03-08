import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// ⚙️ CONFIGURACIÓN DE EMAILJS
// ──────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY";
const EMAILJS_SERVICE_ID  = "service_43ampij";
const EMAILJS_TEMPLATE_ID = "template_ifbez2i";

// 🔧 FIX: Inicialización segura para evitar errores de carga
function getEmailJS() {
  if (typeof emailjs === "undefined") {
    throw new Error("La librería EmailJS no está disponible. Verifica tu conexión.");
  }
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  return emailjs;
}

// 🔧 FIX: Extraer mensaje real del error (adiós al "undefined")
function mensajeDeError(err) {
  if (!err) return "Error desconocido";
  return err.message || err.text || JSON.stringify(err);
}

let codigoValidado = false;
let countdownTimer = null;
let segundosRestantes = 0;

function setEstado(msg, tipo = "info") {
  const el = document.getElementById("estadoCodigo");
  if (el) {
    el.textContent = msg;
    el.className = `estado-codigo ${tipo}`;
  }
}

// 📨 ENVIAR EL CÓDIGO DE VERIFICACIÓN
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
    const ejs = getEmailJS(); 
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000); // Expira en 10 min

    // Limpiar códigos viejos del mismo correo para no llenar la base de datos
    const colRef = collection(db, "codigos_verificacion");
    const q = query(colRef, where("email", "==", email));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);

    // Guardar nuevo código en Firestore
    await addDoc(collection(db, "codigos_verificacion"), {
      email,
      codigo,
      creado_en: Timestamp.fromDate(ahora),
      expira_en: Timestamp.fromDate(expira),
      usado: false
    });

    // Enviar por EmailJS con tus variables
    await ejs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      to_name: nombres || "Estudiante",
      codigo: codigo
    });

    document.getElementById("codigoInput").disabled = false;
    document.getElementById("btnVerificar").disabled = false;
    setEstado(`📨 Código enviado a ${email}`, "ok");
    iniciarCuentaRegresiva(60);

  } catch (err) {
    console.error("Error al enviar código:", err);
    alert("Error al enviar el código: " + mensajeDeError(err));
    btnEnviar.disabled = false;
    setEstado("❌ Error al enviar. Intenta de nuevo.", "error");
  }
};

// ✔️ VALIDAR EL CÓDIGO INGRESADO
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

    // ÉXITO EN LA VERIFICACIÓN
    codigoValidado = true;
    await deleteDoc(snap.docs[0].ref);

    document.getElementById("badgeValidado").style.display = "block";
    document.getElementById("btnRegistro").disabled = false;
    document.getElementById("btnEnviarCodigo").disabled = true;
    document.getElementById("codigoInput").disabled = true;
    document.getElementById("btnVerificar").disabled = true;
    setEstado("✅ Correo verificado correctamente.", "ok");

  } catch (err) {
    console.error("Error al validar código:", err);
    alert("Error al verificar: " + mensajeDeError(err));
    setEstado("❌ Error al verificar.", "error");
  }
};

function iniciarCuentaRegresiva(seg) {
  segundosRestantes = seg;
  const row = document.getElementById("reenviarRow");
  if (!row) return; // 🔧 FIX: Guardia para evitar errores si el elemento no existe

  if (countdownTimer) clearInterval(countdownTimer);

  countdownTimer = setInterval(() => {
    if (segundosRestantes <= 0) {
      clearInterval(countdownTimer);
      row.innerHTML = `<a href="#" onclick="enviarCodigoVerificacion(); return false;">Reenviar código</a>`;
    } else {
      row.textContent = `Reenviar en ${segundosRestantes}s`;
      segundosRestantes--;
    }
  }, 1000);
}

// 📋 FORMULARIO DE REGISTRO FINAL
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formRegistro");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      registrar();
    });
  }
});

async function registrar() {
  if (!codigoValidado) {
    alert("Primero debes verificar tu correo con el código de 6 dígitos.");
    return;
  }

  const cedula        = document.getElementById("cedula").value.trim();
  const nombres       = document.getElementById("nombres").value.trim();
  const apellidos     = document.getElementById("apellidos").value.trim();
  const fechaNacimiento = document.getElementById("fechaNacimiento")?.value;
  const email         = document.getElementById("email").value.trim();
  const password      = document.getElementById("password").value.trim();
  const anio          = document.getElementById("anio").value;
  const seccion       = document.getElementById("seccion").value;
  const lapso         = document.getElementById("lapso").value;

  try {
    const cedulaRef  = doc(db, "cedulas", cedula);
    const cedulaSnap = await getDoc(cedulaRef);

    if (cedulaSnap.exists()) {
      alert("Esta cédula ya está registrada.");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      cedula, nombres, apellidos, fechaNacimiento, email,
      anio, seccion, lapso, rol: "estudiante",
      creado_en: new Date(), intento: false, nota: null, estado: "sin_presentar"
    });

    await setDoc(doc(db, "cedulas", cedula), { uid: user.uid });

    alert("¡Registro exitoso! Redirigiendo al inicio de sesión...");
    window.location.href = "login.html";

  } catch (error) {
    console.error("Error en registro:", error);
    alert("Error al registrar: " + mensajeDeError(error));
  }
}
