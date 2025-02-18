const logoPath = "assets/images/Verde_Fundo Branco.png";

// Função para exportar pdf de relatório veiculação inteiro
async function generatePDF(summary, mediaDetails, playerDetails) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    // const logoPath = "assets/images/Verde_Fundo Branco.png";
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
    const selectedClients = getSelectedClients();
    const summaryText = `
Intervalo de Datas: ${startDate} (${startTime}) - ${endDate} (${endTime})
Cliente(s): ${selectedClients}
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
        const mediaName = mediaNames[mediaId] ? mediaNames[mediaId].split("-").slice(1).join("-") : `Mídia ${mediaId}`;
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
            const totalAparicoes = logs.length; // Soma total de aparições dessa mídia nesse painel

            if (yOffset > 280) {
                doc.addPage();
                yOffset = 10;
            }

            doc.setFont("helvetica", "bold");
            doc.text(`${panelName}:`, 15, yOffset);
            doc.setFont("helvetica", "normal");

            yOffset += 7;
            doc.text(`- Total: ${totalAparicoes} aparições`, 20, yOffset);

            yOffset += 7;
        }

        yOffset += 10;
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
            const mediaName = mediaNames[mediaId] ? mediaNames[mediaId].split("-").slice(1).join("-") : `Mídia ${mediaId}`;
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

// Função para exportar relatório de detalhes de exibição mídia por HORÁRIO
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

        const thumbnailUrl = mediaId 
            ? `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`
            : null;

        let yOffset = 20; // Controle do espaço vertical

        // Adicionar logotipo
        try {
            const logoBase64 = await loadImageAsBase64(logoPath);
            doc.addImage(logoBase64, "PNG", 10, 10, 30, 15);
        } catch (error) {
            console.warn("[WARNING] Erro ao carregar o logotipo:", error);
        }

        // Título do relatório
        doc.setFontSize(16);
        doc.text("Relatório de exibição por horário", 50, 15);
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

        const numColumns = 3;
        const columnSpacing = 70 / numColumns;
        const columnStartX = 10;
        let columnX = columnStartX;
        let columnOffset = 0;

        // Lista de horários distribuídos nas colunas
        doc.setFontSize(10);
        times.forEach((time, index) => {
            if (yOffset > 280) {
                doc.addPage();
                yOffset = 20;
                columnX = columnStartX;
                columnOffset = 0;
            }

            doc.text(`${time}`, columnX, yOffset);

            // Mudar para a próxima coluna
            columnOffset++;
            if (columnOffset % numColumns === 0) {
                yOffset += 7;
                columnX = columnStartX;
            } else {
                columnX += columnSpacing * numColumns;
            }
        });

        // Salvar PDF
        const data = new Date();
        const dataFormatada = `${data.getDate()}-${data.getMonth() + 1}-${data.getHours()}-${data.getMinutes()}`;
        const fileName = `relatorio_aparicao_${nomePainel.replace(/ /g, "_")}_${mediaName.replace(/ /g, "_")}_${dataFormatada}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("[ERROR] Falha ao criar o PDF:", error);
    } finally {
        // Ocultar carregamento
        loadingSpinner.style.display = "none";
        button.disabled = false;
    }
}

// Função para exportar relatório de detalhes de exibição mídia por DIA
async function generateDailyPDF(button) {
    const playerId = button.getAttribute("data-player-id");
    const mediaId = button.getAttribute("data-media-id");

    const modal = document.getElementById(`totalAparicoesModal-${playerId}-${mediaId}`);
    if (!modal) {
        console.error("Modal de exportação não encontrado!");
        return;
    }

    // ✅ Corrigir extração do nome do painel e mídia
    const nomePainel = modal.querySelector("#entity-name")?.textContent.trim() || `Painel ${playerId}`;
    const mediaName = mediaId
        ? mediaNames[mediaId] || `Mídia ${mediaId}`
        : "Mídia não identificada";

    const reportDate = new Date().toLocaleString();
    const loadingSpinner = document.getElementById("loading-pdf2");

    // ✅ Buscar lista de aparições correta
    const dailyListElement = document.getElementById(`daily-aparicoes-list-${playerId}-${mediaId}`);
    if (!dailyListElement) {
        console.error("Lista de aparições diárias não encontrada.");
        return;
    }

    // ✅ Corrigir extração das aparições
    const dailyData = Array.from(dailyListElement.querySelectorAll("li")).map((li) => {
        const match = li.innerText.match(/^(\d+) - ([\d-]+):\s+(\d+) aparições/);
        if (match) {
            return { index: match[1], date: match[2], count: match[3] };
        }
        return null;
    }).filter(Boolean);

    try {
        // Exibir o carregamento
        loadingSpinner.style.display = "inline-block";
        button.disabled = true;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const thumbnailUrl = mediaId 
            ? `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`
            : null;

        let yOffset = 20; // Controle do espaço vertical

        // ✅ Adicionar logotipo
        try {
            const logoBase64 = await loadImageAsBase64(logoPath);
            doc.addImage(logoBase64, "PNG", 10, 10, 30, 15);
        } catch (error) {
            console.warn("[WARNING] Erro ao carregar o logotipo:", error);
        }

        // ✅ Título do relatório
        doc.setFontSize(16);
        doc.text("Relatório de exibição por data", 50, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${reportDate}`, 50, 20);
        yOffset = 30;

        // ✅ Adicionar informações do painel e mídia
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

        // ✅ Lista de aparições por data com numeração
        doc.text("Total de Aparições por Data:", 10, yOffset);
        yOffset += 10;
        doc.setFontSize(10);

        if (dailyData.length === 0) {
            doc.text("Nenhuma aparição registrada neste período.", 10, yOffset);
        } else {
            dailyData.forEach(({ index, date, count }) => {
                if (yOffset > 280) {
                    doc.addPage();
                    yOffset = 10;
                }
                doc.text(`${index} - ${date}: ${count} aparições`, 10, yOffset);
                yOffset += 7;
            });
        }

        // ✅ Salvar PDF
        const data = new Date();
        const fileName = `relatorio_diario_${nomePainel.replace(/ /g, "_")}_${mediaName.replace(/ /g, "_")}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("[ERROR] Falha ao criar o PDF:", error);
    } finally {
        // Ocultar carregamento
        loadingSpinner.style.display = "none";
        button.disabled = false;
    }
}

// Função para exportar relatório de checkin 
async function generateCheckinPDF(checkIn) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    let yOffset = 20;
    const marginLeft = 15;
    const pageWidth = doc.internal.pageSize.width - 30;
    const pageHeight = doc.internal.pageSize.height - 20;

    try {
        const logoBase64 = await loadImageAsBase64(logoPath);
        doc.addImage(logoBase64, "PNG", marginLeft, 10, 40, 20);
    } catch (error) {
        console.error("Erro ao carregar o logotipo:", error);
    }

    // **Cabeçalho com bordas**
    doc.setDrawColor(0); // Cor preta
    doc.setLineWidth(0.5);
    doc.rect(marginLeft, 8, pageWidth, 25, "S");

    doc.setFontSize(16);
    doc.text("Relatório de Check-In de Mídias", marginLeft + 50, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, marginLeft + 50, 22);

    // **Seção Informativa**
    yOffset = 40;
    doc.setFont("helvetica", "bold");
    doc.text("Painel:", marginLeft, yOffset);
    doc.setFont("helvetica", "normal");
    doc.text(checkIn.panelName || checkIn.panelId, marginLeft + 30, yOffset);

    doc.setFont("helvetica", "bold");
    doc.text("Data:", marginLeft, yOffset + 7);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(checkIn.createdAt._seconds * 1000).toLocaleString(), marginLeft + 30, yOffset + 7);

    // **Linha de separação**
    yOffset += 12;
    doc.setLineWidth(0.5);
    doc.line(marginLeft, yOffset, pageWidth + marginLeft, yOffset);

    yOffset += 10;
    let mediaIndex = 1;

    for (const media of checkIn.midias) {
        if (yOffset + 120 > pageHeight) {
            doc.addPage();
            yOffset = 20;
        }

        // **Título da Mídia**
        doc.setFont("helvetica", "bold");
        doc.text(`${mediaIndex}) Mídia:`, marginLeft, yOffset);
        doc.setFont("helvetica", "normal");
        doc.text(media.nomeMidia || media.idMidia, marginLeft + 30, yOffset);

        doc.setFont("helvetica", "bold");
        doc.text("Cliente:", marginLeft, yOffset + 7);
        doc.setFont("helvetica", "normal");
        doc.text(media.cliente || "-", marginLeft + 30, yOffset + 7);

        yOffset += 10;

        // **Linha separadora**
        doc.setLineWidth(0.3);
        doc.line(marginLeft, yOffset, pageWidth + marginLeft, yOffset);
        yOffset += 5;

        // **Mídia Esperada**
        if (media.idMidia) {
            const thumbnailUrl = `${API_URL}/proxy?url=${encodeURIComponent(`${THUMB_URL}/i_${media.idMidia}.png`)}`;
            try {
                const base64Thumb = await loadImageAsBase64(thumbnailUrl);
                doc.addImage(base64Thumb, "JPEG", marginLeft, yOffset, 40, 30);
                doc.text("Mídia Esperada", marginLeft, yOffset + 35);
            } catch (error) {
                console.warn("Erro ao carregar thumb:", error);
            }
        }

        yOffset += 40;

        // **Fotos da Mídia**
        if (media.fotosMidia.length > 0) {
            for (const foto of media.fotosMidia) {
                if (yOffset + 80 > pageHeight) {
                    doc.addPage();
                    yOffset = 20;
                }

                try {
                    const mediaUrl = `${API_URL}/proxy?url=${encodeURIComponent(foto.url)}`;
                    const base64Media = await loadImageAsBase64(mediaUrl);
                    doc.addImage(base64Media, "JPEG", marginLeft, yOffset, 80, 60);
                    doc.text(`Foto Mídia - ${new Date(foto.timestamp).toLocaleString()}`, marginLeft, yOffset + 65);
                } catch (error) {
                    console.warn("Erro ao carregar imagem da mídia:", error);
                }

                yOffset += 75;
            }
        }

        // **Fotos do Entorno**
        if (media.fotosEntorno.length > 0) {
            for (const foto of media.fotosEntorno) {
                if (yOffset + 80 > pageHeight) {
                    doc.addPage();
                    yOffset = 20;
                }

                try {
                    const environmentUrl = `${API_URL}/proxy?url=${encodeURIComponent(foto.url)}`;
                    const base64Entorno = await loadImageAsBase64(environmentUrl);
                    doc.addImage(base64Entorno, "JPEG", marginLeft, yOffset, 80, 60);
                    doc.text(`Foto Entorno - ${new Date(foto.timestamp).toLocaleString()}`, marginLeft, yOffset + 65);
                } catch (error) {
                    console.warn("Erro ao carregar imagem do entorno:", error);
                }

                yOffset += 75;
            }
        }

        // **Vídeos**
        if (media.videosMidia.length > 0) {
            for (const video of media.videosMidia) {
                if (yOffset + 10 > pageHeight) {
                    doc.addPage();
                    yOffset = 20;
                }
                doc.text("Vídeo disponível no link:", marginLeft, yOffset);
                doc.setTextColor(0, 0, 255);
                doc.textWithLink(video.url, marginLeft + 50, yOffset, { url: video.url });
                doc.setTextColor(0, 0, 0);
                yOffset += 10;
            }
        }

        // **Linha separadora**
        doc.setLineWidth(0.5);
        doc.line(marginLeft, yOffset, pageWidth + marginLeft, yOffset);
        yOffset += 10;

        mediaIndex++;
    }

    // **Rodapé**
    doc.setLineWidth(0.5);
    doc.line(marginLeft, pageHeight - 10, pageWidth + marginLeft, pageHeight - 10);
    doc.setFontSize(10);
    doc.text("Relatório gerado automaticamente.", marginLeft, pageHeight - 5);

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const hora = String(now.getHours()).padStart(2, '0');
    const minuto = String(now.getMinutes()).padStart(2, '0');

    const fileName = `relatorio_checkin_${checkIn.panelName}_${dia}-${mes}_${hora}-${minuto}.pdf`;
    doc.save(fileName);
}

document.addEventListener("click", async (event) => {
    if (event.target.id === "export-pdf-button") {
        const button = event.target;
        await generateDetailPDF(button);
    }
});

document.addEventListener("click", async (event) => {
    if (event.target.id === "export-daily-pdf-button") {
        const button = event.target;
        await generateDailyPDF(button);
    }
});
