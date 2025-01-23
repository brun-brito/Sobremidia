const API_URL_MEDIA = "https://api.4yousee.com.br/v1/medias";
const API_URL_PANELS = "https://api.4yousee.com.br/v1/players";
const API_URL = "https://2ckh7b03-3000.brs.devtunnels.ms";
// const API_URL = "http://localhost:3000";
// const API_URL = "https://us-central1-sobremidia-ce.cloudfunctions.net/api";
const BASE_THUMBNAIL_URL = "https://s3.amazonaws.com/4yousee-files/sobremidia/common/videos/thumbnails/i_";

let startDate = null;
let startTime = null;
let endDate = null;
let endTime = null;
let mediaNames = null;
let panelNames = null;
let reportSummary = null;
let reportMediaDetails = null;
let reportPlayerDetails = null;

document.addEventListener("DOMContentLoaded", async () => {
  await loadFilters();
});

async function loadFilters() {
    const mediaList = document.getElementById("media-list");
    const panelList = document.getElementById("panel-list");
  
    try {
      // Carregar mídias
      const mediaResponse = await fetch(API_URL_MEDIA, {
        headers: { "Secret-Token": "67c7c2b91bcb315098bb733c07ce8b90" },
      });
      const mediaData = await mediaResponse.json();
  
      // Agrupar mídias por cliente
      const clients = groupMediaByClient(mediaData.results);
  
      // Gerar HTML dos clientes
      const clientHTML = Object.entries(clients).map(([clientName, mediaIds]) => `
        <label class="media-item">
          <input type="checkbox" name="client" value="${mediaIds.join(',')}">
          <p>${clientName}</p>
        </label>
      `).join("");
      mediaList.innerHTML = clientHTML;
  
      // Carregar painéis
      const panelResponse = await fetch(API_URL_PANELS, {
        headers: { "Secret-Token": "a59202bc005fa4305916bca8aa7e31d0" },
      });
      const panelData = await panelResponse.json();
  
      const panelHTML = panelData.results.map(panel => `
        <label class="panel-item">
          <input type="checkbox" name="panel" value="${panel.id}">
          <div class="panel-icon">
            <i class="fas fa-tv"></i> <!-- Ícone de player -->
          </div>
          <p>${panel.name}</p>
        </label>
      `).join("");
      panelList.innerHTML = panelHTML;
  
      setupCheckboxLogic();
      setupToggleLogic();
      setupSearchLogic();
    } catch (error) {
      console.error("[ERROR] Falha ao carregar mídias e painéis:", error);
    }
  }  

function groupMediaByClient(mediaArray) {
    const clients = {};

    mediaArray.forEach(media => {
        const [clientName] = media.name.split("-"); // Extrair cliente antes do primeiro hífen
        if (!clients[clientName]) {
        clients[clientName] = [];
        }
        clients[clientName].push(media.id); // Adicionar ID da mídia ao cliente
    });

    return clients;
}  

function setupCheckboxLogic() { 
  const allMediaCheckbox = document.getElementById("allMedia");
  const allPanelsCheckbox = document.getElementById("allPanels");
  const mediaList = document.getElementById("media-list");
  const panelList = document.getElementById("panel-list");

  // Atualiza a lógica sempre que os checkboxes são carregados
  function updateMediaCheckboxLogic() {
    const mediaCheckboxes = mediaList.querySelectorAll('input[type="checkbox"]');

    // Lógica para selecionar/deselecionar todas as mídias
    allMediaCheckbox.addEventListener("change", () => {
      if (allMediaCheckbox.checked) {
        mediaCheckboxes.forEach(checkbox => checkbox.checked = false);
      }
    });

    mediaCheckboxes.forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        if (Array.from(mediaCheckboxes).some(checkbox => checkbox.checked)) {
          allMediaCheckbox.checked = false;
        } else {
          allMediaCheckbox.checked = true;
        }
      });
    });
  }

  function updatePanelCheckboxLogic() {
    const panelCheckboxes = panelList.querySelectorAll('input[type="checkbox"]');

    // Lógica para selecionar/deselecionar todos os painéis
    allPanelsCheckbox.addEventListener("change", () => {
      if (allPanelsCheckbox.checked) {
        panelCheckboxes.forEach(checkbox => checkbox.checked = false);
      }
    });

    panelCheckboxes.forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        if (Array.from(panelCheckboxes).some(checkbox => checkbox.checked)) {
          allPanelsCheckbox.checked = false;
        } else {
          allPanelsCheckbox.checked = true;
        }
      });
    });
  }

  // Adicionar lógica inicial
  updateMediaCheckboxLogic();
  updatePanelCheckboxLogic();

  // Se as mídias ou painéis forem carregados dinamicamente
  const observer = new MutationObserver(() => {
    updateMediaCheckboxLogic();
    updatePanelCheckboxLogic();
  });

  observer.observe(mediaList, { childList: true, subtree: true });
  observer.observe(panelList, { childList: true, subtree: true });
}

function setupToggleLogic() {
  const mediaList = document.getElementById("media-list");
  const panelList = document.getElementById("panel-list");
  const toggleMediaButton = document.getElementById("toggle-media");
  const togglePanelButton = document.getElementById("toggle-panels");

  let mediaVisibleCount = 5; // Quantidade de mídias visíveis inicialmente
  let panelVisibleCount = 5; // Quantidade de painéis visíveis inicialmente

  // Configuração inicial para exibir 5 primeiros itens
  toggleItems(mediaList, mediaVisibleCount);
  toggleItems(panelList, panelVisibleCount);

  toggleMediaButton.addEventListener("click", () => {
    const totalMediaItems = mediaList.children.length;

    if (mediaVisibleCount < totalMediaItems) {
      mediaVisibleCount += 5; // Incrementar em 5
      toggleItems(mediaList, mediaVisibleCount);
      if (mediaVisibleCount >= totalMediaItems) {
        toggleMediaButton.innerHTML = `Recolher <span class="toggle-icon">↑</span>`;
      }
    } else {
      mediaVisibleCount = 5; // Recolher para 5 itens
      toggleItems(mediaList, mediaVisibleCount);
      toggleMediaButton.innerHTML = `Mostrar mais <span class="toggle-icon">↓</span>`;
    }
  });

  togglePanelButton.addEventListener("click", () => {
    const totalPanelItems = panelList.children.length;

    if (panelVisibleCount < totalPanelItems) {
      panelVisibleCount += 5; // Incrementar em 5
      toggleItems(panelList, panelVisibleCount);
      if (panelVisibleCount >= totalPanelItems) {
        togglePanelButton.innerHTML = `Recolher <span class="toggle-icon">↑</span>`;
      }
    } else {
      panelVisibleCount = 5; // Recolher para 5 itens
      toggleItems(panelList, panelVisibleCount);
      togglePanelButton.innerHTML = `Mostrar mais <span class="toggle-icon">↓</span>`;
    }
  });
}

// Função para exibir itens gradativamente
function toggleItems(list, visibleCount) {
  const items = Array.from(list.children);
  items.forEach((item, index) => {
    item.style.display = index < visibleCount ? "block" : "none";
  });
}

function setupSearchLogic() {
  const mediaSearch = document.getElementById("media-search");
  const panelSearch = document.getElementById("panel-search");

  mediaSearch.addEventListener("input", (event) => filterItems("media-item", event.target.value));
  panelSearch.addEventListener("input", (event) => filterItems("panel-item", event.target.value));
}

function filterItems(className, searchTerm) {
  const items = document.querySelectorAll(`.${className}`);
  const lowerCaseSearch = searchTerm.toLowerCase();
  items.forEach(item => {
    const text = item.querySelector("p").textContent.toLowerCase();
    item.style.display = text.includes(lowerCaseSearch) ? "block" : "none";
  });
}

document.getElementById("report-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  // Obter os clientes e painéis selecionados
  const selectedClients = Array.from(document.querySelectorAll('input[name="client"]:checked')).map(input => input.value);
  const selectedPanels = Array.from(document.querySelectorAll('input[name="panel"]:checked')).map(input => input.value);

  // Concatenar todos os IDs de mídias de clientes selecionados
  const selectedMedia = selectedClients.length
    ? selectedClients.flatMap(clientMediaIds => clientMediaIds.split(","))
    : [];

  // Elementos de carregamento
  const loadingSpinner = document.getElementById("loading-div");
  const progressPercentage = document.getElementById("progress-percentage");
  const progressBar = document.getElementById("progress-bar");
  const progressMessage = document.getElementById("progress-message");
  const reportResult = document.getElementById("report-result");
  const reportContent = document.getElementById("report-content");
  const buttonGerar = document.getElementById("button-gerar");

  function updateProgress(percentage, message) {
      progressPercentage.innerText = `${percentage}%`;
      progressBar.style.width = `${percentage}%`;
      progressMessage.innerText = message;
  }

  toggleButtonState(buttonGerar, true);
  loadingSpinner.style.display = "block";
  reportResult.style.display = "none";

  // Coletar valores do formulário
  startDate = document.getElementById("startDate").value || null;
  startTime = document.getElementById("startTime").value || null;
  endDate = document.getElementById("endDate").value || null;
  endTime = document.getElementById("endTime").value || null;

  // Criar o corpo da requisição sem campos vazios
  const requestBody = {
    ...(startDate && { startDate }),
    ...(startTime && { startTime }),
    ...(endDate && { endDate }),
    ...(endTime && { endTime }),
    ...(selectedMedia.length > 0 && { mediaId: selectedMedia.map(Number) }),
    ...(selectedPanels.length > 0 && { playerId: selectedPanels.map(Number) }),
  };

  try {
    updateProgress(10, "Criando relatório...");
    console.log(`[INFO] Enviando requisição para o backend... \n\n${JSON.stringify(requestBody)}`);

    const response = await fetch(`${API_URL}/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    updateProgress(50, "Organizando dados obtidos...");
    const result = await response.json();
    console.log("[INFO] Dados do relatório:", result);

    updateProgress(70, "Processando os dados...");
    await displayReport(result);

    updateProgress(100, "Sucesso! Relatório concluído.");
  } catch (error) {
    console.error("[ERROR] Falha ao gerar relatório:", error);

    const errorMessage = error.message || "Erro desconhecido.";
    const userFriendlyMessage = getFriendlyErrorMessage(error.status, errorMessage);

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
});

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

async function displayReport(data) {
    const reportResult = document.getElementById("report-result");
    const reportContent = document.getElementById("report-content");

    if (!data || !data.success || !data.data) {
        console.error("[ERROR] Dados inválidos para exibição do relatório:", data);
        reportContent.innerHTML = `<p style="color: red;">Erro: Dados do relatório estão vazios ou inválidos.</p>`;
        reportResult.style.display = "block";
        return;
    }

    const { mediaDetails = {}, playerDetails = {}, summary = {} } = data.data;

    if (Object.keys(mediaDetails).length === 0 && Object.keys(playerDetails).length === 0) {
        console.warn("[WARN] Não há dados de exibição no relatório.");
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

        const mediaHTMLArray = Object.entries(mediaDetails).map(([mediaId, mediaData]) => {
            const { totalExhibitions, players } = mediaData;
            const thumbnailUrl = `${BASE_THUMBNAIL_URL}${mediaId}.png`;
            const mediaName = mediaNames[mediaId]
                ? (mediaNames[mediaId].includes("-")
                    ? mediaNames[mediaId].split("-").slice(1).join("-") // Remove o nome da empresa
                    : mediaNames[mediaId]) // Nome completo caso não tenha hífen
                : `Mídia ${mediaId}`;

                        
              return `
                <li class="media-item">
                    <div class="media-summary">
                        <img src="${thumbnailUrl}" alt="${mediaName}" class="media-thumbnail">
                        <div class="media-info">
                            <strong>Nome: </strong><p id="media-name-${mediaId}">${mediaName}</p>
                            <p><strong>Total de Exibições:</strong> ${totalExhibitions}</p>
                        </div>
                        <button class="details-button" data-media-id="${mediaId}">
                            Ver detalhes <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="media-details details" style="display: none;">
                        ${Object.entries(players).map(([playerId, logs]) => {
                            const logsByDate = groupLogsByDate(logs); // Agrupar logs por data
                            const datesCount = Object.keys(logsByDate).length;
            
                            return `
                                <div class="panel-details">
                                    <p><strong>${panelNames[playerId] || `Painel ${playerId}`}:</strong></p>
                                    <ul>
                                        ${
                                            datesCount > 1 
                                                ? `<li><strong>Total:</strong> ${logs.length} aparições</li>`
                                                : ""
                                        }
                                        ${Object.entries(logsByDate).map(([date, times]) => `
                                            <li>
                                                ${date}: 
                                                <a href="#" class="view-times-link"
                                                  data-player-id="${playerId}" 
                                                  data-media-id="${mediaId}" 
                                                  data-date="${date}" 
                                                  data-times="${times.join(',')}">
                                                    ${times.length} aparições
                                                </a>
                                            </li>
                                        `).join("")}
                                    </ul>
                                </div>
                                <hr>
                            `;
                        }).join("")}
                    </div>
                </li>
            `;
        }).join("");            

        // Gerar HTML dos painéis
        const panelHTMLArray = Object.entries(playerDetails).map(([playerId, playerData]) => {
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
                              <p><strong>Total de Exibições:</strong> ${totalExhibitions}</p>
                        </div>
                        <button class="details-button" data-player-id="${playerId}">
                            Ver detalhes <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="panel-details details" style="display: none;">
                        ${Object.entries(media).map(([mediaId, logs]) => {
                            const logsByDate = groupLogsByDate(logs); // Agrupar logs por data
                            const datesCount = Object.keys(logsByDate).length;

                            return `
                                <div class="media-details">
                                    <p><strong>${mediaNames[mediaId] || `Mídia ${mediaId}`}:</strong></p>
                                    <ul>
                                        ${
                                            datesCount > 1 
                                                ? `<li><strong>Total:</strong> ${logs.length} aparições</li>`
                                                : ""
                                        }
                                        ${Object.entries(logsByDate).map(([date, times]) => `
                                            <li>
                                                ${date}: 
                                                <a href="#" class="view-times-link" 
                                                  data-player-id="${playerId}" 
                                                  data-media-id="${mediaId}" 
                                                  data-date="${date}" 
                                                  data-times="${times.join(',')}">
                                                    ${times.length} aparições
                                                </a>
                                            </li>
                                        `).join("")}
                                    </ul>
                                </div>
                                <hr>
                            `;
                        }).join("")}
                    </div>
                </li>
            `;
        }).join("");

        // Dados do resumo
        const summaryHTML = `
            <div class="summary-info">
                <p><strong>Intervalo de Datas:</strong> ${startDate} (${startTime}) - ${endDate} (${endTime})</p>
                <p><strong>Total de Exibições:</strong> ${summary.totalExhibitions || 0}</p>
                <p><strong>Total de Mídias:</strong> ${summary.totalMedia || 0}</p>
                <p><strong>Total de Painéis:</strong> ${summary.totalPlayers || 0}</p>
            </div>
        `;

        // Construir o HTML final
        const reportHTML = `
            <h4>Resumo</h4>
            ${summaryHTML}
            <h4>Exibições por Mídia</h4>
            <ul class="media-list">
                ${mediaHTMLArray}
            </ul>
            <h4>Exibições por Painel</h4>
            <ul class="panel-list">
                ${panelHTMLArray}
            </ul>
        `;

        reportContent.innerHTML = reportHTML;
        reportResult.style.display = "block";

        // Adicionar funcionalidade expansível/recolhível
        document.querySelectorAll(".expandable").forEach(item => {
            item.addEventListener("click", () => {
                item.classList.toggle("expanded");
            });
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

      const times = event.target.dataset.times.split(",").sort(); // Ordenar os horários
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

      // Adiciona os horários enumerados no modal com o botão de exportação
      timesList.innerHTML = `
        <div>
            <h4 id="entity-name">${entityName}</h4>
            <h4 id="report-date">Data: ${date}</h4>
            <button id="export-pdf-button" class="export-pdf-button" 
                    data-player-id="${playerId || ''}" 
                    data-media-id="${mediaId || ''}">
                <i class="fas fa-file-pdf"></i> Exportar PDF
            </button>
            <div id="loading-pdf2" class="loading-pdf2" style="display: none;">
              <i class="fas fa-spinner fa-spin"></i> Gerando PDF...
            </div>
            <ul>
                ${times.map((time, index) => `<li>${index + 1} - ${time}</li>`).join("")}
            </ul>
        </div>
    `;

      // Mostra o modal
      modal.style.display = "block";
  }

  // Fecha o modal ao clicar no "X"
  if (event.target.id === "closeModal") {
      const modal = document.getElementById("timesModal");
      modal.style.display = "none";
  }
});

window.addEventListener("click", (event) => {
    const modal = document.getElementById("timesModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

async function fetchMediaNames(mediaIds) {
    try {
        const response = await fetch(`${API_URL_MEDIA}?id=${mediaIds.join(',')}`, {headers: { 'Secret-Token': '67c7c2b91bcb315098bb733c07ce8b90' }});
        if (!response.ok) throw new Error("Erro ao buscar nomes das mídias.");
        const data = await response.json();

        const mediaNames = {};
        data.results.forEach(media => {
            mediaNames[media.id] = media.name;
        });

        return mediaNames;
    } catch (error) {
        console.error("[ERROR] Falha ao buscar nomes das mídias:", error);
        return {};
    }
}

async function fetchPanelNames(panelIds) {
    try {
        const response = await fetch(API_URL_PANELS, {headers: { 'Secret-Token': 'a59202bc005fa4305916bca8aa7e31d0' }});
        if (!response.ok) throw new Error("Erro ao buscar nomes dos painéis.");
        const data = await response.json();

        const panelNames = {};
        data.results.forEach(panel => {
            if (panelIds.includes(String(panel.id))) {
                panelNames[panel.id] = panel.name;
            }
        });

        return panelNames;
    } catch (error) {
        console.error("[ERROR] Falha ao buscar nomes dos painéis:", error);
        return {};
    }
}

document.querySelectorAll(".expandable").forEach(item => {
    item.addEventListener("click", () => {
        item.classList.toggle("expanded");
    });
});

