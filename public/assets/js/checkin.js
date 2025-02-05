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
        showLoading("Carregando playlist...");
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
            listItem.innerHTML = `
                <p><strong>Mídia:</strong> ${media.name}</p>
                <p><strong>ID:</strong> ${media.id}</p>
                <img src="${THUMB_URL}/i_${media.id}.png" alt="Prévia da Mídia" 
                    style="width: 100px; height: auto; border: 1px solid #ddd; margin-top: 5px; margin-bottom: 10px;" />
                
                <div class="upload-container">
                    <p><strong>Foto mídia:</strong></p>
                    <div class="upload-frame" data-media-id="${media.id}" data-type="media-photo">
                        <i class="fas fa-plus upload-icon"></i>
                        <input type="file" accept="image/*" class="upload-input" style="display: none;" 
                            data-media-id="${media.id}" data-media-name="${media.name}" data-type="media-photo">
                        <img id="preview-media-${media.id}" class="upload-preview" style="display: none;" />
                    </div>
                    <span id="timestamp-media-photo-${media.id}" class="timestamp">Sem foto anexada</span>
                </div>

                <div class="upload-container">
                    <p><strong>Foto entorno:</strong></p>
                    <div class="upload-frame" data-media-id="${media.id}" data-type="environment-photo">
                        <i class="fas fa-plus upload-icon"></i>
                        <input type="file" accept="image/*" class="upload-input" style="display: none;" 
                            data-media-id="${media.id}" data-media-name="${media.name}" data-type="environment-photo">
                        <img id="preview-environment-${media.id}" class="upload-preview" style="display: none;" />
                    </div>
                    <span id="timestamp-environment-photo-${media.id}" class="timestamp">Sem foto anexada</span>
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
    addUploadFrameListeners();
}

// Adicionar eventos para as molduras
function addUploadFrameListeners() {
    const frames = document.querySelectorAll(".upload-frame");
    frames.forEach((frame) => {
        const input = frame.querySelector(".upload-input");

        // Adiciona evento de clique para a moldura
        frame.addEventListener("click", () => {
            if (input) input.click();
        });

        // Adiciona evento de mudança para o input
        if (input) {
            input.addEventListener("change", handlePhotoUpload);
        }
    });
}

// Gerenciar upload de fotos
async function handlePhotoUpload(event) {
    const input = event.target;
    const file = input.files[0];
    const mediaId = input.getAttribute("data-media-id");
    const type = input.getAttribute("data-type");

    if (file) {
        try {
            const reader = new FileReader();
            reader.onload = function (e) {
                // Identificar o ID dinâmico da prévia da imagem
                const previewId = type === "media-photo"
                    ? `preview-media-${mediaId}`
                    : `preview-environment-${mediaId}`;

                const preview = document.getElementById(previewId);
                if (preview) {
                    preview.src = e.target.result; // Define a imagem como o Base64 gerado
                    preview.style.display = "block"; // Torna visível
                } else {
                    console.warn(`[WARN] Prévia não encontrada para mediaId: ${mediaId}, tipo: ${type}`);
                }
            };

            reader.readAsDataURL(file); // Converte o arquivo em Base64 para exibir a prévia

            const timestamp = formatDate(file.lastModified);
            const timestampId = `timestamp-${type}-${mediaId}`;
            const timestampElement = document.getElementById(timestampId);

            if (timestampElement) {
                timestampElement.innerText = timestamp;
            } else {
                console.warn(`[WARN] Elemento timestamp não encontrado para mediaId: ${mediaId}, tipo: ${type}`);
            }

            // Verificar se todos os campos de fotos foram preenchidos
            checkIfAllPhotosUploaded();

        } catch (error) {
            console.error("[ERROR] Falha ao processar foto:", error);
            const timestampElement = document.getElementById(`timestamp-${type}-${mediaId}`);
            if (timestampElement) {
                timestampElement.innerText = "Erro ao obter data.";
            }
        }
    } else {
        console.warn("[WARN] Nenhuma foto anexada.");
    }
}

// Verificar se todas as fotos foram anexadas
function checkIfAllPhotosUploaded() {
    const mediaItems = Array.from(document.querySelectorAll(".checkin-media-item"));
    const allUploaded = mediaItems.every((item) => {
        const mediaPhotoInput = item.querySelector(".upload-input[data-type='media-photo']");
        const environmentPhotoInput = item.querySelector(".upload-input[data-type='environment-photo']");
        return mediaPhotoInput.files.length > 0 && environmentPhotoInput.files.length > 0;
    });

    document.getElementById("submit-checkin-button").disabled = !allUploaded;
}

function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                if (width > height) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                } else {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            const resizedBase64 = canvas.toDataURL("image/jpeg", 0.8); // Qualidade de 80%
            resolve(resizedBase64.split(",")[1]); // Retorna apenas o Base64
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Enviar check-in
async function handleSubmitCheckIn() {
    const panelId = document.getElementById("selected-panel-name").getAttribute("data-panel-id");
    const panelName = document.getElementById("selected-panel-name").getAttribute("data-panel-name");

    if (!panelId || !panelName) {
        alert("Selecione um painel antes de enviar o Check-In.");
        return;
    }

    try {
        showLoading("Enviando Check-in");
        const mediaPhotos = await Promise.all(
            Array.from(document.querySelectorAll(".upload-input")).map(async (input) => {
                const mediaId = input.getAttribute("data-media-id");
                const mediaName = input.getAttribute("data-media-name");
                const type = input.getAttribute("data-type"); // media-photo ou environment-photo
                const file = input.files[0]; // Obtém o arquivo anexado
    
                if (!file) {
                    alert(`[WARN] Nenhuma foto anexada para mídia: ${mediaId}, tipo: ${type}`);
                }
    
                const photoBase64 = await resizeImage(file, 800, 800);
                const timestampId = `timestamp-${type}-${mediaId}`;
                const timestamp = document.getElementById(timestampId)?.innerText || "Sem data";

                return { mediaId, mediaName, [`${type}`]: photoBase64, timestamp };
            })
        );

        const groupedMediaPhotos = groupByMediaId(mediaPhotos);

        // console.log(`Mídia: \n\n${JSON.stringify(mediaPhotos)}`);
        // console.log(`Mídia GRUPO:`);
        // console.log(groupedMediaPhotos);

        await sendCheckInData(panelId, panelName, groupedMediaPhotos);
        alert("Check-In enviado com sucesso!");
    } catch (error) {
        console.error("[ERROR] Falha ao enviar Check-In:", error);
        alert("Erro ao enviar Check-In. Tente novamente.");
    }
    finally {
        hideLoading();
    }
}

// Agrupar as fotos por mediaId
function groupByMediaId(mediaPhotos) {
    const grouped = {};

    mediaPhotos.forEach((photo) => {
        if (!photo) return;

        const { mediaId, mediaName } = photo;

        if (!grouped[mediaId]) {
            grouped[mediaId] = {
                mediaId,
                mediaName,
                timestampMedia: null,
                timestampEnvironment: null,
                mediaPhoto: null,
                environmentPhoto: null,
            };
        }

        // Atribuir dinamicamente as fotos e timestamps
        if (photo["media-photo"]) {
            grouped[mediaId].mediaPhoto = photo["media-photo"];
            grouped[mediaId].timestampMedia = photo.timestamp; // Timestamp para foto da mídia
        }

        if (photo["environment-photo"]) {
            grouped[mediaId].environmentPhoto = photo["environment-photo"];
            grouped[mediaId].timestampEnvironment = photo.timestamp; // Timestamp para foto do entorno
        }
    });

    return Object.values(grouped);
}

// Enviar dados do Check-In
async function sendCheckInData(panelId, panelName, checkInData) {
    try {
        // Montar o payload
        const payload = {
            panelId,
            panelName,
            mediaPhotos: checkInData.map((data) => ({
                mediaId: data.mediaId,
                mediaName: data.mediaName,
                mediaPhoto: data.mediaPhoto,
                environmentPhoto: data.environmentPhoto,
                timestampEnvironment: data.timestampEnvironment,
                timestampMedia: data.timestampMedia,
            })),
        };

        console.log(`Payload:`);
        console.log(payload.mediaPhotos);

        // Enviar para o backend
        const response = await fetch(`${API_URL}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("[ERROR] Erro no servidor ao enviar Check-In:", error);
            throw new Error("Erro no envio do Check-In.");
        }

        const result = await response.json();
        console.log("[INFO] Check-In enviado com sucesso:", result);

        return result;
    } catch (error) {
        console.error("[ERROR] Falha ao enviar Check-In:", error);
        throw error;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("select-panel-button").addEventListener("click", openPanelSelectionModal);
    document.getElementById("close-panel-modal").addEventListener("click", closePanelSelectionModal);
    document.getElementById("modal-panel-list").addEventListener("click", handlePanelSelection);
    // document.getElementById("media-list").addEventListener("change", handlePhotoUpload);
    document.getElementById("submit-checkin-button").addEventListener("click", handleSubmitCheckIn);
});