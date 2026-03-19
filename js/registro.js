window.enviarCodigoVerificacion = async function () {
    const email = document.getElementById("email").value.trim();
    const nombres = document.getElementById("nombres").value.trim();

    if (!email) {
        alert("Escribe un correo válido primero.");
        return;
    }

    // MODO PRUEBA: Simular envío exitoso
    alert("🔧 MODO PRUEBA: Código 123456 (simulado)");
    
    const codigo = "123456"; // Código fijo para pruebas
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

        alert("✅ Código guardado en BD. Usa 123456 para verificar.");
        document.getElementById("estadoCodigo").textContent = "📧 Usa código 123456";
    } catch (err) {
        console.error(err);
        alert("Error al guardar código en BD");
    }
};