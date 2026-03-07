const admin = require("firebase-admin");

// ⚠ Pega aquí tu archivo serviceAccountKey.json
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 🔥 CAMBIA ESTE CORREO POR EL TUYO
const emailAdmin = "TU_CORREO_ADMIN@gmail.com";

async function hacerAdmin() {

  try {

    const user = await admin.auth().getUserByEmail(emailAdmin);

    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    });

    console.log("Usuario ahora es ADMIN:", emailAdmin);

  } catch (error) {
    console.error("Error:", error);
  }

}

hacerAdmin();

{}