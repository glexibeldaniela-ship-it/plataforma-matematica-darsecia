import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc, Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// CONFIGURACIÓN EMAILJS
const EMAILJS_PUBLIC_KEY  = "hnwFbjGD_-7nUH1RY";
const EMAILJS_SERVICE_ID  = "service_43ampij";
const EMAILJS_TEMPLATE_ID = "template_lfbez2i";

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

let codigoValidado = false;

window.enviarCodigoVerificacion = async function () {

const email = document.getElementById("email").value.trim();
const nombres = document.getElementById("nombres").value.trim();

if (!email) {
alert("Escribe un correo válido primero.");
return;
}

const codigo = String(Math.floor(100000 + Math.random() * 900000));

const ahora = new Date();
const expira = new Date(ahora.getTime() + 10 * 60 * 1000);

try {

await addDoc(collection(db, "codigos_verificacion"), {

email,
codigo,
creado_en: Timestamp.fromDate(ahora),
expira_en: Timestamp.fromDate(expira),
usado: false

});

await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {

to_email: email,
to_name: nombres || "Estudiante",
codigo: codigo

});

alert("Código enviado al correo");

} catch (err) {

alert("Error al enviar código");

}

};

window.validarCodigo = async function () {

const email = document.getElementById("email").value.trim();
const codigoInput = document.getElementById("codigoInput").value.trim();

if (codigoInput.length !== 6) {

alert("El código debe tener 6 dígitos.");
return;

}

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

codigoValidado = true;

await deleteDoc(snap.docs[0].ref);

document.getElementById("btnRegistro").disabled = false;

alert("Correo verificado");

} catch (err) {

alert("Error al verificar código");

}

};

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

const cedula    = document.getElementById("cedula").value.trim();
const nombres   = document.getElementById("nombres").value.trim();
const apellidos = document.getElementById("apellidos").value.trim();
const email    = document.getElementById("email").value.trim();
const password = document.getElementById("password").value.trim();
const anio     = document.getElementById("anio").value;
const seccion  = document.getElementById("seccion").value;
const lapso    = document.getElementById("lapso").value;

// VALIDACIÓN DE CONTRASEÑA

if (password.length < 8) {

alert("La contraseña debe tener al menos 8 caracteres.");
return;

}

try {

const cedulaRef  = doc(db, "cedulas", cedula);
const cedulaSnap = await getDoc(cedulaRef);

if (cedulaSnap.exists()) {

alert("Cédula ya registrada");
return;

}

const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

await setDoc(doc(db, "usuarios", user.uid), {

cedula,
nombres,
apellidos,
email,
anio,
seccion,
lapso,
rol: "estudiante",
creado_en: new Date(),
estado: "sin_presentar"

});

await setDoc(doc(db, "cedulas", cedula), {

uid: user.uid

});

alert("¡Registro exitoso!");

window.location.href = "login.html";

} catch (error) {

alert("Error: " + error.message);

}

}