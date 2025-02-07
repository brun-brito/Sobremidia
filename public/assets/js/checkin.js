const API_URL = "https://2ckh7b03-3000.brs.devtunnels.ms";
const API_URL_MEDIA = "https://api.4yousee.com.br/v1/medias";
const API_URL_PANELS = "https://api.4yousee.com.br/v1/players";
const API_URL_PLAYLIST = "https://api.4yousee.com.br/v1/playlists";
const THUMB_URL = "https://s3.amazonaws.com/4yousee-files/sobremidia/common/videos/thumbnails";

let checkInPanelNames = {};
let initializedCheckIn = false;

/** ===============================
 *  Fetch Functions
 * =============================== */

// Fetch painéis para Check-In
async function fetchCheckInPanels() {
    try {
        showLoading("Carregando painéis...");
        const response = await fetch(API_URL_PANELS, {
            headers: { "Secret-Token": "a59202bc005fa4305916bca8aa7e31d0" },
        });
        if (!response.ok) throw new Error("Erro ao buscar painéis.");
        const data = await response.json();
        return data.results.reduce((acc, panel) => {
            acc[panel.id] = { name: panel.name, playlists: panel.playlists };
            return acc;
        }, {});
    } catch (error) {
        console.error("[ERROR] Falha ao buscar painéis:", error);
        return {};
    } finally {
        hideLoading();
    }
}

async function fetchCheckIns() {
    try {
        showLoading("Carregando histórico...");
        const response = await fetch(`${API_URL}/checkin`);
        if (!response.ok) throw new Error("Erro ao buscar Check-Ins.");

        const { success, data } = await response.json();
        if (!success) throw new Error("Erro ao buscar Check-Ins.");

        return data;
    } catch (error) {
        console.error("[ERROR] Falha ao buscar Check-Ins:", error);
        alert("Erro ao buscar Check-Ins. Tente novamente.");
        return [];
    } finally {
        hideLoading();
    }
}

async function fetchPlaylistById(playlistId) {
    try {
        showLoading("Carregando mídias..."); // mesmo carregando a playlist deixar assim pro usuário ver só as mídias
        const response = await fetch(`${API_URL_PLAYLIST}/${playlistId}`, {
            headers: { "Secret-Token": "a59202bc005fa4305916bca8aa7e31d0" },
        });
        if (!response.ok) throw new Error(`Erro ao buscar playlist ${playlistId}.`);
        const playlist = await response.json();
        return playlist;
    } catch (error) {
        console.error(`[ERROR] Falha ao buscar playlist ${playlistId}:`, error);
        return null;
    } finally {
        hideLoading();
    }
}

/** ===============================
 *  Utility Functions
 * =============================== */

function showLoading(message = "Carregando...") {
    const loadingOverlay = document.getElementById("loading-overlay");
    const loadingMessage = document.getElementById("loading-message");

    if (loadingOverlay && loadingMessage) {
        loadingOverlay.style.display = "flex";
        loadingMessage.innerText = message;
    } else {
        console.error("[ERROR] Elementos de loading não encontrados.");
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
        loadingOverlay.style.display = "none";
    } else {
        console.error("[ERROR] Elemento de loading não encontrado.");
    }
}

// Obter playlist ativa com base no dia atual
function getPlaylistForToday(playlists) {
    const currentDay = new Date().getDay().toString(); // 0 = Domingo, 1 = Segunda, etc.
    const playlistForToday = playlists[currentDay];
    // console.log("[INFO] Playlist ativa para hoje (dia atual):", playlistForToday);
    return playlistForToday;
}

/** ===============================
 *  Event Handlers
 * =============================== */

// Alternar para a aba "Realizar Check-In"
document.getElementById("realizar-checkin-button").addEventListener("click", async () => {
    document.getElementById("realizar-checkin").style.display = "block";
    document.getElementById("checkin-history").style.display = "none";

    if (!initializedCheckIn) {
        try {
            checkInPanelNames = await fetchCheckInPanels();
            // console.log("[INFO] Painéis carregados:", checkInPanelNames);
            initializedCheckIn = true;
        } catch (error) {
            console.error("[ERROR] Falha ao inicializar Check-In:", error);
        }
    }
});

// Abrir modal de seleção de painel
function openPanelSelectionModal() {
    document.getElementById("media-checkin-list").style.display = "none";
    const modalContent = document.getElementById("modal-panel-list");
    modalContent.innerHTML = Object.entries(checkInPanelNames)
        .map(([id, panelData]) => `
            <li>
                <button class="checkin-panel-option" data-panel-id="${id}">${panelData.name}</button>
            </li>
        `)
        .join("");
    document.getElementById("panel-selection-modal").style.display = "flex";
}

// Fechar modal de seleção de painel
function closePanelSelectionModal() {
    document.getElementById("panel-selection-modal").style.display = "none";
}

// Gerenciar seleção de painel
async function handlePanelSelection(event) {
    if (!event.target.classList.contains("checkin-panel-option")) return;

    const panelId = event.target.getAttribute("data-panel-id");
    const panelData = checkInPanelNames[panelId];
    const panelName = panelData.name;
    const playlists = panelData.playlists;

    // console.log("[INFO] Painel selecionado:", { panelId, panelName, playlists });

    // Obter playlist ativa
    const playlistForToday = getPlaylistForToday(playlists);
    if (!playlistForToday) {
        alert("Nenhuma playlist configurada para hoje.");
        return;
    }

    const playlistDetails = await fetchPlaylistById(playlistForToday.id);
    if (!playlistDetails || !playlistDetails.items) {
        console.error("[ERROR] Playlist inválida ou sem itens:", playlistDetails);
        alert("Erro ao carregar informações da playlist.");
        return;
    }

    const mediaList = document.getElementById("media-list");
    mediaList.innerHTML = "";

    // Filtrar mídias ativas com validação robusta
    const activeMedia = playlistDetails.items.flatMap(item => {
        if (!item.items || !Array.isArray(item.items)) {
            // Se o item for diretamente uma mídia, adicione-o
            if (item.type === "media") {
                return [item];
            } else {
                console.warn("[WARN] Item ignorado, não é uma mídia válida:", item);
                return [];
            }
        }
    
        // Caso o item contenha uma lista de mídias não vencidas
        return item.items.filter(media => {
            const now = new Date();
            const startDate = media?.contentSchedule?.startDate ? new Date(media.contentSchedule.startDate) : null;
            const endDate = media?.contentSchedule?.endDate ? new Date(media.contentSchedule.endDate) : null;
            return (!startDate || now >= startDate) && (!endDate || now <= endDate);
        });
    });

    // console.log("[INFO] Mídias ativas para o painel:", activeMedia);

    if (activeMedia.length === 0) {
        mediaList.innerHTML = "<p>Nenhuma mídia ativa para este painel no momento.</p>";
    } else {
        activeMedia.forEach(media => {
            const listItem = document.createElement("li");
            const nomeMidia = media.name.split("-");
            listItem.innerHTML = `
                <p><strong>Cliente:</strong> <span id="nome-cliente-${media.id}">${nomeMidia[0]}</span></p>
                <p><strong>Mídia:</strong> <span id="nome-midia-${media.id}">${nomeMidia.slice(1).join("-")}</span></p>
                <p><strong>ID:</strong> ${media.id}</p>
                <img src="${THUMB_URL}/i_${media.id}.png" alt="Prévia da Mídia" 
                    style="width: 100px; height: auto; border: 1px solid #ddd; margin-top: 5px; margin-bottom: 10px;" />
                
                <div class="midia-anexos">
                    <div class="upload-container">
                        <p><strong>Foto mídia:</strong><span style="color: red;">*</span></p>
                        <div class="upload-frame" data-media-id="${media.id}" data-type="media-photo">
                            <i class="fas fa-plus upload-icon"></i>
                            <img id="preview-media-${media.id}" class="upload-preview" style="display: none;" />
                            <span id="media-counter-${media.id}" class="media-counter" style="display: none;">+0</span>
                        </div>
                        <p class="upload-label">Clique para gerenciar fotos</p>
                    </div>

                    <div class="upload-container">
                        <p><strong>Foto entorno:</strong><span style="color: red;">*</span></p>
                        <div class="upload-frame" data-media-id="${media.id}" data-type="environment-photo">
                            <i class="fas fa-plus upload-icon"></i>
                            <img id="preview-environment-${media.id}" class="upload-preview" style="display: none;" />
                            <span id="environment-counter-${media.id}" class="media-counter" style="display: none;">+0</span>
                        </div>
                        <p class="upload-label">Clique para gerenciar fotos do entorno</p>
                    </div>

                    <div class="upload-container">
                        <p><strong>Vídeo mídia:</strong><span style="color: red;">*</span></p>
                        <div class="upload-frame" data-media-id="${media.id}" data-type="video-proof">
                            <i class="fas fa-plus upload-icon"></i>
                            <img id="preview-video-${media.id}" class="upload-preview" style="display: none;" />
                            <span id="video-counter-${media.id}" class="media-counter" style="display: none;">+0</span>
                        </div>
                        <p class="upload-label">Clique para gerenciar vídeos</p>
                    </div>
                    <button class="send-checkin-button" data-media-id="${media.id}">Enviar Check-In</button>
                </div>
            
            `;
            mediaList.appendChild(listItem);
        });        
        document.getElementById("media-checkin-list").style.display = "block";
    }

    document.getElementById("selected-panel-name").innerText = `Painel Selecionado: ${panelName} (${activeMedia.length} mídias)`;
    document.getElementById("selected-panel-name").setAttribute("data-panel-id", panelId);
    document.getElementById("selected-panel-name").setAttribute("data-panel-name", panelName);
    
    closePanelSelectionModal();
    initializeUploadFrames();
    document.querySelectorAll('.send-checkin-button').forEach(button => {
        button.addEventListener('click', () => {
          const mediaId = button.getAttribute('data-media-id');
          console.log("[DEBUG] Botão enviar checkin clicado para mediaId:", mediaId);
          sendCheckInForMedia(mediaId);
        });
      });
}

// Variáveis globais para armazenar os dados e o estado atual
let mediaData = {};  // Estrutura: { type: { mediaId: [ { file, base64, timestamp, fileName } ] } }
const chunkSize = 5 * 1024 * 1024;
let currentMediaId = "";
let currentType = "";

// Função para inicializar os upload frames
function initializeUploadFrames() {
  const frames = document.querySelectorAll('.upload-frame');
  
  frames.forEach(frame => {
    frame.addEventListener('click', () => {
      const mediaId = frame.getAttribute('data-media-id');
      const type = frame.getAttribute('data-type');
      openModal(mediaId, type);
    });
  });

  // Listener para o input do modal
  const modalFileInput = document.getElementById('modal-file-input');
  if (modalFileInput) {
    modalFileInput.addEventListener('change', handleFileUpload);
  } else {
  }
  
  // Listener para fechar o modal
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  } else {
  }
  
  // Listener para salvar as mudanças
  const saveModalBtn = document.getElementById('save-modal');
  if (saveModalBtn) {
    saveModalBtn.addEventListener('click', saveChangesAndCloseModal);
  } else {
  }
}

// Função para abrir o modal
function openModal(mediaId, type) {
  currentMediaId = mediaId;
  currentType = type;
  
  const modal = document.getElementById('modal-midia');
  if (modal) {
    modal.style.display = "flex";
  } else {
    return;
  }
  
  // Atualiza o título do modal conforme o tipo
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) {
    if (type === 'media-photo') {
      modalTitle.innerText = 'Gerenciar Fotos da Mídia';
    } else if (type === 'environment-photo') {
      modalTitle.innerText = 'Gerenciar Fotos do Entorno';
    } else if (type === 'video-proof') {
      modalTitle.innerText = 'Gerenciar Vídeos';
    }
  } else {
    console.error("[DEBUG] Elemento 'modal-title' não encontrado!");
  }
  
  // Atualiza o atributo 'accept' do input do modal
  const fileInput = document.getElementById('modal-file-input');
  if (fileInput) {
    fileInput.accept = (type === 'video-proof') ? 'video/*' : 'image/*';
  } else {
    console.error("[DEBUG] Elemento 'modal-file-input' não encontrado!");
  }
  
  // Inicializa a estrutura para o tipo e mediaId, se necessário
  if (!mediaData[type]) {
    mediaData[type] = {};
  }
  if (!mediaData[type][mediaId]) {
    mediaData[type][mediaId] = [];
  }
  
  updateModalMediaGrid(mediaId, type);
}

// Função para fechar o modal
function closeModal() {
  const modal = document.getElementById('modal-midia');
  if (modal) {
    modal.style.display = "none";
  }
  const fileInput = document.getElementById('modal-file-input');
  if (fileInput) fileInput.value = "";
}

// Processa o upload de arquivos no modal
function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  console.log("[DEBUG] Arquivos selecionados:", files);
  const mediaId = currentMediaId;
  const type = currentType;
  if (!mediaData[type]) mediaData[type] = {};
  if (!mediaData[type][mediaId]) mediaData[type][mediaId] = [];
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      mediaData[type][mediaId].push({
        file: file,
        base64: base64,
        timestamp: new Date(file.lastModified).toISOString(),
        fileName: file.name
      });
      updateModalMediaGrid(mediaId, type);
    };
    reader.onerror = (err) => console.error("[DEBUG] Erro ao ler arquivo:", file.name, err);
    reader.readAsDataURL(file);
  });
}

// Atualiza a grid do modal com os arquivos anexados
function updateModalMediaGrid(mediaId, type) {
  const grid = document.getElementById('modal-media-grid');
  if (!grid) {
    console.error("[DEBUG] Elemento 'modal-media-grid' não encontrado");
    return;
  }
  grid.innerHTML = "";
  const items = (mediaData[type] && mediaData[type][mediaId]) || [];
  if (items.length === 0) {
    grid.innerHTML = "<p>Nenhum arquivo anexado.</p>";
  } else {
    items.forEach((item, index) => {
      const gridItem = document.createElement('div');
      gridItem.className = 'grid-item';
      if (type === 'video-proof') {
        gridItem.innerHTML = `
          <video width="120" height="90" controls>
            <source src="data:video/mp4;base64,${item.base64}" type="video/mp4">
          </video>
          <span class="delete-media" data-index="${index}">&times;</span>
        `;
      } else {
        gridItem.innerHTML = `
          <img src="data:image/jpeg;base64,${item.base64}" alt="${item.fileName}" width="120" height="90">
          <span class="delete-media" data-index="${index}">&times;</span>
        `;
      }
      gridItem.querySelector('.delete-media').addEventListener('click', () => {
        removeMediaFromData(mediaId, type, index);
        updateModalMediaGrid(mediaId, type);
      });
      grid.appendChild(gridItem);
    });
  }
}

// Remove um arquivo da estrutura de mídia
function removeMediaFromData(mediaId, type, index) {
  if (mediaData[type] && mediaData[type][mediaId]) {
    mediaData[type][mediaId].splice(index, 1);
  }
}

// Salva as alterações e fecha o modal
function saveChangesAndCloseModal() {
  updateMainPreview(currentMediaId, currentType);
  closeModal();
}

// Atualiza a pré-visualização principal no upload-frame
function updateMainPreview(mediaId, type) {
  let previewId, counterId;
  if (type === 'media-photo') {
    previewId = `preview-media-${mediaId}`;
    counterId = `media-counter-${mediaId}`;
  } else if (type === 'environment-photo') {
    previewId = `preview-environment-${mediaId}`;
    counterId = `environment-counter-${mediaId}`;
  } else if (type === 'video-proof') {
    previewId = `preview-video-${mediaId}`;
    counterId = `video-counter-${mediaId}`;
  }
  const previewElem = document.getElementById(previewId);
  const counterElem = document.getElementById(counterId);
  const items = (mediaData[type] && mediaData[type][mediaId]) || [];
  
  if (items.length > 0) {
    if (type === 'video-proof') {
      const container = document.querySelector(`.upload-frame[data-media-id="${mediaId}"][data-type="${type}"]`);
      if (container) {
        container.innerHTML = `
          <video id="${previewId}" style="width:100%; height:auto;">
            <source src="data:video/mp4;base64,${items[0].base64}" type="video/mp4">
          </video>
          <span id="${counterElem ? counterElem.id : counterId}" class="media-counter" style="display: ${items.length > 1 ? 'block' : 'none'};">+${items.length - 1}</span>
        `;
      }
    } else {
      if (previewElem) {
        previewElem.src = `data:image/jpeg;base64,${items[0].base64}`;
        previewElem.style.display = "block";
      }
      if (counterElem) {
        counterElem.innerText = `+${items.length - 1}`;
        counterElem.style.display = items.length > 1 ? "block" : "none";
      }
    }
  } else {
    if (previewElem) previewElem.style.display = "none";
    if (counterElem) counterElem.style.display = "none";
  }
}

    /*********************** AGRUPAMENTO E ENVIO DO CHECK-IN *************************/
function groupMediaData() {
    const grouped = {};
    Object.keys(mediaData).forEach(type => {
        Object.keys(mediaData[type]).forEach(mediaId => {
        if(!grouped[mediaId]) {
            // Preserva a estrutura de Cliente, Mídia, ID e anexos conforme o snippet
            const clientElem = document.getElementById("nome-cliente");
            const mediaNameElem = document.getElementById("nome-midia");
            grouped[mediaId] = {
            cliente: clientElem ? clientElem.innerText.trim() : "",
            idMidia: mediaId,
            nomeMidia: mediaNameElem ? mediaNameElem.innerText.trim() : "",
            fotosMidia: [],
            fotosEntorno: [],
            videosMidia: []
            };
        }
        mediaData[type][mediaId].forEach(item => {
            const mediaItem = {
            timestamp: item.timestamp,
            url: item.base64,  // Em produção, essa URL virá do Storage
            fileName: item.fileName
            };
            if(type === "media-photo") {
            grouped[mediaId].fotosMidia.push(mediaItem);
            } else if(type === "environment-photo") {
            grouped[mediaId].fotosEntorno.push(mediaItem);
            } else if(type === "video-proof") {
            grouped[mediaId].videosMidia.push(mediaItem);
            }
        });
        });
    });
    console.log("[INFO] Dados agrupados para envio:", grouped);
    return Object.values(grouped);
}

async function sendCheckInData(panelId, panelName, groupedData) {
    const payload = {
        panelId,
        panelName,
        midias: groupedData.map(media => ({
        cliente: media.cliente,
        idMidia: media.idMidia,
        nomeMidia: media.nomeMidia,
        fotosMidia: media.fotosMidia.map(item => ({
            timestamp: item.timestamp,
            url: item.url
        })),
        fotosEntorno: media.fotosEntorno.map(item => ({
            timestamp: item.timestamp,
            url: item.url
        })),
        videosMidia: media.videosMidia.map(item => ({
            timestamp: item.timestamp,
            url: item.url
        }))
        }))
    };
    console.log("[INFO] Enviando payload para o backend:", payload);
    const response = await fetch(`${API_URL}/checkin/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar Check-In.");
    }
    return response.json();
}

function showProgressOverlay(totalActions) {
    let overlay = document.getElementById("progress-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "progress-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0, 0, 0, 0.8)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "2000";
        overlay.style.color = "#fff";
        overlay.style.fontFamily = "Arial, sans-serif";

        // Container da barra
        const barContainer = document.createElement("div");
        barContainer.style.width = "60%";
        barContainer.style.height = "25px";
        barContainer.style.background = "#ddd";
        barContainer.style.borderRadius = "10px";
        barContainer.style.overflow = "hidden";

        // Barra de progresso
        const progressBar = document.createElement("div");
        progressBar.id = "progress-bar";
        progressBar.style.width = "0%";
        progressBar.style.height = "100%";
        progressBar.style.background = "#4caf50";
        barContainer.appendChild(progressBar);

        // Mensagem de progresso
        const progressMessage = document.createElement("div");
        progressMessage.id = "progress-message";
        progressMessage.style.marginTop = "20px";
        progressMessage.style.fontSize = "18px";

        // Adiciona os elementos ao overlay
        overlay.appendChild(barContainer);
        overlay.appendChild(progressMessage);
        document.body.appendChild(overlay);
    } else {
        overlay.style.display = "flex";  // Mostra o overlay se já existir
    }

    // Inicializa a barra e a mensagem
    updateProgressOverlay(0, totalActions, "Iniciando upload...");
}

function updateProgressOverlay(completedActions, totalActions, message) {
    const progressBar = document.getElementById("progress-bar");
    const progressMessage = document.getElementById("progress-message");

    if (progressBar && progressMessage) {
        const percent = Math.round((completedActions / totalActions) * 100);
        progressBar.style.width = `${percent}%`;
        progressMessage.innerText = `${message} (${percent}%)`;
    }
    }

    function hideProgressOverlay() {
    const overlay = document.getElementById("progress-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}      
/*
async function uploadPhotos(filesMidia, timestampsMidia, filesEntorno, timestampsEntorno) {
    const formData = new FormData();
    filesMidia.forEach((file, index) => {
        formData.append("files", file);
        formData.append("fotosMidiaTimestamps", timestampsMidia[index]);
    });

    filesEntorno.forEach((file, index) => {
        formData.append("files", file);
        formData.append("fotosEntornoTimestamps", timestampsEntorno[index]);
    });

    try {
        const response = await fetch(`${API_URL}/checkin/upload-photo`, {
        method: "POST",
        body: formData
        });

        if (!response.ok) {
        throw new Error("Erro no upload de fotos");
        }

        const data = await response.json();
        return data.urls;
    } catch (error) {
        console.error("Erro ao enviar fotos:", error);
        throw error;
    }
}*/

    // Função para upload de vídeo
async function uploadVideoChunks(file, timestamp) {
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 10));

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("fileId", fileId);
        formData.append("chunkIndex", chunkIndex);
        formData.append("totalChunks", totalChunks);
        formData.append("originalName", file.name);
        formData.append("videoTimestamp", timestamp);

        console.log("[DEBUG] Conteúdo do FormData:");
        formData.forEach((value, key) => {
        console.log(`  ${key}:`, value);
        });

        try {
        const response = await fetch(`${API_URL}/checkin/upload-chunk`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Erro no envio do chunk ${chunkIndex}`);
        }

        const data = await response.json();
        console.log(`[PROGRESS] Chunk ${chunkIndex + 1}/${totalChunks} enviado`);
        } catch (error) {
        console.error("Erro ao enviar chunk de vídeo:", error);
        throw error;
        }
    }

    return `https://storage.googleapis.com/sobremidia-ce.firebasestorage.app/checkin/${timestamp}_${file.name}`;
    //https://storage.googleapis.com/sobremidia-ce.firebasestorage.app/teste/1738960503041_logo.mp4
    // Esse é o link, mas tem que gerar token
}

async function sendCheckInForMedia(mediaId) {
    const panelElem = document.getElementById("selected-panel-name");
    const panelId = panelElem.getAttribute("data-panel-id");
    const panelName = panelElem.getAttribute("data-panel-name");

    // Obtem os anexos da mídia
    const mediaPhotoItems = (mediaData["media-photo"] && mediaData["media-photo"][mediaId]) || [];
    const environmentPhotoItems = (mediaData["environment-photo"] && mediaData["environment-photo"][mediaId]) || [];
    const videoItems = (mediaData["video-proof"] && mediaData["video-proof"][mediaId]) || [];

    // Valida os dados
    if (mediaPhotoItems.length === 0 || environmentPhotoItems.length === 0 || videoItems.length === 0) {
        alert("Cada mídia deve ter pelo menos um arquivo em cada categoria.");
        return;
    }

    const totalActions = mediaPhotoItems.length + environmentPhotoItems.length + videoItems.length;
    let completedActions = 0;

    // Exibe a barra de progresso
    showProgressOverlay(totalActions);

    try {
        // Upload de fotos
        const fotosMidiaUrls = [];
        for (let [index, item] of mediaPhotoItems.entries()) {
            updateProgressOverlay(completedActions, totalActions, `Enviando foto da mídia: ${item.file.name}`);
            const url = await uploadSinglePhoto(item.file, item.timestamp, "fotosMidiaTimestamps");
            fotosMidiaUrls.push({ url, timestamp: item.timestamp });
            completedActions++;
            updateProgressOverlay(completedActions, totalActions, `Foto enviada: ${item.file.name}`);
        }

        const fotosEntornoUrls = [];
        for (let [index, item] of environmentPhotoItems.entries()) {
            updateProgressOverlay(completedActions, totalActions, `Enviando foto do entorno: ${item.file.name}`);
            const url = await uploadSinglePhoto(item.file, item.timestamp, "fotosEntornoTimestamps");
            fotosEntornoUrls.push({ url, timestamp: item.timestamp });
            completedActions++;
            updateProgressOverlay(completedActions, totalActions, `Foto enviada: ${item.file.name}`);
        }

        // Upload de vídeos
        const videosMidia = [];
        for (let [index, videoItem] of videoItems.entries()) {
            updateProgressOverlay(completedActions, totalActions, `Enviando vídeo: ${videoItem.file.name}`);
            const urlVideo = await uploadVideoChunks(videoItem.file, videoItem.timestamp);
            videosMidia.push({ timestamp: videoItem.timestamp, url: urlVideo });
            completedActions++;
            updateProgressOverlay(completedActions, totalActions, `Vídeo enviado: ${videoItem.file.name}`);
        }

        // Constrói o payload final
        const mediaPayload = {
            cliente: document.getElementById(`nome-cliente-${mediaId}`).innerText.trim(),
            idMidia: mediaId,
            nomeMidia: document.getElementById(`nome-midia-${mediaId}`).innerText.trim(),
            fotosMidia: fotosMidiaUrls,
            fotosEntorno: fotosEntornoUrls,
            videosMidia: videosMidia
        };

        const payload = {
            panelId,
            panelName,
            midias: [mediaPayload]
        };

        console.log("[INFO] Payload final enviado:", payload);

        // Envia o payload para o Firestore
        const response = await fetch(`${API_URL}/checkin/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
        });

        if (!response.ok) {
        throw new Error("Erro ao criar check-in.");
        }

        alert("Check-In enviado com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar check-in:", error);
        alert("Falha ao enviar o Check-In. Verifique os dados e tente novamente.");
    } finally {
        hideProgressOverlay();
    }
}

async function uploadSinglePhoto(file, timestamp, timestampField) {
    const formData = new FormData();
    formData.append("files", file);
    formData.append(timestampField, timestamp);

    try {
        const response = await fetch(`${API_URL}/checkin/upload-photo`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro ao enviar a foto ${file.name}`);
        }

        const data = await response.json();
        return data.urls[0];
    } catch (error) {
        console.error("Erro ao enviar foto:", error);
        throw error;
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("select-panel-button").addEventListener("click", openPanelSelectionModal);
    document.getElementById("close-panel-modal").addEventListener("click", closePanelSelectionModal);
    document.getElementById("modal-panel-list").addEventListener("click", handlePanelSelection);
});