import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// ⚙️ CONFIGURACIÓN DE EMAILJS (Corregida según tu panel)
// ──────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY"; 
const EMAILJS_SERVICE_ID  = "service_43ampij";   
const EMAILJS_TEMPLATE_ID = "template_lfbez2i";  [span_0](start_span)// 🔧 FIX: Se cambió 'if' por 'lf' según tu ID real[span_0](end_span)

[span_1](start_span)// 🔧 FIX: Inicialización segura para evitar el error "undefined"[span_1](end_span)
function getEmailJS() {
  if (typeof emailjs === "undefined") {
    throw new Error("La librería EmailJS no está disponible. Verifica tu conexión.");
  }
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  return emailjs;
}

[span_2](start_span)// 🔧 FIX: Extraer mensaje real del error para diagnóstico claro[span_2](end_span)
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
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000); [span_3](start_span)// 10 min de validez[span_3](end_span)

    [span_4](start_span)// Limpiar códigos previos en Firestore[span_4](end_span)
    const colRef = collection(db, "codigos_verificacion");
    const q = query(colRef, where("email", "==", email));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);

    [span_5](start_span)// Guardar nuevo código[span_5](end_span)
    await addDoc(collection(db, "codigos_verificacion"), {
      email,
      codigo,
      creado_en: Timestamp.fromDate(ahora),
      expira_en: Timestamp.fromDate(expira),
      usado: false
    });

    [span_6](start_span)[span_7](start_span)// Enviar a los parámetros de tu plantilla {{to_email}}, {{to_name}}, {{codigo}}[span_6](end_span)[span_7](end_span)
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
    alert("Error al enviar el código: " + mensajeDeError(err)); [span_8](start_span)// 🔧 FIX[span_8](end_span)
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
    [span_9](start_span)if (new Date() > datos.expira_en.toDate()) { // Verificación de expiración[span_9](end_span)
      setEstado("❌ Código expirado.", "error");
      alert("El código ha expirado. Solicita uno nuevo.");
      return;
    }

    codigoValidado = true;
    await deleteDoc(snap.docs[0].ref); [span_10](start_span)// Eliminar código tras uso exitoso[span_10](end_span)

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
  if (!row) return; [span_11](start_span)// 🔧 FIX: Guardia para estabilidad[span_11](end_span)

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

  [span_12](start_span)// Captura de datos del estudiante [cite: 52-57]
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

    [cite_start]// Guardar perfil completo en Firestore[span_12](end_span)
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
