const API_URL = 'http://localhost:3000/reports/generate';

document.getElementById('report-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Mostrar o spinner de carregamento
    const loadingSpinner = document.getElementById('loading-spinner');
    const reportResult = document.getElementById('report-result');
    const reportContent = document.getElementById('report-content');
    loadingSpinner.style.display = "block";
    reportResult.style.display = "none";

    // Coletar valores do formulário
    const startDate = document.getElementById('startDate').value || null;
    const startTime = document.getElementById('startTime').value || null;
    const endDate = document.getElementById('endDate').value || null;
    const endTime = document.getElementById('endTime').value || null;
    const mediaId = document.getElementById('mediaId').value.split(',').filter(Boolean).map(Number);
    const playerId = document.getElementById('playerId').value.split(',').filter(Boolean).map(Number);

    // Criar o corpo da requisição sem campos vazios
    const requestBody = {
        ...(startDate && { startDate }),
        ...(startTime && { startTime }),
        ...(endDate && { endDate }),
        ...(endTime && { endTime }),
        ...(mediaId.length > 0 && { mediaId }),
        ...(playerId.length > 0 && { playerId }),
    };

    try {
        console.log(`[INFO] Enviando requisição para o backend... \n\n${JSON.stringify(requestBody)}`);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.warn("[WARN] Erro retornado pela API:", errorData);
            throw {
                status: response.status,
                message: errorData.error || "Erro desconhecido ao gerar o relatório.",
            };
        }

        const result = await response.json();
        console.log("[INFO] Dados do relatório:", result);

        // Exibir os dados processados no DOM
        displayReport(result.data);
    } catch (error) {
        console.error("[ERROR] Falha ao gerar relatório:", error);

        const errorMessage = error.message || "Erro desconhecido.";
        const userFriendlyMessage = getFriendlyErrorMessage(error.status, errorMessage);

        reportContent.innerHTML = `<p style="color: red;">${userFriendlyMessage}</p>`;
        reportResult.style.display = "block";
    } finally {
        loadingSpinner.style.display = "none";
    }
});

/**
 * Função para retornar mensagens amigáveis com base no status HTTP.
 */
function getFriendlyErrorMessage(status, message) {
    switch (status) {
        case 400:
            return "Requisição inválida. Verifique os filtros e tente novamente.";
        case 404:
            return "O relatório foi gerado, mas está vazio. Verifique os filtros aplicados.";
        case 429:
            return "Limite de requisições atingido. Aguarde alguns minutos antes de tentar novamente.";
        case 500:
            return "Erro interno no servidor. Tente novamente mais tarde.";
        default:
            return message || "Erro desconhecido. Tente novamente mais tarde.";
    }
}

/**
 * Função para exibir o relatório no DOM.
 */
function displayReport(data) {
    const reportResult = document.getElementById('report-result');
    const reportContent = document.getElementById('report-content');
    const { mediaCount, panelCount, dateCount } = data;

    const reportHTML = `
        <h4>Exibições por Mídia</h4>
        <ul>
            ${Object.entries(mediaCount).map(([media, count]) => `<li>Mídia ${media}: ${count} exibições</li>`).join('')}
        </ul>
        <h4>Exibições por Painel</h4>
        <ul>
            ${Object.entries(panelCount).map(([panel, count]) => `<li>Painel ${panel}: ${count} exibições</li>`).join('')}
        </ul>
        <h4>Exibições por Data</h4>
        <ul>
            ${Object.entries(dateCount).map(([date, count]) => `<li>${date}: ${count} exibições</li>`).join('')}
        </ul>
    `;

    reportContent.innerHTML = reportHTML;
    reportResult.style.display = "block";
}
