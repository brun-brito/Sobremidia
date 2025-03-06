const logoPath = "assets/images/Verde_Fundo Branco.png";
const headerPath = "assets/images/Arquivos Timbrado/fotoHeader.png";
const footerPath = "assets/images/Arquivos Timbrado/fotoFooter.png";
const pageWidth = 210;
const pageHeight = 297;
const headerHeight = 130;
const footerHeight = 150;
const contentStartY = headerHeight - 100;
const contentEndY = pageHeight - (footerHeight - 100);
let headerBase64;
let footerBase64;

// Função para exportar pdf de relatório veiculação inteiro
async function generatePDF(summary, mediaDetails, playerDetails) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });
    const reportDate = new Date().toLocaleString();
    const data = new Date();
    const clientes = getSelectedClients();
    const fileName = `relatorio_completo-${clientes}_${data.getDate()}-${data.getMonth() + 1}.pdf`;

    let yOffset = contentStartY + 10;

    try {
        headerBase64 = await loadImageAsBase64(headerPath);
        footerBase64 = await loadImageAsBase64(footerPath);
        addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
    } catch (error) {
        console.error("Erro ao carregar a foto:", error);
    }

    doc.setFontSize(16);
    doc.text("Relatório de Inserções", 10, yOffset);
    yOffset += 7;    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${reportDate}`, 10, yOffset);
    yOffset += 7;

    // Linha de separação do cabeçalho
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, yOffset, pageWidth - 10, yOffset);
    yOffset += 7;

    // Resumo
    doc.setFontSize(12);
    const summaryText = `
Intervalo de Datas: ${formatDate(startDate)} (${startTime}) - ${formatDate(endDate)} (${endTime})
Cliente(s): ${clientes}
Total de Inserções: ${summary.totalExhibitions || 0}
Total de Mídias: ${summary.totalMedia || 0}
Total de Painéis: ${summary.totalPlayers || 0}
    `.trim().split("\n");

    summaryText.forEach((line) => {
        if (yOffset > contentEndY - 10) {
            doc.addPage();
            addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
            yOffset = contentStartY + 10;
        }
        doc.text(line, 10, yOffset);
        yOffset += 7;
    });

    // Linha de separação antes de "Inserções por Mídia"
    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.line(10, yOffset, pageWidth - 10, yOffset);
    yOffset += 7;
    doc.setDrawColor(0);

    // Inserções por Mídia
    doc.setFillColor(230, 230, 230);
    doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Inserções por Mídia", pageWidth / 2, yOffset, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    yOffset += 7;

    for (const [mediaId, mediaData] of Object.entries(mediaDetails)) {
        const mediaName = mediaNames[mediaId] ? mediaNames[mediaId].split("-").slice(1).join("-") : `Mídia ${mediaId}`;
        const thumbnailUrl = `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`;

        if (yOffset > contentEndY - 20) {
            doc.addPage();
            addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
            yOffset = contentStartY + 10;
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
            const totalAparicoes = logs.length;

            if (yOffset > contentEndY - 10) {
                doc.addPage();
                addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                yOffset = contentStartY + 10;
            }

            doc.setFont("helvetica", "bold");
            doc.text(`${panelName}:`, 15, yOffset);
            doc.setFont("helvetica", "normal");

            yOffset += 7;
            doc.text(`- Total: ${totalAparicoes} inserções`, 20, yOffset);

            yOffset += 7;
        }
        yOffset += 10;
    }

    doc.addPage();
    addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
    yOffset = contentStartY + 10;
    
    // Inserções por Painel
    doc.setFillColor(230, 230, 230);
    doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Inserções por Painel", pageWidth / 2, yOffset, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    yOffset += 10;

    for (const [playerId, playerData] of Object.entries(playerDetails)) {
        const panelName = panelNames[playerId] || `Painel ${playerId}`;

        if (yOffset > contentEndY - 15) {
            doc.addPage();
            addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
            yOffset = contentStartY + 10;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`${panelName}`, 10, yOffset);
        doc.setFont("helvetica", "normal");
        yOffset += 10;

        for (const [mediaId, logs] of Object.entries(playerData.media)) {
            const mediaName = mediaNames[mediaId] ? mediaNames[mediaId].split("-").slice(1).join("-") : `Mídia ${mediaId}`;
            const appearances = logs.length;

            if (yOffset > contentEndY - 7) {
                doc.addPage();
                addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                yOffset = contentStartY + 10;
            }

            const textLine = `- ${mediaName}: ${appearances} inserções`;
            doc.text(textLine, 15, yOffset);

            yOffset += 7;
        }

        yOffset += 10;

    }

    doc.save(fileName);

}

// Função para exportar relatório de detalhes de inserção mídia por HORÁRIO
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
        loadingSpinner.style.display = "inline-block";
        button.disabled = true;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const pageWidth = 210;
        const pageHeight = 297;
        const headerHeight = 130;
        const footerHeight = 150;
        let headerBase64;
        let footerBase64;
        const contentStartY = headerHeight - 100;
        const contentEndY = pageHeight - (footerHeight - 100);
        let yOffset = contentStartY + 10;

        try {
            headerBase64 = await loadImageAsBase64(headerPath);
            footerBase64 = await loadImageAsBase64(footerPath);
            addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
        } catch (error) {
            console.error("Erro ao carregar a foto:", error);
        }

        doc.setFontSize(16);
        doc.text("Relatório de Inserções por Horário", 10, yOffset);
        yOffset += 7;
        doc.setFontSize(10);
        doc.text(`Gerado em: ${reportDate}`, 10, yOffset);
        yOffset += 7;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(10, yOffset, pageWidth - 10, yOffset);
        yOffset += 7;

        doc.setFontSize(12);
        doc.text(`Painel: ${nomePainel}`, 15, yOffset + 7);
        doc.text(`Mídia: ${mediaName}`, 15, yOffset + 14);
        doc.text(`Data: ${formatDate(date)}`, 15, yOffset + 21);
        yOffset += 20;

        const thumbnailUrl = mediaId 
            ? `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`
            : null;

        if (thumbnailUrl) {
            try {
                const thumbnailBase64 = await loadImageAsBase64(thumbnailUrl);
                doc.addImage(thumbnailBase64, "JPEG", pageWidth - 50, yOffset - 20, 30, 20);
            } catch (error) {
                console.warn("[WARNING] Erro ao carregar a thumbnail:", error);
            }
        }

        yOffset += 10;

        doc.setDrawColor(180);
        doc.setLineWidth(0.5);
        doc.line(10, yOffset, pageWidth - 10, yOffset);
        yOffset += 7;
        doc.setDrawColor(0);

        doc.setFillColor(230, 230, 230);
        doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Horários das inserções", pageWidth / 2, yOffset, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yOffset += 12;

        const numColumns = 3;
        const columnSpacing = (pageWidth - 20) / numColumns;
        let columnX = 10;
        let columnOffset = 0;

        times.forEach((time) => {
            const [index, valor] = time.split(' - ');
            if (yOffset > contentEndY - 10) {
                doc.addPage();
                addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                yOffset = contentStartY + 10;
                columnX = 10;
                columnOffset = 0;
            }

            doc.setFont("helvetica", "bold");
            doc.text(`${index} -`, columnX, yOffset);
            doc.setFont("helvetica", "normal");
            doc.text(`${valor}`, columnX + 10, yOffset);

            columnOffset++;
            if (columnOffset % numColumns === 0) {
                yOffset += 7;
                columnX = 10;
            } else {
                columnX += columnSpacing;
            }
        });

        const data = new Date();
        const dataFormatada = `${data.getDate()}-${data.getMonth() + 1}`;
        const clientes = getSelectedClients();
        const fileName = `relatorio_horario-${clientes}_${dataFormatada}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("[ERROR] Falha ao criar o PDF:", error);
    } finally {
        loadingSpinner.style.display = "none";
        button.disabled = false;
    }
}

// Função para exportar relatório de detalhes de inserção mídia por DIA
async function generateDailyPDF(button) {
    const playerId = button.getAttribute("data-player-id");
    const mediaId = button.getAttribute("data-media-id");

    const modal = document.getElementById(`totalAparicoesModal-${playerId}-${mediaId}`);
    if (!modal) {
        console.error("Modal de exportação não encontrado!");
        return;
    }

    const nomePainel = playerId
        ? panelNames[playerId] || `Painel ${playerId}`
        : "Painel não identificado";

    const mediaName = mediaId
        ? mediaNames[mediaId].split("-").slice(1).join("-") || `Mídia ${mediaId}`
        : "Mídia não identificada";

    const reportDate = new Date().toLocaleString();
    const loadingSpinner = document.getElementById("loading-pdf3");

    const dailyListElement = document.getElementById(`totalAparicoesModal-${playerId}-${mediaId}`);
    if (!dailyListElement) {
        console.error("Lista de inserções diárias não encontrada.");
        return;
    }

    const dailyData = Array.from(dailyListElement.querySelectorAll("li")).map((li) => {
        const text = li.innerText.trim();
        const match = text.match(/^([\d\/]+):\s*(\d+)\s*inserções/);
    
        if (match) {
            return {
                date: match[1],  
                count: match[2]  
            };
        }
        return null;
    }).filter(Boolean);

    try {
        loadingSpinner.style.display = "inline-block";
        button.disabled = true;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        let yOffset = contentStartY + 10;

        try {
            headerBase64 = await loadImageAsBase64(headerPath);
            footerBase64 = await loadImageAsBase64(footerPath);
            addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
        } catch (error) {
            console.error("Erro ao carregar a foto:", error);
        }

        doc.setFontSize(16);
        doc.text("Relatório de Inserções por Data", 10, yOffset);
        yOffset += 7;
        doc.setFontSize(10);
        doc.text(`Gerado em: ${reportDate}`, 10, yOffset);
        yOffset += 7;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(10, yOffset, pageWidth - 10, yOffset);
        yOffset += 7;

        doc.setFontSize(12);
        doc.text(`Painel: ${nomePainel}`, 15, yOffset + 7);
        doc.text(`Mídia: ${mediaName}`, 15, yOffset + 14);
        doc.text(`Intervalo de Datas: ${formatDate(startDate)} - ${formatDate(endDate)}`, 15, yOffset + 21);
        yOffset += 20;

        // Adicionando Thumbnail da Mídia dentro do resumo
        const thumbnailUrl = mediaId 
            ? `${API_URL}/proxy?url=${encodeURIComponent(`${BASE_THUMBNAIL_URL}${mediaId}.png`)}`
            : null;

        if (thumbnailUrl) {
            try {
                const thumbnailBase64 = await loadImageAsBase64(thumbnailUrl);
                doc.addImage(thumbnailBase64, "JPEG", pageWidth - 50, yOffset - 20, 30, 20);
            } catch (error) {
                console.warn("[WARNING] Erro ao carregar a thumbnail:", error);
            }
        }

        yOffset += 10;

        // Linha de separação entre resumo e conteúdo principal
        doc.setDrawColor(180);
        doc.setLineWidth(0.5);
        doc.line(10, yOffset, pageWidth - 10, yOffset);
        yOffset += 7;
        doc.setDrawColor(0);

        // Adicionando título do conteúdo principal
        doc.setFillColor(230, 230, 230);
        doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Total de Inserções por Data", pageWidth / 2, yOffset, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yOffset += 12;

        if (dailyData.length === 0) {
            doc.text("Nenhuma Inserção registrada neste período.", 10, yOffset);
        } else {
            let colX = 10;
            let rowY = yOffset;
            dailyData.forEach(({ date, count }, index) => {
                if (rowY > contentEndY - 10) {
                    doc.addPage();
                    addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                    rowY = contentStartY + 10;
                    colX = 10;
                }
                
                doc.setFont("helvetica", "bold");
                doc.text(`${date}:`, colX, rowY);
                doc.setFont("helvetica", "normal");
                doc.text(`${count} inserções`, colX + 20, rowY);

                if (index % 2 === 0) {
                    colX = pageWidth / 2 + 5;
                } else {
                    colX = 10;
                    rowY += 7;
                }
            });
        }

        const clientes = getSelectedClients();
        const data = new Date();
        const fileName = `relatorio_diario-${clientes}_${data.getDate()}-${data.getMonth() + 1}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("[ERROR] Falha ao criar o PDF:", error);
    } finally {
        loadingSpinner.style.display = "none";
        button.disabled = false;
    }
}

// Função para exportar relatório de checkin 
async function generateCheckinPDF(checkIn, returnBlob) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    let yOffset = contentStartY + 10;
    const imgWidth = 80;
    const imgHeight = 60;
    const colSpacing = 10;
    const startX = 15;
    let column = 0;

    try {
        headerBase64 = await loadImageAsBase64(headerPath);
        footerBase64 = await loadImageAsBase64(footerPath);
        addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
    } catch (error) {
        console.error("Erro ao carregar a foto:", error);
    }

    doc.setFontSize(16);
    doc.text("Relatório de Check-In de Mídias", 10, yOffset);
    yOffset += 7;
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 10, yOffset);
    yOffset += 7;

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, yOffset, pageWidth - 10, yOffset);
    yOffset += 7;

    doc.setFontSize(12);
    doc.text(`Painel: ${checkIn.panelName}`, 15, yOffset);
    yOffset += 7;
    doc.text(`Data: ${new Date(checkIn.createdAt._seconds * 1000).toLocaleString()}`, 15, yOffset);
    yOffset += 7;
    doc.text(`Mídia: ${checkIn.midias[0].nomeMidia || checkIn.midias[0].idMidia}`, 15, yOffset);
    yOffset += 7;
    doc.text(`Cliente: ${checkIn.midias[0].cliente || "-"}`, 15, yOffset);
    yOffset += 8;

    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.line(10, yOffset, pageWidth - 10, yOffset);
    yOffset += 7;
    doc.setDrawColor(0);

    const media = checkIn.midias[0];

    // Preview da Mídia
    doc.setFillColor(230, 230, 230);
    doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Preview da Mídia", pageWidth / 2, yOffset, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    yOffset += 12;
    column = 0;

    if (media.idMidia) {
        const thumbnailUrl = `${API_URL}/proxy?url=${encodeURIComponent(`${THUMB_URL}/i_${media.idMidia}.png`)}`;
        try {
            const base64Thumb = await loadImageAsBase64(thumbnailUrl);
            doc.addImage(base64Thumb, "JPEG", 15, yOffset, 40, 30);
        } catch (error) {
            console.warn("Erro ao carregar thumb:", error);
        }
    }
    yOffset += 40;

    // Fotos da Mídia
    if (media.fotosMidia.length > 0) {
        doc.setFillColor(230, 230, 230);
        doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Fotos da Mídia", pageWidth / 2, yOffset, { align: "center" });
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yOffset += 12;
        let index = 1;

        for (const foto of media.fotosMidia) {
            if (yOffset + imgHeight > contentEndY) {
                doc.addPage();
                addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                yOffset = contentStartY + 10;
                column = 0;
            }

            const xPosition = startX + (column * (imgWidth + colSpacing));

            try {
                const mediaUrl = `${API_URL}/proxy?url=${encodeURIComponent(foto.url)}`;
                const base64Media = await loadImageAsBase64(mediaUrl);
                doc.setFontSize(12);
                doc.text(`${index})`, xPosition - 3, yOffset + 3);
                doc.addImage(base64Media, "JPEG", xPosition + 5, yOffset, imgWidth, imgHeight);
                doc.setFontSize(10);
                doc.text(`Tirada em: ${new Date(foto.timestamp).toLocaleString()}`, xPosition + 5, yOffset + imgHeight + 5);
            } catch (error) {
                console.warn("Erro ao carregar imagem da mídia:", error);
            }

            column++;
            index++;

            if (column >= 2) {
                column = 0;
                yOffset += imgHeight + 20;
            }
        }
    }

    // Fotos Entorno
    if (media.fotosEntorno.length > 0) {
        doc.addPage();
        addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
        yOffset = contentStartY + 10;
        doc.setFillColor(230, 230, 230);
        doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Fotos do Entorno", pageWidth / 2, yOffset, { align: "center" });
        doc.setFont("helvetica", "normal");
        yOffset += 12;
        column = 0;
        index = 1;

        for (const foto of media.fotosEntorno) {
            if (yOffset + 80 > contentEndY) {
                doc.addPage();
                addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                yOffset = contentStartY + 10;
                column = 0;
            }

            const xPosition = startX + (column * (imgWidth + colSpacing));

            try {
                const entornoUrl = `${API_URL}/proxy?url=${encodeURIComponent(foto.url)}`;
                const base64Entorno = await loadImageAsBase64(entornoUrl);
                doc.setFontSize(12);
                doc.text(`${index})`, xPosition - 3, yOffset + 3);
                doc.addImage(base64Entorno, "JPEG", xPosition + 5, yOffset, imgWidth, imgHeight);
                doc.setFontSize(10);
                doc.text(`Tirada em: ${new Date(foto.timestamp).toLocaleString()}`, xPosition + 5, yOffset + imgHeight + 5);
            } catch (error) {
                console.warn("Erro ao carregar imagem do entorno:", error);
            }
            column++;
            index++;

            if (column >= 2) {
                column = 0;
                yOffset += imgHeight + 20;
            }
        }
    }

    // Links Vídeos
    if (media.videosMidia.length > 0) {
        doc.addPage();
        addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
        yOffset = contentStartY + 10;
        doc.setFillColor(230, 230, 230);
        doc.rect(10, yOffset - 5, pageWidth - 20, 10, "F");
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Links dos Vídeos", pageWidth / 2, yOffset, { align: "center" });
        doc.setFont("helvetica", "normal");
        yOffset += 12;
        const maxLineWidth = pageWidth - 30;
        index = 1;

        for (const video of media.videosMidia) {
            if (yOffset + 15 > contentEndY) {
                doc.addPage();
                addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY);
                yOffset = contentStartY + 10;
            }
    
            // Divide o link em várias linhas se for muito longo
            const wrappedText = doc.splitTextToSize(video.url, maxLineWidth);
            doc.setFontSize(12);
            doc.text(`${index})`, 10, yOffset + 1);
            doc.setFontSize(10);
    
            doc.setTextColor(0, 0, 255);
            wrappedText.forEach((line, index) => {
                doc.textWithLink(line, 15, yOffset + (index * 5), { url: video.url });
            });
            doc.setTextColor(0, 0, 0);
    
            yOffset += (wrappedText.length * 5);
            doc.text(`Gravado em: ${new Date(video.timestamp).toLocaleString()}`, 15, yOffset);
    
            yOffset += 10;
            index++;
        }
    }

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');

    const fileName = `relatorio_checkin-${checkIn.midias[0].cliente}_${dia}-${mes}.pdf`;
    
    if (returnBlob) {
        return new Promise((resolve, reject) => {
            try {
                const pdfBlob = doc.output("blob");
                resolve(pdfBlob);
            } catch (error) {
                reject(error);
            }
        });
    } else {
        doc.save(fileName);
    }
}

// Função para adicionar imagens e bordas nas páginas 
function addHeaderAndFooter(doc, headerBase64, pageWidth, headerHeight, footerBase64, footerHeight, contentStartY, contentEndY ) {
    // imagem header
    doc.addImage(headerBase64, "PNG", -14, -49, pageWidth, headerHeight);
    // imagem footer
    doc.addImage(footerBase64, "PNG", -17, 217, 232, footerHeight);
    doc.setLineWidth(0.3);
    // margem
    doc.rect(5, contentStartY, pageWidth - 10, contentEndY);
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

document.addEventListener("click", async (event) => {
    if (event.target.id === "export-pdf-button") {
        const button = event.target;
        await generateDetailPDF(button);
    }
});

document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("export-daily-pdf-button")) {
        const button = event.target;
        await generateDailyPDF(button);
    }
});

const exportButton = document.getElementById("export-pdf");

if (exportButton) {
    exportButton.addEventListener("click", async () => {
        if (!reportSummary || !reportMediaDetails || !reportPlayerDetails) {
            alert("Os dados do relatório ainda não estão disponíveis.");
            return;
        }

        const loadingDiv = document.getElementById("loading-pdf");

        try {
            exportButton.disabled = true;
            loadingDiv.style.display = "inline-flex";

            await generatePDF(reportSummary, reportMediaDetails, reportPlayerDetails);
        } catch (error) {
            console.error("Erro ao gerar o PDF:", error);
            alert("Erro ao gerar o PDF. Por favor, tente novamente.");
        } finally {
            exportButton.disabled = false;
            loadingDiv.style.display = "none";
        }
    });
}
