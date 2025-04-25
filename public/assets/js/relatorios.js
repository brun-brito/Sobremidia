const API_URL_MEDIA = "https://api.4yousee.com.br/v1/medias";
const API_URL_PANELS = "https://api.4yousee.com.br/v1/players";
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
let selectedReportId;

document.addEventListener("DOMContentLoaded", async () => {
  await loadFilters();
});

async function loadFilters() {
  const mediaList = document.getElementById("media-list");
  const panelList = document.getElementById("panel-list");
  const toggleMediaButton = document.getElementById("toggle-media");
  const togglePanelButton = document.getElementById("toggle-panels");
  toggleMediaButton.style.display = "block";
  togglePanelButton.style.display = "block";

  // Exibir mensagens de carregamento enquanto busca os dados
  mediaList.innerHTML = 
    `<div class="loading-container">
      <div class="spinner"></div>
      <p>Carregando clientes...</p>
    </div>`;

  panelList.innerHTML = 
    `<div class="loading-container">
      <div class="spinner"></div>
      <p>Carregando painéis...</p>
    </div>`;

  try {
    const allMediaResults = await fetchPaginatedResults(API_URL_MEDIA, 
    "Secret-Token", "67c7c2b91bcb315098bb733c07ce8b90", 500);
    const clients = groupMediaByClient(allMediaResults);

    // Gerar HTML dos clientes
    const clientHTML = Object.entries(clients).map(([clientName, mediaIds]) => `
      <label class="media-item">
        <input type="checkbox" name="client" value="${mediaIds.join(',')}">
        <p>${clientName}</p>
      </label>
    `).join("");

    // Atualizar a lista de mídias após o carregamento
    mediaList.innerHTML = clientHTML;

    const allPanelResults = await fetchPaginatedResults(API_URL_PANELS, 
    "Secret-Token", "b24987292ed4bf2e18199a425742ed5d", 500);
    
    // Gerar HTML dos painéis
    const panelHTML = allPanelResults.map(panel => `
      <label class="panel-item">
        <input type="checkbox" name="panel" value="${panel.id}">
        <div class="panel-icon">
          <i class="fas fa-tv"></i> <!-- Ícone de player -->
        </div>
        <p>${panel.name}</p>
      </label>
    `).join("");

    // Atualizar a lista de painéis após o carregamento
    panelList.innerHTML = panelHTML;

    setupCheckboxLogic();
    setupToggleLogic();
    setupSearchLogic();
  } catch (error) {
    console.error("[ERROR] Falha ao carregar mídias e painéis:", error);
    toggleMediaButton.style.display = "none";
    togglePanelButton.style.display = "none";
    // Exibir botão de refresh para tentar buscar novamente
    mediaList.innerHTML = `
        <div class="error-message">
            <p style="color: red;">Erro ao carregar clientes.</p>
            <button class="retry-button" onclick="loadFilters()">
                <i class="fas fa-sync-alt"></i> Tentar Novamente
            </button>
        </div>`;
    
    panelList.innerHTML = `
        <div class="error-message">
            <p style="color: red;">Erro ao carregar painéis.</p>
            <button class="retry-button" onclick="loadFilters()">
                <i class="fas fa-sync-alt"></i> Tentar Novamente
            </button>
        </div>`;
  }
}

async function fetchPaginatedResults(baseUrl, headerKey, headerValue, delayMs) {
  const firstResponse = await fetch(`${baseUrl}?page=1`, {
      headers: { [headerKey]: headerValue },
  });

  if (!firstResponse.ok) {
      throw new Error(`Erro ao buscar a primeira página de ${baseUrl}`);
  }

  const firstData = await firstResponse.json();
  let allResults = firstData.results;
  const totalPages = firstData.totalPages;

  // Se houver mais páginas, buscar as restantes com delay
  if (totalPages > 1) {
      for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
          await delay(delayMs); // Adiciona o delay corretamente

          const response = await fetch(`${baseUrl}?page=${currentPage}`, {
              headers: { [headerKey]: headerValue },
          });

          if (!response.ok) {
              continue; // Pular para a próxima página se houver erro
          }

          const data = await response.json();
          allResults = allResults.concat(data.results);
      }
  }

  return allResults;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      mediaVisibleCount += 10; // Incrementar em 10
      toggleItems(mediaList, mediaVisibleCount);
      if (mediaVisibleCount >= totalMediaItems) {
        toggleMediaButton.innerHTML = `Recolher <span class="toggle-icon">↑</span>`;
      }
    } else {
      mediaVisibleCount = 10; // Recolher para 10 itens
      toggleItems(mediaList, mediaVisibleCount);
      toggleMediaButton.innerHTML = `Mostrar mais <span class="toggle-icon">↓</span>`;
    }
  });

  togglePanelButton.addEventListener("click", () => {
    const totalPanelItems = panelList.children.length;

    if (panelVisibleCount < totalPanelItems) {
      panelVisibleCount += 10; // Incrementar em 10
      toggleItems(panelList, panelVisibleCount);
      if (panelVisibleCount >= totalPanelItems) {
        togglePanelButton.innerHTML = `Recolher <span class="toggle-icon">↑</span>`;
      }
    } else {
      panelVisibleCount = 10; // Recolher para 10 itens
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

function updateProgress(percentage, message) {
  const progressBar = document.getElementById("progress-bar");
  const progressMessage = document.getElementById("progress-message");
  const progressPercentage = document.getElementById("progress-percentage");

  progressPercentage.innerText = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressMessage.innerText = message;
}

async function fetchMediaNames(mediaIds) {
  try {
    const response = await fetch(`${API_URL_MEDIA}?id=${mediaIds.join(",")}`, {
      headers: { "Secret-Token": "0e51dbdb76a069e9642283cb0a84fb1f" },
    });
    if (!response.ok) throw new Error("Erro ao buscar nomes das mídias.");
    const data = await response.json();

    const mediaNames = {};
    data.results.forEach((media) => {
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
    const response = await fetch(API_URL_PANELS, {
      headers: { "Secret-Token": "a59202bc005fa4305916bca8aa7e31d0" },
    });
    if (!response.ok) throw new Error("Erro ao buscar nomes dos painéis.");
    const data = await response.json();

    const panelNames = {};
    data.results.forEach((panel) => {
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

function getSelectedClients() {
  const allMediaCheckbox = document.getElementById("allMedia");
  const mediaCheckboxes = document.querySelectorAll(
    "#media-list input[type='checkbox']:checked"
  );

  if (allMediaCheckbox.checked) {
    return "Todos";
  }

  const selectedClients = Array.from(mediaCheckboxes).map((input) => {
    return input.closest("label").querySelector("p").textContent.trim();
  });

  return selectedClients.length > 0 ? selectedClients.join(", ") : "Todos";
}

document.querySelectorAll(".expandable").forEach(item => {
    item.addEventListener("click", () => {
        item.classList.toggle("expanded");
    });
});

document.getElementById("setTodayLink").addEventListener("click", (event) => {
  event.preventDefault();

  const today = moment().utcOffset(-3).format("YYYY-MM-DD");

  document.getElementById("startDate").value = today;
  document.getElementById("endDate").value = today;
});

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

  document.getElementById('tab-' + tabName).style.display = 'block';
  document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

function mostrarAbasRelatorio() {
  document.getElementById('tabs-wrapper').style.display = 'block';
  document.getElementById('tab-veiculacao').style.display = 'block';
  document.getElementById('tab-impacto').style.display = 'block';
}

function esconderAbasRelatorio() {
  document.getElementById('tabs-wrapper').style.display = 'none';
  document.getElementById('tab-veiculacao').style.display = 'none';
  document.getElementById('tab-impacto').style.display = 'none';
}

function getFiltrosSelecionados() {
  const selectedClients = Array.from(
    document.querySelectorAll('input[name="client"]:checked')
  ).map((input) => input.value);
  const selectedPanels = Array.from(
    document.querySelectorAll('input[name="panel"]:checked')
  ).map((input) => input.value);

  const selectedMedia = selectedClients.length
    ? selectedClients.flatMap((clientMediaIds) => clientMediaIds.split(","))
    : [];

  startDate = document.getElementById("startDate").value || null;
  startTime = document.getElementById("startTime").value + ":00" || null;
  endDate = document.getElementById("endDate").value || null;
  endTime = document.getElementById("endTime").value + ":59" || null;

  return {
    startDate,
    startTime,
    endDate,
    endTime,
    selectedMedia: selectedMedia.map(Number),
    selectedPanels: selectedPanels.map(Number),
  };
}

let relatorioJaGerado = false;

document
  .getElementById("report-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    const filtros = getFiltrosSelecionados();

    try {
      if (relatorioJaGerado) {
        esconderAbasRelatorio();
      }
      
      const reportId = await gerarRelatorioVeiculacao(filtros);
      mostrarAbasRelatorio();
      await gerarRelatorioImpacto(filtros, reportId);
      
      relatorioJaGerado = true;
    } catch (error) {
      console.error("[ERROR] Falha ao gerar relatórios:", error);
    } 

  });

  