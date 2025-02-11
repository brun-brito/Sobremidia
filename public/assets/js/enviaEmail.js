async function sendMailReport(mailClient, mailSeller, htmlContent) {
    try {
        const response = await fetch(`${API_URL}/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mailClient: mailClient,
                mailSeller: mailSeller,
                report: htmlContent
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
