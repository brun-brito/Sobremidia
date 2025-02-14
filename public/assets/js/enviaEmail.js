async function sendMailReport(mailClient, mailSeller, checkinId) {
    try {
        const response = await fetch(`${API_URL}/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mailClient: mailClient,
                mailSeller: mailSeller,
                report: `
                    <h2>Relatório de Check-in</h2>
                    <p>Olá,</p>
                    <p>O relatório de check-in está disponível para visualização. Acesse através do link abaixo:</p>
                    <p><a href="${API_URL}/checkin/html/${checkinId}" target="_blank" style="font-size:16px; font-weight:bold; color:#0056b3;">
                        Visualizar Check-in</a></p>
                    <p>Atenciosamente,</p>
                    <p>Equipe Sobremídia</p>
                `,
            })
        });

        if (!response.ok) {
            throw new Error("Erro ao enviar o email");
        }

        alert('Email enviado com sucesso!');
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}
