const API_URL_OFICIAL = "https://api.sobremidia.com";

async function sendMailCheckin(mailClient, mailSeller, checkinId, pdfBlob) {
    console.log("📤 [INFO] Convertendo PDF para Base64...");

    // Converte Blob para Base64
    const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onload = () => resolve(reader.result.split(",")[1]); // Remove prefixo `data:application/pdf;base64,`
        reader.onerror = (error) => reject(error);
    });

    const bodyData = {
        mailClient,
        mailSeller,
        report: `
            <h2>Relatório de Check-in</h2>
            <p>Olá,</p>
            <p>O relatório de check-in está anexado a este e-mail.</p>
            <p>Atenciosamente,</p>
            <p>Equipe Sobremídia</p>
        `,
        pdfBase64,
    };

    console.log("📤 [INFO] Enviando PDF como Base64...");

    try {
        const response = await fetch(`${API_URL}/email/checkin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar o email");
        }

        console.log("✅ [INFO] Email enviado com sucesso!");
        alert("Email enviado com sucesso!");
    } catch (error) {
        console.error("❌ [ERROR] Erro ao enviar email:", error);
    }
}

async function sendMailReport(mailClient, mailSeller, reportId) {
    try {
        const response = await fetch(`${API_URL}/email/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mailClient,
                mailSeller,
                reportId
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar o e-mail.");
        }

        console.log("E-mail enviado com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error.message);
    }
}