async function sendMailCheckin(mailClient, mailSeller, checkIn) {
    try {
        const response = await fetch(`${API_URL}/email/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mailClient,
                mailSeller,
                checkIn
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar o e-mail.");
        }

        alert("Dentro de alguns minutos, um e-mail será enviado para o(s) endereço(s) solicitado(s). Por favor, aguarde.")
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error.message);
    }
}

async function sendMailReport(mailClient, mailSeller, reportId) {
    try {
        const clientes = getSelectedClients();
        const reportData = {
            summary: reportSummary,
            mediaDetails: reportMediaDetails,
            playerDetails: reportPlayerDetails,
            startDate,
            endDate,
            startTime,
            endTime,
            clientes,
            mediaNames,
            panelNames
        };

        const response = await fetch(`${API_URL}/email/report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                mailClient,
                mailSeller,
                reportId,
                data: reportData 
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