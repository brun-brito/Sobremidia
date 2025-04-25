async function gerarRelatorioVeiculacao(filtros) {
  const {
    startDate,
    startTime,
    endDate,
    endTime,
    selectedMedia,
    selectedPanels,
  } = filtros;
  
  const loadingSpinner = document.getElementById("loading-div");
  const reportResult = document.getElementById("report-result");
  const reportContent = document.getElementById("report-content");
  const buttonGerar = document.getElementById("button-gerar");
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);

  if (!startDate || !endDate) {
    alert("As datas de início e fim devem ser preenchidas.");
    return false;
  }

  if (!startTime || !endTime) {
    alert("Os horários de início e fim devem ser preenchidos.");
    return false;
  }

  if (startTime >= endTime) {
    alert(
      "A data e hora de início devem ser menores que a data e hora de fim."
    );
    return false;
  }

  if (diffDays > 30) {
    alert("O intervalo de datas deve ser de no máximo 30 dias.");
    return;
  }

  toggleButtonState(buttonGerar, true);
  loadingSpinner.style.display = "block";
  reportResult.style.display = "none";
  const clientes = getSelectedClients();
  const userEmail = await getUserEmail();

  // Criar o corpo da requisição sem campos vazios
  const requestBody = {
    ...(startDate && { startDate }),
    ...(startTime && { startTime }),
    ...(endDate && { endDate }),
    ...(endTime && { endTime }),
    ...(selectedMedia.length > 0 && { mediaId: selectedMedia.map(Number) }),
    ...(selectedPanels.length > 0 && {
      playerId: selectedPanels.map(Number),
    }),
    ...(clientes !== "Todos"
      ? { clientes: clientes.split(", ") }
      : { clientes: "Todos" }),
    user: userEmail,
  };

  try {
    updateProgress(5, "Criando relatório...");
    // console.log(`[INFO] Enviando requisição para o backend... \n\n${JSON.stringify(requestBody)}`);

    const response = await fetch(`${API_URL}/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        message: errorData.error || "Erro desconhecido ao gerar o relatório.",
      };
    }

    const { reportId } = await response.json();
    selectedReportId = reportId;
    updateProgress(10, "Relatório enviado para processamento...");

    // Agora verifica periodicamente o status
    await checkReportStatus(reportId);

    return reportId;
  } catch (error) {
    console.error("[ERROR] Falha ao gerar relatório:", error);

    const errorMessage = error.message || "Erro desconhecido.";
    const userFriendlyMessage = getFriendlyErrorMessage(
      error.status,
      errorMessage
    );

    reportContent.innerHTML = `<p style="color: red;">${userFriendlyMessage}</p>`;
    reportResult.style.display = "block";
    updateProgress(100, "Erro ao processar o relatório.");
  } finally {
    toggleButtonState(buttonGerar, false);
    setTimeout(() => {
      loadingSpinner.style.display = "none"; // Oculta o spinner após um pequeno intervalo
      updateProgress(0, ""); // Reseta o progresso e mensagem
    }, 1000);
  }
}

async function checkReportStatus(reportId) {
  let attempts = 0;
  const maxAttempts = 60; // Timeout após 5 minutos
  let progress = 15; // Começa em 15%

  while (attempts < maxAttempts) {
    // Ajuste dinâmico do progresso para não ultrapassar 95%
    progress = Math.min(89, progress + Math.floor(Math.random() * 3) + 1); // Incrementa entre 1 e 3%

    updateProgress(progress, "Processando relatório...");

    try {
      const response = await fetch(`${API_URL}/reports/status/${reportId}`);
      const responseData = await response.json();

      if (responseData.status === "FINALIZADO") {
        updateProgress(90, "Relatório pronto! Obtendo dados...");
        return fetchReportResult(reportId);
      }

      if (responseData.status === "FALHA") {
        console.error(
          `[ERROR] Falha ao gerar relatório. ${responseData.message}`
        );

        showError(
          responseData.message ||
            "Erro ao processar o relatório. Tente novamente."
        );
        updateProgress(100, "Erro ao processar o relatório.");
        return;
      }
    } catch (error) {
      console.error("[ERROR] Erro ao verificar status do relatório:", error);
      showError("Erro na comunicação com o servidor. Tente novamente.");
      updateProgress(100, "Erro ao comunicar com o servidor.");
      return;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 2500 + Math.random() * 1000)
    ); // Varia o tempo de espera entre 2.5s e 3.5s
    attempts++;
  }

  console.error("[ERROR] Tempo limite atingido para geração do relatório.");
  showError("Erro: Tempo limite atingido.");
  updateProgress(100, "Erro: Tempo limite atingido.");
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  if (errorDiv) {
    errorDiv.innerHTML = `<p style="color: red; font-weight: bold; margin-top: 5px;">${message}</p>`;
    errorDiv.style.display = "block";

    // Oculta a mensagem após 5 segundos
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 10000);
  }
}

async function fetchReportResult(reportId) {
  try {
    const response = await fetch(`${API_URL}/reports/result/${reportId}`);
    const responseData = await response.json();

    if (!response.ok || !responseData.success) {
      console.error(
        `[ERROR] Erro na resposta da API ao obter relatório. Status: ${response.status}`
      );
      throw new Error(
        responseData.error || "Erro ao obter os dados do relatório."
      );
    }

    updateProgress(90, "Formatando os dados...");
    await displayReport(responseData, reportId);

    updateProgress(100, "Sucesso! Relatório concluído.");
  } catch (error) {
    console.error("[ERROR] Erro ao obter relatório:", error.message);
    showError(error.message || "Erro ao processar o relatório.");
    updateProgress(100, "Erro ao processar o relatório.");
  }
}

function toggleButtonState(button, isDisabled) {
  button.disabled = isDisabled;
  button.style.backgroundColor = isDisabled ? "grey" : "";
  button.style.color = isDisabled ? "#b5b5b5" : "";
  button.style.cursor = isDisabled ? "not-allowed" : "pointer";
}

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

async function displayReport(data, reportId) {
  const reportResult = document.getElementById("report-result");
  const reportContent = document.getElementById("report-content");

  if (!data || !data.success || !data.data) {
    console.error("[ERROR] Dados inválidos para inserção do relatório:", data);
    reportContent.innerHTML = `<p style="color: red;">Erro: Dados do relatório estão vazios ou inválidos.</p>`;
    reportResult.style.display = "block";
    return;
  }

  const { mediaDetails = {}, playerDetails = {}, summary = {} } = data.data;

  if (
    Object.keys(mediaDetails).length === 0 &&
    Object.keys(playerDetails).length === 0
  ) {
    reportContent.innerHTML = `<p>O relatório está vazio. Verifique os filtros aplicados e tente novamente.</p>`;
    reportResult.style.display = "block";
    return;
  }

  try {
    reportContent.innerHTML = `<p>Carregando dados...</p>`;

    const mediaIds = Object.keys(mediaDetails);
    const panelIds = Object.keys(playerDetails);

    mediaNames = await fetchMediaNames(mediaIds);
    panelNames = await fetchPanelNames(panelIds);

    const mediaHTMLArray = Object.entries(mediaDetails)
      .map(([mediaId, mediaData]) => {
        const { totalExhibitions, players } = mediaData;
        const thumbnailUrl = `${BASE_THUMBNAIL_URL}${mediaId}.png`;
        const mediaName = mediaNames[mediaId]
          ? mediaNames[mediaId].includes("-")
            ? mediaNames[mediaId].split("-").slice(1).join("-")
            : mediaNames[mediaId]
          : `Mídia ${mediaId}`;

        return `
                  <li class="media-item">
                      <div class="media-summary">
                          <img src="${thumbnailUrl}" alt="${mediaName}" class="media-thumbnail">
                          <div class="media-info">
                              <strong>Nome: </strong><p id="media-name-${mediaId}">${mediaName}</p>
                              <p><strong>Total de Inserções:</strong> ${totalExhibitions}</p>
                          </div>
                          <button class="details-button" data-media-id="${mediaId}">
                              Ver detalhes <i class="fas fa-chevron-right"></i>
                          </button>
                      </div>
                      <div class="media-details details" style="display: none;">
                          ${Object.entries(players)
                            .map(([playerId, logs]) => {
                              const logsByDate = groupLogsByDate(logs);
                              const totalAparicoes = logs.length;

                              return `
                                  <div class="panel-details">
                                      <p><h3>${
                                        panelNames[playerId] ||
                                        `Painel ${playerId}`
                                      }:</h3></p>
                                      <ul>
                                          <li>
                                              <span>Total:</span> 
                                              <a href="#" class="view-total-link"
                                                data-player-id="${playerId}" 
                                                data-media-id="${mediaId}" 
                                                data-logs='${JSON.stringify(
                                                  logsByDate
                                                )}'>
                                                  ${totalAparicoes} inserções
                                              </a>
                                          </li>
                                      </ul>
                                  </div>
                        <div id="totalMediaAparicoesModal-${playerId}-${mediaId}" class="modal">
                          <div class="modal-content">
                              <span class="close" onclick="document.getElementById('totalMediaAparicoesModal-${playerId}-${mediaId}').style.display='none'">&times;</span>
                              <ul id="daily-aparicoes-list-${playerId}-${mediaId}"></ul>
                          </div>
                      </div>
                          `;
                            })
                            .join("")}
                  </div>
              </li>
          `;
      })
      .join("");

    // Gerar HTML dos painéis
    const panelHTMLArray = Object.entries(playerDetails)
      .map(([playerId, playerData]) => {
        const { totalExhibitions, media } = playerData;
        const panelName = panelNames[playerId] || `Painel ${playerId}`;

        return `
                  <li class="panel-item">
                      <div class="panel-summary">
                          <div class="panel-info">
                              <div class="panel-icon">
                                  <i class="fas fa-tv"></i> <!-- Ícone de player -->
                              </div>
                                <strong>Nome: </strong><p id="panel-name-${playerId}">${panelName}</p>
                                <p><strong>Total de Inserções:</strong> ${totalExhibitions}</p>
                          </div>
                          <button class="details-button" data-player-id="${playerId}">
                              Ver detalhes <i class="fas fa-chevron-right"></i>
                          </button>
                      </div>
                      <div class="panel-details details" style="display: none;">
                        ${Object.entries(media)
                          .map(([mediaId, logs]) => {
                            const logsByDate = groupLogsByDate(logs);
                            const totalAparicoes = logs.length;

                            return `
                            <div class="media-details">
                              <p><strong>${
                                mediaNames[mediaId]
                                  ? mediaNames[mediaId].includes("-")
                                    ? mediaNames[mediaId]
                                        .split("-")
                                        .slice(1)
                                        .join("-")
                                    : mediaNames[mediaId]
                                  : `Mídia ${mediaId}`
                              }:</strong></p>
                              <ul>
                                <li>
                                  <strong>Total:</strong> 
                                  <a href="#" class="view-total-link"
                                    data-player-id="${playerId}" 
                                    data-media-id="${mediaId}" 
                                    data-logs='${JSON.stringify(logsByDate)}'>
                                      ${totalAparicoes} inserções
                                  </a>
                                </li>
                              </ul>
                            </div>
                            <div id="totalPanelAparicoesModal-${playerId}-${mediaId}" class="modal">
                              <div class="modal-content">
                                <span class="close" onclick="document.getElementById('totalPanelAparicoesModal-${playerId}-${mediaId}').style.display='none'">&times;</span>
                               <ul id="daily-aparicoes-list-${playerId}-${mediaId}"></ul>
                            </div>
                          </div>
                            `;
                          })
                          .join("")}
                      </div>
                  </li>
              `;
      })
      .join("");

    const selectedClients = getSelectedClients();
    // Dados do resumo
    const summaryHTML = `
              <div class="summary-info">
                  <p><strong>Intervalo de Datas:</strong> ${formatDate(
                    startDate
                  )} (${startTime}) - ${formatDate(endDate)} (${endTime})</p>
                  <p><strong>Cliente(s):</strong> ${selectedClients}</p>
                  <p><strong>Total de Inserções:</strong> ${
                    summary.totalExhibitions || 0
                  }</p>
                  <p><strong>Total de Mídias:</strong> ${
                    summary.totalMedia || 0
                  }</p>
                  <p><strong>Total de Painéis:</strong> ${
                    summary.totalPlayers || 0
                  }</p>
              </div>
          `;

    // Construir o HTML final
    const reportHTML = `
              <h4>Resumo</h4>
              ${summaryHTML}
              <h4 style="margin-top:12px;">Inserções por Mídia</h4>
              <ul class="media-list">
                  ${mediaHTMLArray}
              </ul>
              <h4 style="margin-top:12px;">Inserções por Painel</h4>
              <ul class="panel-list">
                  ${panelHTMLArray}
              </ul>
          `;

    reportContent.innerHTML = reportHTML;
    reportResult.style.display = "block";

    // Adicionar funcionalidade expansível/recolhível
    document.querySelectorAll(".expandable").forEach((item) => {
      item.addEventListener("click", () => {
        item.classList.toggle("expanded");
      });
    });

    document
      .querySelector(".send-mail-button")
      .addEventListener("click", async () => {
        await sendMail(reportId);
      });

    // Renderizar gráficos
    renderMediaChart(mediaDetails);
    renderPlayerChart(playerDetails);
    reportSummary = summary;
    reportMediaDetails = mediaDetails;
    reportPlayerDetails = playerDetails;
  } catch (error) {
    console.error("[ERROR] Falha ao exibir o relatório:", error);
    reportContent.innerHTML = `<p style="color: red;">Erro ao exibir o relatório. Tente novamente mais tarde.</p>`;
    reportResult.style.display = "block";
  }
}

function groupLogsByDate(logs) {
  return logs.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log.time);
    return acc;
  }, {});
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".details-button");
  if (button) {
    // Verifica se é mídia ou painel
    const mediaItem = button.closest(".media-item");
    const panelItem = button.closest(".panel-item");
    const details = mediaItem
      ? mediaItem.querySelector(".media-details")
      : panelItem.querySelector(".panel-details");
    const buttonIcon = button.querySelector("i");

    if (!details || !buttonIcon) return;

    details.style.display = details.style.display === "none" ? "block" : "none";

    if (details.style.display === "none") {
      buttonIcon.classList.remove("fa-chevron-down");
      buttonIcon.classList.add("fa-chevron-right");
    } else {
      buttonIcon.classList.remove("fa-chevron-right");
      buttonIcon.classList.add("fa-chevron-down");
    }
  }
});

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("view-times-link")) {
    event.preventDefault();

    const times = event.target.dataset.times.split(",").sort();
    const date = event.target.dataset.date;
    const playerId = event.target.dataset.playerId;
    const mediaId = event.target.dataset.mediaId;

    const modal = document.getElementById("timesModal");
    const timesList = document.getElementById("timesList");

    let entityName;
    if (playerId) {
      entityName = panelNames[playerId] || `Painel ${playerId}`;
    } else if (mediaId) {
      entityName = mediaNames[mediaId] || `Mídia ${mediaId}`;
    } else {
      entityName = "Indefinido";
    }

    const activeModal = document.querySelector(
      ".modal[style*='display: flex;']"
    );
    if (activeModal) {
      activeModal.style.display = "none";
      timesModal.dataset.previousModal = activeModal.id;
    }

    timesList.innerHTML = `
          <div>
              <h4 id="entity-name">${entityName}</h4>
              <h4 id="report-date">Data: ${formatDate(date)}</h4>
              <button id="export-pdf-button" class="export-pdf-button" 
                      data-player-id="${playerId || ""}" 
                      data-media-id="${mediaId || ""}">
                  <i class="fas fa-file-pdf"></i> Exportar PDF
              </button>
              <div id="loading-pdf2" class="loading-pdf2" style="display: none;">
                <i class="fas fa-spinner fa-spin"></i> Gerando PDF...
              </div>
              <ul style="display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 12px;">
                  ${times
                    .map((time, index) => `<li>${index + 1} - ${time}</li>`)
                    .join("")}
              </ul>
          </div>
      `;

    modal.style.display = "block";
  }

  if (event.target.classList.contains("view-total-link")) {
    event.preventDefault();

    const logsByDate = JSON.parse(event.target.dataset.logs);
    const playerId = event.target.dataset.playerId || null;
    const mediaId = event.target.dataset.mediaId || null;

    let modal, dailyList, entityName;

    if (playerId && mediaId) {
      modal = document.getElementById(
        `totalPanelAparicoesModal-${playerId}-${mediaId}`
      );
      dailyList = document.getElementById(
        `daily-panel-aparicoes-list-${playerId}-${mediaId}`
      );
      entityName = panelNames[playerId] || `Painel ${playerId}`;
    } else if (mediaId) {
      modal = document.getElementById(
        `totalMediaAparicoesModal-${playerId}-${mediaId}`
      );
      dailyList = document.getElementById(
        `daily-aparicoes-list-${playerId}-${mediaId}`
      );
      entityName = mediaNames[mediaId] || `Mídia ${mediaId}`;
    } else {
      console.error("Nenhuma mídia ou painel encontrado para abrir o modal.");
      return;
    }

    if (!modal) {
      console.error(
        `Modal não encontrado para ${playerId ? "Painel" : "Mídia"} (${
          playerId || mediaId
        }).`
      );
      return;
    }

    if (!dailyList) {
      dailyList = document.createElement("ul");
      dailyList.id = playerId
        ? `daily-panel-aparicoes-list-${playerId}-${mediaId}`
        : `daily-aparicoes-list-${playerId}-${mediaId}`;
      dailyList.style.marginTop = "15px";
      modal.querySelector(".modal-content").appendChild(dailyList);
    }

    dailyList.innerHTML = `
          <div>
              <h4 id="entity-name">${entityName}</h4>
              <h4>Total de Inserções por Data</h4>
              <button id="export-daily-pdf-button-${playerId}-${mediaId}" class="export-daily-pdf-button"
                      data-player-id="${playerId || ""}" 
                      data-media-id="${mediaId || ""}">
                  <i class="fas fa-file-pdf"></i> Exportar PDF
              </button>
              <div id="loading-pdf3" class="loading-pdf3" style="display: none;">
                  <i class="fas fa-spinner fa-spin"></i> Gerando PDF...
              </div>
              <ul id="totalAparicoesModal-${playerId}-${mediaId}" style="margin-top:15px; display: grid; grid-template-columns: 1fr 1fr;">
                  ${Object.entries(logsByDate)
                    .sort(
                      ([dateA], [dateB]) => new Date(dateA) - new Date(dateB)
                    )
                    .map(
                      ([date, times], index) => `                
                      <li style="list-style: none;">
                          ${formatDate(date)}: 
                          <a href="#" class="view-times-link"
                            data-player-id="${playerId || ""}" 
                            data-media-id="${mediaId || ""}" 
                            data-date="${date}" 
                            data-times="${times.join(",")}">
                              ${times.length} inserções
                          </a>
                      </li>
                  `
                    )
                    .join("")}
              </ul>
          </div>
      `;

    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

    document.body.appendChild(modal);
  }
  if (event.target.classList.contains("close")) {
    const modal = event.target.closest(".modal");
    if (modal) {
      modal.style.display = "none";
    }
  }
});

window.addEventListener("click", (event) => {
  const modal = document.getElementById("timesModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

async function sendMail(reportId) {
  let emailInputContainer = document.getElementById("enviar-email");

  if (
    emailInputContainer.style.display === "none" ||
    emailInputContainer.style.display === ""
  ) {
    emailInputContainer.style.display = "block";
  } else {
    emailInputContainer.style.display = "none";
    return;
  }

  const confirmButton = document.getElementById("confirmSendEmail");

  const newConfirmButton = confirmButton.cloneNode(true);
  confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

  newConfirmButton.addEventListener("click", async () => {
    const clientEmail = document.getElementById("clientEmail").value.trim();
    const sellerEmail = document.getElementById("sellerEmail").value.trim();
    const loadingDiv = document.getElementById("loading-mail");

    if (!clientEmail || !sellerEmail) {
      alert("Por favor, preencha ambos os campos de e-mail.");
      return;
    }

    try {
      if (loadingDiv) loadingDiv.style.display = "inline-flex";
      newConfirmButton.disabled = true;

      await sendMailReport(clientEmail, sellerEmail, reportId);

      emailInputContainer.style.display = "none";
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      alert("Erro ao enviar e-mail. Por favor, tente novamente.");
    } finally {
      if (loadingDiv) loadingDiv.style.display = "none";
      newConfirmButton.disabled = false;
    }
  });
}

const getUserEmail = () => {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      resolve(user ? user.email : null);
    });
  });
};
