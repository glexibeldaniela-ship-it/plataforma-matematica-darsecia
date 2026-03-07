import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ──────────────────────────────────────────────────────────────
// ⚠️ CONFIGURACIÓN DE EMAILJS (Tus llaves ya integradas)
// ──────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY";
const EMAILJS_SERVICE_ID  = "service_43ampij";
const EMAILJS_TEMPLATE_ID = "template_ifbez2i";

if (window.emailjs) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// Variables de control del código
let codigoValidado = false;
let countdownTimer = null;
let segundosRestantes = 0;

// Helper para mensajes en pantalla
function setEstado(msg, tipo = "info") {
  const el = document.getElementById("estadoCodigo");
  if (el) {
    el.textContent = msg;
    el.className = `estado-codigo ${tipo}`;
  }
}

// 🆕 FUNCIÓN PARA ENVIAR EL CÓDIGO
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

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const ahora = new Date();
  const expira = new Date(ahora.getTime() + 10 * 60 * 1000); // 10 min

  try {
    // Limpiar códigos viejos
    const colRef = collection(db, "codigos_verificacion");
    const q = query(colRef, where("email", "==", email));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);

    // Guardar en Firebase
    await addDoc(collection(db, "codigos_verificacion"), {
      email,
      codigo,
      creado_en: Timestamp.fromDate(ahora),
      expira_en: Timestamp.fromDate(expira),
      usado: false
    });

    // Enviar por EmailJS
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      to_name: nombres || "Estudiante",
      codigo: codigo
    });

    document.getElementById("codigoInput").disabled = false;
    document.getElementById("btnVerificar").disabled = false;
    setEstado(`📨 Código enviado a ${email}`, "info");
    iniciarCuentaRegresiva(60);

  } catch (err) {
    console.error(err);
    alert("Error al enviar: " + err.message);
    btnEnviar.disabled = false;
  }
};

// 🆕 FUNCIÓN PARA VALIDAR EL CÓDIGO
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
      alert("Código incorrecto.");
      return;
    }

    const datos = snap.docs[0].data();
    if (new Date() > datos.expira_en.toDate()) {
      alert("Código expirado.");
      return;
    }

    // ÉXITO
    codigoValidado = true;
    await deleteDoc(snap.docs[0].ref);
    
    document.getElementById("badgeValidado").style.display = "block";
    document.getElementById("btnRegistro").disabled = false;
    document.getElementById("btnEnviarCodigo").disabled = true;
    document.getElementById("codigoInput").disabled = true;
    setEstado("✅ Verificado", "ok");

  } catch (err) {
    alert("Error: " + err.message);
  }
};

function iniciarCuentaRegresiva(seg) {
  segundosRestantes = seg;
  const row = document.getElementById("reenviarRow");
  if (countdownTimer) clearInterval(countdownTimer);
  
  countdownTimer = setInterval(() => {
    if (segundosRestantes <= 0) {
      clearInterval(countdownTimer);
      row.innerHTML = `<a href="#" onclick="enviarCodigoVerificacion()">Reenviar código</a>`;
    } else {
      row.textContent = `Reenviar en ${segundosRestantes}s`;
      segundosRestantes--;
    }
  }, 1000);
}

// ✅ TU FUNCIÓN ORIGINAL DE REGISTRO (CON LA TRABA DE SEGURIDAD)
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("formRegistro").addEventListener("submit", (e) => {
    e.preventDefault();
    registrar();
  });
});

async function registrar() {
  if (!codigoValidado) {
    alert("Primero debes verificar tu correo con el código.");
    return;
  }

  const cedula = document.getElementById("cedula").value.trim();
  const nombres = document.getElementById("nombres").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const fechaNacimiento = document.getElementById("fechaNacimiento")?.value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const anio = document.getElementById("anio").value;
  const seccion = document.getElementById("seccion").value;
  const lapso = document.getElementById("lapso").value;

  try {
    const cedulaRef = doc(db, "cedulas", cedula);
    const cedulaSnap = await getDoc(cedulaRef);
    if (cedulaSnap.exists()) {
      alert("Cédula ya registrada");
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

    alert("¡Registro exitoso!");
    window.location.href = "login.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
}
