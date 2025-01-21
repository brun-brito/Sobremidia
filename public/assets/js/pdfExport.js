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
        const thumbnailUrl = `https://2ckh7b03-3000.brs.devtunnels.ms/proxy?url=${encodeURIComponent(`https://s3.amazonaws.com/4yousee-files/sobremidia/common/videos/thumbnails/i_${mediaId}.png`)}`;

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
