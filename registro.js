import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY";
const EMAILJS_SERVICE_ID  = "service_43ampij";
const EMAILJS_TEMPLATE_ID = "template_ifbez2i";

// 🔧 FIX: Inicialización segura
function getEmailJS() {
  if (typeof emailjs === "undefined") {
    throw new Error("La librería EmailJS no está disponible. Verifica tu conexión.");
  }
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  return emailjs;
}

// 🔧 FIX: Extraer mensaje real (evita el "undefined")
function mensajeDeError(err) {
  if (!err) return "Error desconocido";
  return err.message || err.text || JSON.stringify(err); [span_11](start_span)//[span_11](end_span)
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
    const expira = new Date(ahora.getTime() + 10 * 60 * 1000);

    const colRef = collection(db, "codigos_verificacion");
    const q = query(colRef, where("email", "==", email));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);

    await addDoc(collection(db, "codigos_verificacion"), {
      email,
      codigo,
      creado_en: Timestamp.fromDate(ahora),
      expira_en: Timestamp.fromDate(expira),
      usado: false
    });

    await ejs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      to_name: nombres || "Estudiante",
      codigo: codigo
    });

    document.getElementById("codigoInput").disabled = false;
    document.getElementById("btnVerificar").disabled = false;
    setEstado(`📨 Código enviado a ${email}`, "info");
    iniciarCuentaRegresiva(60);

  } catch (err) {
    console.error("Error al enviar código:", err);
    alert("Error al enviar el código: " + mensajeDeError(err)); [span_12](start_span)//[span_12](end_span)
    btnEnviar.disabled = false;
    setEstado("❌ Error al enviar. Intenta de nuevo.", "error");
  }
};

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
      alert("Código incorrecto.");
      return;
    }

    const datos = snap.docs[0].data();
    if (new Date() > datos.expira_en.toDate()) {
      setEstado("❌ Código expirado.", "error");
      alert("El código ha expirado.");
      return;
    }

    codigoValidado = true;
    await deleteDoc(snap.docs[0].ref);

    document.getElementById("badgeValidado").style.display = "block";
    document.getElementById("btnRegistro").disabled = false;
    document.getElementById("btnEnviarCodigo").disabled = true;
    document.getElementById("codigoInput").disabled = true;
    document.getElementById("btnVerificar").disabled = true;
    setEstado("✅ Correo verificado correctamente.", "ok");

  } catch (err) {
    alert("Error al verificar: " + mensajeDeError(err)); [span_13](start_span)//[span_13](end_span)
    setEstado("❌ Error al verificar.", "error");
  }
};

function iniciarCuentaRegresiva(seg) {
  segundosRestantes = seg;
  const row = document.getElementById("reenviarRow");
  if (!row) return; [span_14](start_span)// 🔧 FIX: Guardia importante[span_14](end_span)
  
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

// --- RESTO DEL CÓDIGO DE REGISTRO IGUAL ---
// (Solo asegúrate de usar mensajeDeError(error) en el catch de registrar())
