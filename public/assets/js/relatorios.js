const API_URL_MEDIA = "https://api.4yousee.com.br/v1/medias";
const API_URL_PANELS = "https://api.4yousee.com.br/v1/players";
const API_URL_REPORT = "http://localhost:3000/reports/generate";
//https://us-central1-sobremidia-ce.cloudfunctions.net/api/

document.addEventListener("DOMContentLoaded", async () => {
  await loadFilters();
});

async function loadFilters() {
  const mediaList = document.getElementById("media-list");
  const panelList = document.getElementById("panel-list");

  try {
    // Carregar mídias
    const mediaResponse = await fetch(API_URL_MEDIA, { headers: { "Secret-Token": "67c7c2b91bcb315098bb733c07ce8b90" } });
    const mediaData = await mediaResponse.json();
    const mediaHTML = mediaData.results.map(media => `
      <label class="media-item">
        <input type="checkbox" name="media" value="${media.id}">
        <img src="https://sobremidia.4yousee.com.br/common/videos/thumbnails/i_${media.id}.png" alt="${media.name}">
        <p>${media.name}</p>
      </label>
    `).join("");
    mediaList.innerHTML = mediaHTML;

    // Carregar painéis
    const panelResponse = await fetch(API_URL_PANELS, { headers: { "Secret-Token": "a59202bc005fa4305916bca8aa7e31d0" } });
    const panelData = await panelResponse.json();
    const panelHTML = panelData.results.map(panel => `
      <label class="panel-item">
        <input type="checkbox" name="panel" value="${panel.id}">
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

function setupCheckboxLogic() {
  const allMediaCheckbox = document.getElementById("allMedia");
  const mediaCheckboxes = document.querySelectorAll('input[name="media"]');
  const allPanelsCheckbox = document.getElementById("allPanels");
  const panelCheckboxes = document.querySelectorAll('input[name="panel"]');

  // Lógica para mídias
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

  // Lógica para painéis
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

function setupToggleLogic() {
  const mediaList = document.getElementById("media-list");
  const panelList = document.getElementById("panel-list");
  const toggleMediaButton = document.getElementById("toggle-media");
  const togglePanelButton = document.getElementById("toggle-panels");

  let isMediaExpanded = false;
  let isPanelExpanded = false;

  toggleMediaButton.addEventListener("click", () => {
    isMediaExpanded = !isMediaExpanded;
    toggleItems(mediaList, isMediaExpanded, 5);
    toggleMediaButton.innerHTML = `${isMediaExpanded ? 'Recolher' : 'Expandir'} <span class="toggle-icon">${isMediaExpanded ? '↑' : '↓'}</span>`;
  });

  togglePanelButton.addEventListener("click", () => {
    isPanelExpanded = !isPanelExpanded;
    toggleItems(panelList, isPanelExpanded, 5);
    togglePanelButton.innerHTML = `${isPanelExpanded ? 'Recolher' : 'Expandir'} <span class="toggle-icon">${isPanelExpanded ? '↑' : '↓'}</span>`;
  });

  // Mostrar os 5 primeiros itens por padrão
  toggleItems(mediaList, false, 5);
  toggleItems(panelList, false, 5);
}

function toggleItems(list, expanded, limit) {
  const items = Array.from(list.children);
  items.forEach((item, index) => {
    item.style.display = expanded || index < limit ? "block" : "none";
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

document.getElementById('report-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Obter as mídias e painéis selecionados
    const selectedMedia = Array.from(document.querySelectorAll('input[name="media"]:checked')).map(input => input.value);
    const selectedPanels = Array.from(document.querySelectorAll('input[name="panel"]:checked')).map(input => input.value);

    // Mostrar o spinner de carregamento
    const loadingSpinner = document.getElementById('loading-div');
    const reportResult = document.getElementById('report-result');
    const reportContent = document.getElementById('report-content');
    const buttonGerar = document.getElementById('button-gerar');
    
    toggleButtonState(buttonGerar, true);
    loadingSpinner.style.display = "block";
    reportResult.style.display = "none";

    // Coletar valores do formulário
    const startDate = document.getElementById('startDate').value || null;
    const startTime = document.getElementById('startTime').value || null;
    const endDate = document.getElementById('endDate').value || null;
    const endTime = document.getElementById('endTime').value || null;

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
        console.log(`[INFO] Enviando requisição para o backend... \n\n${JSON.stringify(requestBody)}`);
        const response = await fetch(API_URL_REPORT, {
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
        displayReport(result);
    } catch (error) {
        console.error("[ERROR] Falha ao gerar relatório:", error);

        const errorMessage = error.message || "Erro desconhecido.";
        const userFriendlyMessage = getFriendlyErrorMessage(error.status, errorMessage);

        reportContent.innerHTML = `<p style="color: red;">${userFriendlyMessage}</p>`;
        reportResult.style.display = "block";
    } finally {
        toggleButtonState(buttonGerar, false);
        loadingSpinner.style.display = "none";
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

        const mediaNames = await fetchMediaNames(mediaIds);
        const panelNames = await fetchPanelNames(panelIds);

        const BASE_THUMBNAIL_URL = "https://sobremidia.4yousee.com.br/common/videos/thumbnails/i_";

        // Gerar HTML das mídias
        const mediaHTMLArray = Object.entries(mediaDetails).map(([mediaId, mediaData]) => {
            const { totalExhibitions, players } = mediaData;
            const thumbnailUrl = `${BASE_THUMBNAIL_URL}${mediaId}.png`;
            const mediaName = mediaNames[mediaId] || `Mídia ${mediaId}`;

            return `
                <li class="media-item expandable">
                    <div class="media-summary">
                        <img src="${thumbnailUrl}" alt="${mediaName}" class="media-thumbnail">
                        <div class="media-info">
                            <p>
                                <strong>Nome:</strong> ${mediaName}<br>
                                <strong>Total de Exibições:</strong> ${totalExhibitions}
                            </p>
                        </div>
                    </div>
                    <div class="media-details details">
                        <ul>
                            ${Object.entries(players).map(([playerId, logs]) => `
                                <li>
                                    <strong>Player:</strong> ${panelNames[playerId] || `Painel ${playerId}`}
                                    <ul>
                                        ${logs.map(log => `
                                            <li>${log.date} ${log.time}</li>
                                        `).join("")}
                                    </ul>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                </li>
            `;
        }).join("");

        // Gerar HTML dos painéis
        const panelHTMLArray = Object.entries(playerDetails).map(([playerId, playerData]) => {
            const { totalExhibitions, media } = playerData;
            const panelName = panelNames[playerId] || `Painel ${playerId}`;

            return `
                <li class="panel-item expandable">
                    <div class="panel-summary">
                        <div class="panel-info">
                            <p>
                                <strong>Nome:</strong> ${panelName}<br>
                                <strong>Total de Exibições:</strong> ${totalExhibitions}
                            </p>
                        </div>
                    </div>
                    <div class="panel-details details">
                        <ul>
                            ${Object.entries(media).map(([mediaId, logs]) => `
                                <li>
                                    <strong>Mídia:</strong> ${mediaNames[mediaId] || `Mídia ${mediaId}`}
                                    <ul>
                                        ${logs.map(log => `
                                            <li>${log.date} ${log.time}</li>
                                        `).join("")}
                                    </ul>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                </li>
            `;
        }).join("");

        // Dados do resumo
        const summaryHTML = `
            <div class="summary-info">
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

function showDetailsModal(id, type, mediaDetails, playerDetails) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    let detailsHTML = "";

    if (type === "media") {
        const mediaData = mediaDetails[id];
        detailsHTML = `
            <h4>Detalhes da Mídia ${mediaData.name || id}</h4>
            <ul>
                ${Object.entries(mediaData.players).map(([playerId, logs]) => {
                    const groupedLogs = groupLogsByDate(logs);
                    return `
                        <li>
                            <strong>Player ${playerId}:</strong>
                            <ul>
                                ${Object.entries(groupedLogs).map(([date, times]) => `
                                    <li>
                                        <strong>${date}:</strong>
                                        <ul>
                                            ${times.map(time => `<li>${time}</li>`).join("")}
                                        </ul>
                                    </li>
                                `).join("")}
                            </ul>
                        </li>
                    `;
                }).join("")}
            </ul>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn">Fechar</button>
            ${detailsHTML}
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".close-btn").addEventListener("click", () => {
        modal.remove();
    });
}

let mediaChartInstance = null;

function renderMediaChart(mediaDetails) {
    const ctx = document.getElementById("mediaChart").getContext("2d");

    // Verificar e destruir o gráfico existente, se necessário
    if (mediaChartInstance) {
        mediaChartInstance.destroy();
    }

    const labels = Object.keys(mediaDetails).map(mediaId => `Mídia ${mediaId}`);
    const data = Object.values(mediaDetails).map(media => media.totalExhibitions);

    // Criar um novo gráfico
    mediaChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Exibições por Mídia",
                    data,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

let playerChartInstance = null;

function renderPlayerChart(playerDetails) {
    const ctx = document.getElementById("playerChart").getContext("2d");

    // Verificar e destruir o gráfico existente, se necessário
    if (playerChartInstance) {
        playerChartInstance.destroy();
    }

    const labels = Object.keys(playerDetails).map(playerId => `Player ${playerId}`);
    const data = Object.values(playerDetails).map(player => player.totalExhibitions);

    // Criar um novo gráfico
    playerChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [
                {
                    label: "Exibições por Player",
                    data,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(54, 162, 235, 0.2)",
                        "rgba(255, 206, 86, 0.2)",
                    ],
                    borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(255, 206, 86, 1)",
                    ],
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
        },
    });
}

async function fetchMediaNames(mediaIds) {
    const API_URL = `https://api.4yousee.com.br/v1/medias?id=${mediaIds.join(',')}`;
    try {
        const response = await fetch(API_URL, {headers: { 'Secret-Token': '67c7c2b91bcb315098bb733c07ce8b90' }});
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
    const API_URL = `https://api.4yousee.com.br/v1/players/`;
    try {
        const response = await fetch(API_URL, {headers: { 'Secret-Token': 'a59202bc005fa4305916bca8aa7e31d0' }});
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
