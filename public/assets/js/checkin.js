const API_URL_MEDIA = "https://api.4yousee.com.br/v1/medias";
const API_URL_PANELS = "https://api.4yousee.com.br/v1/players";
let checkInPanelNames = {};
let checkInMediaNames = {};

// Fetch painéis para Check-In
async function fetchCheckInPanels() {
    try {
        const response = await fetch(API_URL_PANELS, {
            headers: { 'Secret-Token': 'a59202bc005fa4305916bca8aa7e31d0' }
        });
        if (!response.ok) throw new Error("Erro ao buscar painéis.");
        const data = await response.json();
        return data.results.reduce((acc, panel) => {
            acc[panel.id] = panel.name;
            return acc;
        }, {});
    } catch (error) {
        console.error("[ERROR] Falha ao buscar painéis:", error);
        return {};
    }
}

// Fetch mídias para Check-In
async function fetchCheckInMedia() {
    try {
        const response = await fetch(API_URL_MEDIA, {
            headers: { 'Secret-Token': '4c24cf0409abb414431e97ecc126d955' }
        });
        if (!response.ok) throw new Error("Erro ao buscar mídias.");
        const data = await response.json();
        return data.results.reduce((acc, media) => {
            acc[media.id] = media.name;
            return acc;
        }, {});
    } catch (error) {
        console.error("[ERROR] Falha ao buscar mídias:", error);
        return {};
    }
}

// Inicializa dados de Check-In
async function initializeCheckIn() {
    try {
        checkInPanelNames = await fetchCheckInPanels();
        checkInMediaNames = await fetchCheckInMedia();
        console.log("[INFO] Dados de Check-In inicializados:", {
            panels: checkInPanelNames,
            media: checkInMediaNames
        });
    } catch (error) {
        console.error("[ERROR] Falha ao inicializar dados de Check-In:", error);
    }
}

// Selecionar Painel
function openPanelSelectionModal() {
    const modalContent = document.getElementById("modal-panel-list");
    modalContent.innerHTML = Object.entries(checkInPanelNames)
        .map(([id, name]) => `<li><button class="checkin-panel-option" data-panel-id="${id}">${name}</button></li>`)
        .join("");
    document.getElementById("panel-selection-modal").style.display = "flex";
}

// Fechar Modal
function closePanelSelectionModal() {
    document.getElementById("panel-selection-modal").style.display = "none";
}

// Gerenciar Seleção de Painel
function selectPanel(event) {
    if (event.target.classList.contains("checkin-panel-option")) {
        const panelId = event.target.getAttribute("data-panel-id");
        const panelName = checkInPanelNames[panelId] || "Painel não identificado";

        document.getElementById("selected-panel-name").innerText = `Painel: ${panelName}`;
        document.getElementById("selected-panel-name").setAttribute("data-panel-id", panelId);

        // Listar mídias
        const mediaList = document.getElementById("media-list");
        mediaList.innerHTML = Object.entries(checkInMediaNames)
            .map(([id, name]) => `
                <li>
                    <p><strong>Mídia:</strong> ${name}</p>
                    <input type="file" accept="image/*" class="checkin-media-photo" data-media-id="${id}">
                    <span class="checkin-photo-timestamp" id="timestamp-${id}">Sem foto anexada</span>
                </li>
            `)
            .join("");

        document.getElementById("media-checkin-list").style.display = "block";
        closePanelSelectionModal();
    }
}

// Extrair EXIF
async function extractExifData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const exif = EXIF.readFromBinaryFile(event.target.result);
                resolve(exif?.DateTimeOriginal || null);
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// Gerenciar Uploads de Fotos
async function handlePhotoUpload(event) {
    const input = event.target;
    const file = input.files[0];
    const mediaId = input.getAttribute("data-media-id");

    if (file) {
        try {
            const exifDate = await extractExifData(file);
            const timestamp = exifDate || new Date(file.lastModified).toLocaleString();
            document.getElementById(`timestamp-${mediaId}`).innerText = `Data da Foto: ${timestamp}`;
            document.getElementById("submit-checkin-button").disabled = false;
        } catch (error) {
            console.error("[ERROR] Falha ao extrair dados EXIF:", error);
            document.getElementById(`timestamp-${mediaId}`).innerText = "Erro ao obter data.";
        }
    }
}

// Inicializar
document.addEventListener("DOMContentLoaded", async () => {
    await initializeCheckIn();

    document.getElementById("select-panel-button").addEventListener("click", openPanelSelectionModal);
    document.getElementById("close-panel-modal").addEventListener("click", closePanelSelectionModal);
    document.getElementById("modal-panel-list").addEventListener("click", selectPanel);
    document.getElementById("media-list").addEventListener("change", handlePhotoUpload);
});
