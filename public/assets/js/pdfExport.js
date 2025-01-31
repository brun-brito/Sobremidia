async function generatePDF(summary, mediaDetails, playerDetails) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const logoPath = "assets/images/Verde_Fundo Branco.png";
    const title = "Relatório de Exibições";
    const reportDate = new Date().toLocaleString();
    const data = new Date();
    const fileName = `relatorio_detalhado_${data.getDate()}-${data.getMonth() + 1}-${data.getHours()}-${data.getMinutes()}.pdf`;

    let yOffset = 20; // Controle da posição vertical

    try {
        const logoBase64 = await loadImageAsBase64(logoPath);
        doc.addImage(logoBase64, "PNG", 10, 10, 30, 15);
    } catch (error) {
        console.error("Erro ao carregar a logo:", error);
    }

    doc.setFontSize(16);
    doc.text(title, 50, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${reportDate}`, 50, 20);

    yOffset = 30;

    // Resumo
    const summaryText = `
Intervalo de Datas: ${startDate} (${startTime}) - ${endDate} (${endTime})
Total de Exibições: ${summary.totalExhibitions || 0}
Total de Mídias: ${summary.totalMedia || 0}
Total de Painéis: ${summary.totalPlayers || 0}
    `.trim().split("\n");

    summaryText.forEach((line) => {
        doc.text(line, 10, yOffset);
        yOffset += 7;
        if (yOffset > 280) {
            doc.addPage();
            yOffset = 10;
        }
    });

    yOffset += 5;

    // Exibições por Mídia
    doc.setFontSize(12);
    doc.text("Exibições por Mídia:", 10, yOffset);
    doc.setFontSize(10);
    yOffset += 7;

    for (const [mediaId, mediaData] of Object.entries(mediaDetails)) {
        const mediaName = mediaNames[mediaId] || `Mídia ${mediaId}`;
        const thumbnailUrl = `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`;

        if (yOffset > 250) {
            doc.addPage();
            yOffset = 10;
        }

        try {
            const thumbnailBase64 = await loadImageAsBase64(thumbnailUrl);
            doc.addImage(thumbnailBase64, "JPEG", 10, yOffset, 20, 15);
        } catch (error) {
            console.warn("Erro ao carregar thumbnail da mídia:", mediaId);
        }

        doc.text(`${mediaName}`, 35, yOffset + 10);
        yOffset += 20;

        for (const [playerId, logs] of Object.entries(mediaData.players)) {
            const panelName = panelNames[playerId] || `Painel ${playerId}`;
            doc.setFont("helvetica", "bold");
            doc.text(`${panelName}:`, 15, yOffset);
            doc.setFont("helvetica", "normal");

            for (const [date, appearances] of Object.entries(groupLogsByDate(logs))) {
                yOffset += 7;
                if (yOffset > 280) {
                    doc.addPage();
                    yOffset = 10;
                }
                doc.text(`- ${date}: ${appearances.length} aparições`, 20, yOffset);
            }

            yOffset += 5;
        }
    }

    // Exibições por Painel
    yOffset += 10;
    doc.setFontSize(12);
    doc.text("Exibições por Painel:", 10, yOffset);
    doc.setFontSize(10);
    yOffset += 7;

    for (const [playerId, playerData] of Object.entries(playerDetails)) {
        const panelName = panelNames[playerId] || `Painel ${playerId}`;

        // Verificar espaço antes de adicionar o nome do painel
        if (yOffset + 15 > 280) {
            doc.addPage();
            yOffset = 10;
        }

        // Nome do painel em negrito
        doc.setFont("helvetica", "bold");
        doc.text(`${panelName}`, 10, yOffset);
        doc.setFont("helvetica", "normal");
        yOffset += 10;

        for (const [mediaId, logs] of Object.entries(playerData.media)) {
            const mediaName = mediaNames[mediaId] || `Mídia ${mediaId}`;
            const appearances = logs.length;

            // Verificar espaço antes de adicionar a mídia
            if (yOffset + 7 > 280) {
                doc.addPage();
                yOffset = 10;
            }

            // Nome da mídia e total de aparições ajustados
            const textLine = `- ${mediaName}: ${appearances} aparições`;
            doc.text(textLine, 15, yOffset);

            yOffset += 7; // Espaçamento entre linhas dentro de um painel
        }

        yOffset += 10; // Espaçamento entre diferentes painéis

        // Verificar espaço antes de adicionar o próximo painel
        if (yOffset > 280) {
            doc.addPage();
            yOffset = 10;
        }
    }

    doc.save(fileName);

}

async function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (error) => reject(error);
        img.src = url;
    });
}

document.getElementById("export-pdf").addEventListener("click", async () => {
    if (!reportSummary || !reportMediaDetails || !reportPlayerDetails) {
        alert("Os dados do relatório ainda não estão disponíveis.");
        return;
    }

    const exportButton = document.getElementById("export-pdf");
    const loadingDiv = document.getElementById("loading-pdf");

    try {
        // Desabilitar o botão e mostrar o loading
        exportButton.disabled = true;
        loadingDiv.style.display = "inline-flex";

        // Simula o processo de geração do PDF (chama a função real aqui)
        await generatePDF(reportSummary, reportMediaDetails, reportPlayerDetails);
    } catch (error) {
        console.error("Erro ao gerar o PDF:", error);
        alert("Erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
        // Reativar o botão e esconder o loading
        exportButton.disabled = false;
        loadingDiv.style.display = "none";
    }
});

async function generateDetailPDF(button) {
    const playerId = button.getAttribute("data-player-id");
    const mediaId = button.getAttribute("data-media-id");

    const nomePainel = playerId
        ? panelNames[playerId] || `Painel ${playerId}`
        : "Painel não identificado";

    const mediaName = mediaId
        ? mediaNames[mediaId] || `Mídia ${mediaId}`
        : "Mídia não identificada";

    const date = document.querySelector("#report-date")?.innerText.split(": ")[1] || "Data não encontrada";
    const reportDate = new Date().toLocaleString();
    const times = Array.from(document.querySelectorAll("#timesList ul li")).map(li => li.innerText);

    const loadingSpinner = document.getElementById("loading-pdf2");

    try {
        // Exibir o carregamento
        loadingSpinner.style.display = "inline-block";
        button.disabled = true;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const logoPath = "assets/images/Verde_Fundo Branco.png";
        const thumbnailUrl = mediaId 
            ? `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`
            : null;

        let yOffset = 20; // Espaço após o cabeçalho

        // Adicionar logotipo
        try {
            const logoBase64 = await loadImageAsBase64(logoPath);
            doc.addImage(logoBase64, "PNG", 10, 10, 30, 15);
        } catch (error) {
            console.warn("[WARNING] Erro ao carregar o logotipo:", error);
        }

        // Título do relatório
        doc.setFontSize(16);
        doc.text("Relatório de Aparições", 50, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${reportDate}`, 50, 20);
        yOffset = 30;

        // Adicionar informações do painel e mídia
        doc.setFontSize(12);
        doc.text(`Painel: ${nomePainel}`, 10, yOffset);
        yOffset += 10;

        doc.text(`Mídia:`, 10, yOffset);
        yOffset += 5;

        if (thumbnailUrl) {
            try {
                const thumbnailBase64 = await loadImageAsBase64(thumbnailUrl);
                doc.addImage(thumbnailBase64, "JPEG", 10, yOffset, 20, 15); // Adicionar thumbnail
            } catch (error) {
                console.warn("[WARNING] Erro ao carregar a thumbnail:", error);
            }
        }

        doc.text(`${mediaName}`, 35, yOffset + 10);
        yOffset += 20;

        doc.text(`Data: ${date}`, 10, yOffset);
        yOffset += 10;

        // Lista de horários
        doc.setFontSize(10);
        times.forEach((time) => {
            if (yOffset > 280) {
                doc.addPage();
                yOffset = 10;
            }
            doc.text(`${time}`, 10, yOffset);
            yOffset += 7;
        });

        // Salvar PDF
        const data = new Date();
        const dataMesHora = `${data.getDate()}-${data.getMonth() + 1}-${data.getHours()}-${data.getMinutes()}`;
        const fileName = `relatorio_aparicao_${nomePainel.replace(/ /g, "_")}_${mediaName.replace(/ /g, "_")}_${dataMesHora}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("[ERROR] Falha ao criar o PDF:", error);
    } finally {
        // Ocultar carregamento
        loadingSpinner.style.display = "none";
        button.disabled = false;
    }
}

async function generateCheckinPDF(checkIn) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const logoPath = "assets/images/Verde_Fundo Branco.png";

    let yOffset = 20;

    try {
        const logoBase64 = await loadImageAsBase64(logoPath);
        doc.addImage(logoBase64, "PNG", 10, 10, 40, 20);
    } catch (error) {
        console.error("Erro ao carregar o logotipo:", error);
    }

    doc.setFontSize(16);
    doc.text("Relatório de Check-In de Mídias", 70, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 70, 25);
    yOffset = 40;

    // Informações principais
    doc.setFont("helvetica", "bold");
    doc.text("Painel: ", 10, yOffset);
    doc.setFont("helvetica", "normal");
    doc.text(checkIn.panelName || checkIn.panelId, 30, yOffset);
    
    doc.setFont("helvetica", "bold");
    doc.text("Data: ", 10, yOffset + 7);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(checkIn.createdAt._seconds * 1000).toLocaleString(), 30, yOffset + 7);
    
    yOffset += 15;    

    let mediaIndex = 1;

    for (const photo of checkIn.photos) {
        if (yOffset + 80 > 280) {
            doc.addPage();
            yOffset = 20;
        }
        const indexOffset = String(mediaIndex) == 1 ? 0 : 2 * String(mediaIndex).length; // Adiciona espaço de acordo com o número
        // Índice da mídia
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${mediaIndex})`, 10, yOffset);
        mediaIndex++;

        // Informações da mídia e cliente
        doc.text("Mídia: ", 15 + indexOffset, yOffset);
        doc.setFont("helvetica", "normal");
        doc.text(photo.mediaName || photo.mediaId, 35, yOffset);

        doc.setFont("helvetica", "bold");
        doc.text("Cliente: ", 15 + indexOffset, yOffset + 7);
        doc.setFont("helvetica", "normal");
        doc.text(photo.mediaName ? photo.mediaName.split("-")[0] : "-", 40, yOffset + 7);
        yOffset += 12;

        // Thumb reduzida
        const thumbnailUrl = photo.mediaId 
            ? `${API_URL}/proxy?url=${encodeURIComponent(`${THUMB_URL}/i_${photo.mediaId}.png`)}`
            : null;

        try {
            const base64Thumb = await loadImageAsBase64(thumbnailUrl);
            doc.addImage(base64Thumb, "JPEG", 10, yOffset, 30, 20);
            doc.text("Mídia esperada", 10, yOffset + 25);
        } catch (error) {
            console.warn("Erro ao carregar thumb:", error);
        }

        // Foto da mídia (tamanho maior)
        const mediaUrl = photo.mediaId
            ? `${API_URL}/proxy?url=${encodeURIComponent(photo.mediaUrl)}`
            : null;
        try {
            const base64Media = await loadImageAsBase64(mediaUrl);
            doc.addImage(base64Media, "JPEG", 50, yOffset, 70, 50);
            doc.text(`Foto mídia - ${photo.timestampMedia || "Sem Timestamp"}`, 50, yOffset + 55);
        } catch (error) {
            console.warn("Erro ao carregar imagem da mídia:", error);
        }

        // Foto do entorno (tamanho maior)
        const environmentUrl = photo.mediaId
            ? `${API_URL}/proxy?url=${encodeURIComponent(photo.environmentUrl)}`
            : null;
        try {
            const base64Entorno = await loadImageAsBase64(environmentUrl);
            doc.addImage(base64Entorno, "JPEG", 130, yOffset, 70, 50);
            doc.text(`Foto entorno - ${photo.timestampEnvironment || "Sem Timestamp"}`, 130, yOffset + 55);
        } catch (error) {
            console.warn("Erro ao carregar imagem do entorno:", error);
        }

        yOffset += 70
    }

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');

    const fileName = `relatorio_checkin_${checkIn.panelName}_${dia}-${mes}-${hora}-${minuto}.pdf`;
    doc.save(fileName);
}


document.addEventListener("click", async (event) => {
    if (event.target.id === "export-pdf-button") {
        const button = event.target;
        await generateDetailPDF(button);
    }
});
