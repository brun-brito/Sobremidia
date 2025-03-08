const API_URL_OFICIAL = "https://api.sobremidia.com";

async function sendMailCheckin(mailClient, mailSeller, checkinId) {
    try {
        const response = await fetch(`${API_URL}/email/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mailClient,
                mailSeller,
                checkinId
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar o e-mail.");
        }

        alert("E-mail enviado com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error.message);
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

        alert("E-mail enviado com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error.message);
    }
}