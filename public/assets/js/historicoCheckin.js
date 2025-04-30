let currentPage = 1;
let checkIns;
const itemsPerPage = 5;
let sortedCheckIns;
let totalPages;
let selectedClient = "";
let selectedPanel = "";
let selectedCheckIn;
let selectionMode = false;
let selectedCount = 0;
let selectedCheckIns = new Set();
let selectedCheckbox = {};

const selectButton = document.getElementById("toggle-selection");
const checkinsList = document.getElementById("checkins-list");

selectButton.addEventListener("click", () => {
    selectionMode = !selectionMode;
    const checkboxes = document.querySelectorAll(".checkin-checkbox");

    checkboxes.forEach(checkbox => {
        checkbox.style.display = selectionMode ? "block" : "none";
        if (!selectionMode) checkbox.checked = false;
    });

    const selectButton = document.getElementById("toggle-selection");
    selectButton.innerHTML = selectionMode 
        ? `<i class="fas fa-check-square"></i> Selecionar <span id="contador">(0)</span>` 
        : `<i class="far fa-square"></i> Selecionar <span id="contador"></span>`;

    selectedCount = 0;
    selectedCheckbox = {}; 
    updateSelectionCounter();
});

checkinsList.addEventListener("change", (event) => {
    if (event.target.classList.contains("checkin-checkbox")) {
        const checkInId = event.target.getAttribute("data-checkin-id");

        if (event.target.checked) {
            selectedCheckIns.add(checkInId);
        } else {
            selectedCheckIns.delete(checkInId);
        }

        selectedCount = selectedCheckIns.size;
        updateSelectionCounter();
    }
});

function updateSelectionCounter() {
    let counter = document.getElementById("contador");
    counter.textContent = selectedCount > 0 ? `(${selectedCount})` : "";
}

document.addEventListener("DOMContentLoaded", async () => {
    checkIns = await fetchCheckIns();
    populateClientSelector();
});

function populateClientSelector() {
    const clientSelector = document.getElementById("client-selector");

    const uniqueClients = new Set(
        checkIns.flatMap(checkIn =>
            checkIn.midias.map(photo => photo.cliente ? photo.cliente : "Desconhecido")
        )
    );

    // Ordenar os clientes em ordem alfabética
    const sortedClients = [...uniqueClients].sort((a, b) => a.localeCompare(b));

    // Limpar o seletor e adicionar a opção padrão
    clientSelector.innerHTML = `<option value="">Selecione um cliente...</option>`;

    // Adicionar os clientes ordenados
    sortedClients.forEach(client => {
        clientSelector.innerHTML += `<option value="${client}">${client}</option>`;
    });

    clientSelector.addEventListener("change", () => {
        selectedClient = clientSelector.value;
        selectedPanel = "";
        populatePanelSelector(selectedClient);
    });
}

function populatePanelSelector(client) {
    const panelSelector = document.getElementById("panel-selector");
    panelSelector.innerHTML = `<option value="">Todos</option>`;

    if (!client) {
        panelSelector.disabled = true;
        return;
    }

    let clientCheckIns = checkIns.filter(checkIn => 
        checkIn.midias.some(photo => photo.cliente === client)
    );

    const uniquePanels = new Set(clientCheckIns.map(checkIn => checkIn.panelName || checkIn.panelId));

    uniquePanels.forEach(panel => {
        panelSelector.innerHTML += `<option value="${panel}">${panel}</option>`;
    });

    panelSelector.disabled = false;
}

function filterCheckIns() {
    const startDateInput = document.getElementById("start-date").value;
    const endDateInput = document.getElementById("end-date").value;

    const startDate = startDateInput ? new Date(startDateInput).getTime() / 1000 : null;
    const endDate = endDateInput ? (new Date(endDateInput).getTime() / 1000) + 86400 : null;

    selectedCheckIns.clear();
    selectedCount = 0;
    updateSelectionCounter();

    let filteredCheckIns = sortedCheckIns.filter(checkIn => {
        const checkInTime = checkIn.createdAt._seconds;
        const belongsToClient = selectedClient
            ? checkIn.midias.some(photo => photo.cliente === selectedClient)
            : true;
        const belongsToPanel = selectedPanel ? checkIn.panelName === selectedPanel : true;
        const isWithinDateRange =
            (!startDate || checkInTime >= startDate) &&
            (!endDate || checkInTime <= endDate);

        return belongsToClient && belongsToPanel && isWithinDateRange;
    });

    if (filteredCheckIns.length === 0) {
        document.getElementById("checkins-list").innerHTML = "<p>Nenhum check-in encontrado.</p>";
        return;
    }
    document.getElementById("error-message").innerText = "";
    sortedCheckIns = filteredCheckIns.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds);
    currentPage = 1;
    setupPagination(sortedCheckIns);
    renderPaginatedCheckIns(sortedCheckIns, currentPage);
}

function updateSelectionCounter() {
    let counter = document.getElementById("contador");

    counter.textContent = selectedCount > 0 ? `(${selectedCount})` : "";
}

document.getElementById("view-checkins-button").addEventListener("click", async () => {
    document.getElementById("realizar-checkin").style.display = "none";
    document.getElementById("checkin-history").style.display = "block";

    checkIns = await fetchCheckIns();
    sortedCheckIns = checkIns.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds);
});

document.getElementById("apply-date-filter").addEventListener("click", () => {
    
    selectedClient = document.getElementById("client-selector").value;
    if (selectedClient === "") {
        alert("Selecione pelo menos um cliente.");
        return;
    }
    selectedPanel = document.getElementById("panel-selector").value;
    const startDateInput = document.getElementById("start-date").value;
    const endDateInput = document.getElementById("end-date").value;
    selectedCheckbox = {};
    selectedCount = 0;
    updateSelectionCounter();
    document.getElementById("components-checkin").style.display = "block";


    filterCheckIns(selectedClient, selectedPanel, startDateInput, endDateInput);
});

function renderPaginatedCheckIns(checkIns, page) {
    const selectionButton = document.getElementById("toggle-selection");
    selectionButton.style.display = "flex";

    const checkinsList = document.getElementById("checkins-list");
    checkinsList.innerHTML = "";

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const paginatedCheckIns = checkIns.slice(startIndex, endIndex);

    if (paginatedCheckIns.length === 0) {
        checkinsList.innerHTML = "<p>Nenhum check-in encontrado.</p>";
        return;
    }

    paginatedCheckIns.forEach((checkIn) => {
        const listItem = document.createElement("li");
        listItem.classList.add("checkin-item");
        listItem.setAttribute("data-checkin-id", checkIn.id);
        listItem.setAttribute("data-panel-name", checkIn.panelName.toLowerCase());

        // const isChecked = selectedCheckbox[checkIn.id] ? "checked" : "";
        listItem.innerHTML = `
            <div style="display: flex; align-items: center;">
                <input type="checkbox" class="checkin-checkbox" data-checkin-id="${checkIn.id}" 
                    style="margin-right: 10px; ${selectionMode ? 'display: block;' : 'display: none;'}">
                <div>
                    <p><strong>Painel:</strong> ${checkIn.panelName || checkIn.panelId}</p>
                    <p><strong>Data:</strong> ${new Date(checkIn.createdAt._seconds * 1000).toLocaleString()}</p>
                    <button class="view-details-button" data-checkin-id="${checkIn.id}">
                        Ver detalhes <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;

        checkinsList.appendChild(listItem);
    });

    setupDetailsToggle();

    document.querySelectorAll(".checkin-checkbox").forEach(checkbox => {
        const checkInId = checkbox.getAttribute("data-checkin-id");
        const emailButtonContainer = document.getElementById("send-email-button-multi");
        const exportPdfButton = document.getElementById("export-pdf-button-multi");
        const deleteButton = document.getElementById("delete-checkin-button-multi");

        // Adiciona o evento apenas se ainda não foi adicionado
        checkbox.addEventListener("change", (event) => {
            if (event.target.checked) {
                const checkInData = checkIns.find(checkin => checkin.id === checkInId);

                if (checkInData) {
                    selectedCheckbox[checkInId] = checkInData; 
                }
            } else {
                delete selectedCheckbox[checkInId];
            }

            selectedCount = Object.keys(selectedCheckbox).length;
            updateSelectionCounter();
            
            if (selectedCount > 0) {
                emailButtonContainer.style.display = "inline-flex";
                exportPdfButton.style.display = "inline-flex";
                deleteButton.style.display = "inline-flex";
            } else {
                emailButtonContainer.style.display = "none";
                exportPdfButton.style.display = "none";
                deleteButton.style.display = "none";
            }
            // console.log("checkins selecionados: ", selectedCount)
        });

        checkbox.checked = !!selectedCheckbox[checkInId];
    });
}

const emailForm = document.getElementById("enviar-email-multi");
const loadingMail = document.getElementById("loading-mail-multi");
const confirmSendEmail = document.getElementById("confirmSendEmail-multi");
const emailButtonContainer = document.getElementById("send-email-button-multi");

emailButtonContainer.addEventListener("click", () => {
    emailForm.style.display = "block";
});

confirmSendEmail.addEventListener("click", async () => {
    if (selectedCount === 0) {
        alert("Selecione pelo menos um check-in para enviar.");
        return;
    }

    const mailClient = document.getElementById("clientEmail-multi").value.trim();
    const mailSeller = document.getElementById("sellerEmail-multi").value.trim();

    if (!mailClient || !mailSeller) {
        alert("Os e-mails são obrigatórios.");
        return;
    }

    loadingMail.style.display = "block";
    emailForm.style.display = "none";
    const checkInsArray = Object.values(selectedCheckbox);

    await sendMailCheckin(mailClient, mailSeller, checkInsArray);
    loadingMail.style.display = "none";
    emailButtonContainer.style.display = "none";
    document.getElementById("toggle-selection").click(); // para recolher os checkbox
    selectedCheckbox = {}; // zerar os ids armazenados
    updateSelectionCounter(); // atualizar o contador
});

function setupPagination(checkIns) {
    totalPages = Math.ceil(checkIns.length / itemsPerPage);
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = ""; // Limpar paginação anterior

    renderPagination(totalPages, currentPage);
}

function renderPagination(totalPages, currentPage) {
    const paginationContainer = document.querySelector(".pagination-container");
    paginationContainer.innerHTML = "";

    const createButton = (page, text = page, isActive = false) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.className = `pagination-button${isActive ? " active" : ""}`;
        button.addEventListener("click", () => {
            goToPage(page);
        });
        return button;
    };

    // Botões de paginação compacta
    if (currentPage > 2) paginationContainer.appendChild(createButton(1));
    if (currentPage > 3) paginationContainer.appendChild(createDots());

    if (currentPage > 1) paginationContainer.appendChild(createButton(currentPage - 1));
    paginationContainer.appendChild(createButton(currentPage, currentPage, true));
    if (currentPage < totalPages) paginationContainer.appendChild(createButton(currentPage + 1));

    if (currentPage < totalPages - 2) paginationContainer.appendChild(createDots());
    if (currentPage < totalPages - 1) paginationContainer.appendChild(createButton(totalPages));
}

function goToPage(page) {
    currentPage = page;
    selectedCheckIns.clear();
    selectedCount = 0;
    renderPaginatedCheckIns(sortedCheckIns, currentPage);
    renderPagination(totalPages, currentPage);
}

function createDots() {
    const dots = document.createElement("span");
    dots.textContent = "...";
    dots.className = "pagination-dots";
    return dots;
}

function filterCheckIns(client, panel, startDateInput, endDateInput) {
    
    // Atualiza os check-ins ordenados antes de filtrar
    sortedCheckIns = checkIns.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds);

    const startDate = startDateInput ? new Date(startDateInput).getTime() / 1000 : null;
    const endDate = endDateInput ? (new Date(endDateInput).getTime() / 1000) + 86400 : null;

    selectedCheckIns.clear();

    let filteredCheckIns = sortedCheckIns.filter(checkIn => {
        const checkInTime = checkIn.createdAt._seconds;
        const belongsToClient = client ? checkIn.midias.some(photo => photo.cliente === client) : true;
        const belongsToPanel = panel ? checkIn.panelName === panel : true;
        const isWithinDateRange =
            (!startDate || checkInTime >= startDate) &&
            (!endDate || checkInTime <= endDate);

        return belongsToClient && belongsToPanel && isWithinDateRange;
    });


    if (filteredCheckIns.length === 0) {
        document.getElementById("checkins-list").innerHTML = "<p>Nenhum check-in encontrado.</p>";
        return;
    }

    document.getElementById("error-message").innerText = "";
    sortedCheckIns = filteredCheckIns;
    currentPage = 1;
    setupPagination(sortedCheckIns);
    renderPaginatedCheckIns(sortedCheckIns, currentPage);
}

document.getElementById("clear-filters").addEventListener("click", async () => {
    clearFilters();
});

function clearFilters() {
    
    document.getElementById("start-date").value = "";
    document.getElementById("end-date").value = "";
    document.getElementById("client-selector").value = "";
    document.getElementById("panel-selector").innerHTML = `<option value="">Todos</option>`;
    document.getElementById("panel-selector").disabled = true;
    document.getElementById("error-message").innerText = "";
    document.getElementById("checkins-list").innerHTML = "";
    document.getElementById("components-checkin").style.display = "none"; 

    selectedCheckIns.clear();
    
    currentPage = 1;
    sortedCheckIns = checkIns.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds);

    populateClientSelector();  // Atualiza os clientes disponíveis

}

function setupDetailsToggle() {
    const checkinsList = document.getElementById("checkins-list");

    const newCheckinsList = checkinsList.cloneNode(true);
    checkinsList.parentNode.replaceChild(newCheckinsList, checkinsList);

    newCheckinsList.addEventListener("click", (event) => {
        const detailsButton = event.target.closest(".view-details-button");
        if (!detailsButton) return;

        const listItem = detailsButton.closest(".checkin-item");
        const checkInId = detailsButton.getAttribute("data-checkin-id");

        selectedCheckIn = sortedCheckIns.find((checkIn) => checkIn.id === checkInId);

        if (!selectedCheckIn) {
            console.warn(`Nenhum check-in encontrado para o ID: ${checkInId}`);
            return;
        }

        toggleCheckInDetails(selectedCheckIn, listItem, detailsButton);
    });
}

function toggleCheckInDetails(checkIn, listItem, detailsButton) {
    const existingDetails = listItem.nextElementSibling;
    if (existingDetails && existingDetails.classList.contains("checkin-details")) {
        existingDetails.remove();
        detailsButton.classList.remove("open");
        detailsButton.innerHTML = `Ver detalhes <i class="fas fa-chevron-right"></i>`;
        return;
    }

    document.querySelectorAll(".checkin-details").forEach(detail => detail.remove());
    document.querySelectorAll(".view-details-button").forEach(button => button.classList.remove("open"));

    const detailsItem = document.createElement("li");
    detailsItem.classList.add("checkin-details");
    
    const filteredPhotos = selectedClient === ""
        ? checkIn.midias
        : checkIn.midias.filter(photo => {
            const client = photo.cliente ? photo.cliente : "Desconhecido";
            return client.toLowerCase() === selectedClient.toLowerCase();
        });

    const buttonsAndLoading = `
        <div class="details-container">
            <h3>Detalhes do Check-In</h3>
            <div style="margin-bottom: 10px;">
                <button class="export-button" data-checkin-id="${checkIn.id}">
                    <i class="fas fa-file-pdf"></i> Exportar PDF
                </button>
                <div id="loading-pdf" class="loading-pdf" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i> Gerando PDF...
                </div>
                <button class="send-mail-button" data-checkin-id="${checkIn.id}">
                    <i class="fas fa-envelope"></i> Enviar para cliente
                </button>
                <div id="enviar-email" style="width: fit-content; display: none;">
                    <div>
                        <label for="clientEmail" style="font-weight: bold;">Email do Cliente:</label>
                        <input type="email" id="clientEmail" placeholder="Digite o email do cliente" required="" style="margin: 5px 0; padding: 5px; width: 100%;">
                    </div>
                    <div>
                        <label for="sellerEmail" style="font-weight: bold;">Email do Vendedor:</label>
                        <input type="email" id="sellerEmail" placeholder="Digite o email do vendedor" required="" style="margin: 5px 0; padding: 5px; width: 100%;">
                    </div>
                    <button id="confirmSendEmail" class="confirmSendEmail">
                        Confirmar Envio
                    </button>
                </div>        
                <div id="loading-mail" class="loading-mail" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i> Enviando e-mail...
                </div>
            </div>
        `;

        // Parte 2: Corpo do relatório
        const reportBody = `
            <p><strong>Painel:</strong> ${checkIn.panelName || checkIn.panelId}</p>
            <p><strong>Data:</strong> ${new Date(checkIn.createdAt._seconds * 1000).toLocaleString()}</p>
            <ul class="checkin-gallery">
            ${filteredPhotos.map(photo => `
                <li>
                    <p><strong>Mídia:</strong> ${photo.nomeMidia || photo.idMidia}</p>
                    <p><strong>Cliente:</strong> ${photo.cliente || "-"}</p>
                    <div class="detail-item">
                        
                        <!-- Preview da Mídia -->
                        <div class="photo-group">
                            <p><strong>Preview:</strong></p>
                            <div style="display: flex;"> 
                                <img src="${THUMB_URL}/i_${photo.idMidia}.png" alt="Preview da Mídia" class="clickable-image" data-src="${THUMB_URL}/i_${photo.idMidia}.png">
                            </div>
                        </div>
                        
                        <!-- Fotos da Mídia -->
                        <div class="media-section" style="margin-top: 15px;overflow: hidden;">
                            <h4>Fotos da Mídia:</h4>
                            <div class="media-gallery">
                                ${photo.fotosMidia.map(foto => `
                                    <div class="media-item">
                                        <img src="${foto.url}" alt="Foto Mídia" class="clickable-image" data-src="${foto.url}">
                                        <div class="timestamp-overlay">${new Date(foto.timestamp).toLocaleString()}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                        
                        <!-- Fotos do Entorno -->
                        <div class="media-section">
                            <h4>Fotos do Entorno:</h4>
                            <div class="media-gallery">
                                ${photo.fotosEntorno.map(foto => `
                                    <div class="media-item">
                                        <img src="${foto.url}" alt="Foto Entorno" class="clickable-image" data-src="${foto.url}">
                                        <div class="timestamp-overlay">${new Date(foto.timestamp).toLocaleString()}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                        
                        <!-- Vídeos da Mídia -->
                        <div class="media-section">
                            <h4>Vídeos da Mídia:</h4>
                            <div class="media-gallery-video">
                                ${photo.videosMidia.map(video => `
                                    <div class="media-item-video">
                                        <video controls muted class="video-element">
                                            <source src="${API_URL}/proxy?url=${video.url}" type="video/mp4">
                                        </video>
                                        <div class="timestamp-overlay">${new Date(video.timestamp).toLocaleString()}</div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>
                    </div>
                </li>
            `).join("")}
        </ul>
    </div>
`;
    detailsItem.innerHTML = buttonsAndLoading + reportBody;

    detailsItem.querySelectorAll(".clickable-image").forEach((img) => {
        img.addEventListener("click", (event) => {
            openImageModal(event.target.getAttribute("data-src"));
        });
    })
    
    listItem.insertAdjacentElement("afterend", detailsItem);

    document.addEventListener("click", (event) => {
        if (event.target && event.target.id === "close-modal") {
            const modal = document.getElementById("image-modal");
            if (modal) {
                modal.style.display = "none";
            }
        }
    });

    detailsItem.querySelector(".export-button").addEventListener("click", async () => {
        const exportButton = detailsItem.querySelector(".export-button");
        const loadingDiv = detailsItem.querySelector(".loading-pdf");
    
        try {
            exportButton.disabled = true;
            loadingDiv.style.display = "inline-flex";
            await downloadCheckinPDF(checkIn);
        } catch (error) {
            console.error("Erro ao gerar o PDF:", error);
            alert("Erro ao gerar o PDF. Por favor, tente novamente.");
        } finally {
            exportButton.disabled = false;
            loadingDiv.style.display = "none";
        }
    });

    detailsItem.querySelector(".send-mail-button").addEventListener("click", async () => {
        await sendEmail(checkIn);
    });

    detailsButton.classList.add("open");
    detailsButton.innerHTML = `Recolher detalhes <i class="fas fa-chevron-right"></i>`;
}

async function sendEmail(checkin){
    // Verifica se os inputs já foram criados para evitar duplicações
    let emailInputContainer = document.getElementById("enviar-email");
    emailInputContainer.style.display == "block" ?
        emailInputContainer.style.display = "none" :
        emailInputContainer.style.display = "block"
        
    // Adiciona o evento de clique ao botão de confirmação
    const confirmButton = document.getElementById("confirmSendEmail");

    // Remove qualquer listener existente antes de adicionar um novo
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    const newConfirmButton = document.getElementById("confirmSendEmail");

    // Adiciona o evento de clique ao botão de confirmação
    newConfirmButton.addEventListener("click", async () => {
        const clientEmail = document.getElementById("clientEmail").value.trim();
        const sellerEmail = document.getElementById("sellerEmail").value.trim();
        const loadingDiv = document.getElementById("loading-mail");

        if (!clientEmail || !sellerEmail) {
            alert("Por favor, preencha ambos os campos de email.");
            return;
        }

        try {
            loadingDiv.style.display = "inline-flex";
            newConfirmButton.disabled = true;

            await sendMailCheckin(clientEmail, sellerEmail, checkin);

            emailInputContainer.style.display = "none";
        } catch (error) {
            console.error("Erro ao enviar e-mail:", error);
            alert("Erro ao enviar e-mail. Por favor, tente novamente.");
        } finally {
            loadingDiv.style.display = "none";
            newConfirmButton.disabled = false;
        }
    });
}

function openImageModal(imageSrc) {
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    modalImage.src = imageSrc;
    modal.style.display = "block";
}

document.getElementById("image-modal").addEventListener("click", (event) => {
    if (event.target === document.getElementById("image-modal")) {
        document.getElementById("image-modal").style.display = "none";
    }
});

async function downloadCheckinPDF(checkIn) {
    const checkInPayload = Array.isArray(checkIn) ? checkIn : [checkIn];
    const response = await fetch(`${API_URL}/pdf/checkin/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkInPayload)
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dia = moment(new Date).utcOffset(-3).format("DD-MM")
        const clienteNome = checkInPayload[0]?.midias?.[0]?.cliente || "desconhecido";
        a.download = `relatorio_checkin-${clienteNome}-${dia}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } else {
        console.error("Erro ao gerar o PDF de check-in");
    }
}

async function deleteCheckin(checkinId) {
    if (!checkinId) {
        alert("Erro: ID do check-in inválido.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/checkin/${checkinId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
        } else {
            const errorData = await response.json();
            alert(`Erro ao excluir check-in: ${errorData.error || "Erro desconhecido."}`);
            console.error("Erro ao excluir check-in:", errorData);
        }
    } catch (error) {
        console.error("Erro na requisição de exclusão:", error);
        alert("Erro ao conectar ao servidor. Tente novamente.");
    }
}

const exportPdfButton = document.getElementById("export-pdf-button-multi");
const deleteButton = document.getElementById("delete-checkin-button-multi");

exportPdfButton.addEventListener("click", async () => {
    if (selectedCount === 0) {
        alert("Selecione pelo menos um check-in para exportar.");
        return;
    }

    const selectedCheckinsArray = Object.values(selectedCheckbox);

    document.getElementById("loading-pdf-multi").style.display = "inline-flex";
    exportPdfButton.disabled = true; 

    try {
        await downloadCheckinPDF(selectedCheckinsArray);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error.message);
    } finally {
        document.getElementById("loading-pdf-multi").style.display = "none";
        exportPdfButton.disabled = false; 
    }
});

deleteButton.addEventListener("click", async () => {
    const checkinIds = Object.keys(selectedCheckbox);

    if (checkinIds.length === 0) {
        alert("Nenhum check-in selecionado para exclusão.");
        return;
    }

    const confirmDelete = confirm(`Tem certeza que deseja excluir ${checkinIds.length} check-in(s)?`);
    if (!confirmDelete) return;

    try {
        for (let checkinId of checkinIds) {
            await deleteCheckin(checkinId);

            // Remove o item da lista
            const checkinItem = document.querySelector(`li[data-checkin-id="${checkinId}"]`);
            if (checkinItem) {
                checkinItem.remove();
            }
            delete selectedCheckbox[checkinId];
        }

        alert("Check-ins excluídos com sucesso!");
        updateSelectionCounter();

        deleteButton.style.display = "none";
    } catch (error) {
        console.error("Erro na requisição de exclusão:", error);
        alert("Erro ao conectar ao servidor. Tente novamente.");
    }
});