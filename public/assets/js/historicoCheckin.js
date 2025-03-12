let currentPage = 1;
const itemsPerPage = 5;
let sortedCheckIns;
let totalPages;
let selectedClient = "";
let selectedCheckIn;

document.getElementById("view-checkins-button").addEventListener("click", async () => {
    document.getElementById("realizar-checkin").style.display = "none";
    document.getElementById("checkin-history").style.display = "block";

    const checkIns = await fetchCheckIns();
    sortedCheckIns = checkIns.sort((a, b) => b.createdAt._seconds - a.createdAt._seconds);
    
    document.getElementById("suggestions-list").innerHTML = "";
});

document.getElementById("search-input").addEventListener("input", () => {
    const searchInput = document.getElementById("search-input").value.toLowerCase();
    const suggestionsList = document.getElementById("suggestions-list");

    if (searchInput === "") {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
        return;
    }

    const clients = Array.from(new Set(sortedCheckIns.flatMap(checkIn =>
        checkIn.midias.map(photo => photo.cliente ? photo.cliente : "Desconhecido")
    )));

    const filteredClients = clients.filter(client => client.toLowerCase().includes(searchInput));

    if (filteredClients.length > 0 && searchInput !== "") {
        suggestionsList.innerHTML = filteredClients.map(client => `<li style="padding: 8px; cursor: pointer;">${client}</li>`).join("");
        suggestionsList.style.display = "block";

        Array.from(suggestionsList.children).forEach(item => {
            item.addEventListener("click", () => {
                selectedClient = item.textContent;
                document.getElementById("search-input").value = selectedClient;
                suggestionsList.style.display = "none";
                document.getElementById("error-message").innerText = "";
            });
        });
    } else {
        suggestionsList.style.display = "none";
    }
});

document.getElementById("apply-date-filter").addEventListener("click", () => {
    const searchInput = document.getElementById("search-input").value.trim().toLowerCase();
    const suggestionsList = document.getElementById("suggestions-list");

    if (searchInput === "") {
        document.getElementById("error-message").innerText = "Por favor, digite um cliente antes de filtrar.";
        document.getElementById("checkins-list").innerHTML = "";
        return;
    }

    const isClientValid = sortedCheckIns.some(checkIn =>
        checkIn.midias.some(photo => {
            const client = photo.cliente ? photo.cliente.toLowerCase() : "desconhecido";
            return client === searchInput;
        })
    );

    if (!isClientValid) {
        document.getElementById("error-message").innerText = `Nenhum check-in encontrado para o cliente '${searchInput}'.`;
        document.getElementById("checkins-list").innerHTML = "";
        return;
    }

    document.getElementById("error-message").innerText = "";
    suggestionsList.style.display = "none";
    filterCheckIns(sortedCheckIns);
});

function renderPaginatedCheckIns(checkIns, page) {
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
        listItem.innerHTML = `
            <div>
                <p><strong>Painel:</strong> ${checkIn.panelName || checkIn.panelId}</p>
                <p><strong>Data:</strong> ${new Date(checkIn.createdAt._seconds * 1000).toLocaleString()}</p>
                <button class="view-details-button" data-checkin-id="${checkIn.id}">
                    Ver detalhes <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
        checkinsList.appendChild(listItem);
    });

    setupDetailsToggle();
}

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
    renderPaginatedCheckIns(sortedCheckIns, currentPage);
    renderPagination(totalPages, currentPage);
}

function createDots() {
    const dots = document.createElement("span");
    dots.textContent = "...";
    dots.className = "pagination-dots";
    return dots;
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

function filterCheckIns(checkIns) {
    const searchInput = document.getElementById("search-input").value.trim().toLowerCase();
    const startDateInput = document.getElementById("start-date").value;
    const endDateInput = document.getElementById("end-date").value;

    const startDate = startDateInput ? new Date(startDateInput).getTime() / 1000 : null;
    const endDate = endDateInput ? (new Date(endDateInput).getTime() / 1000) + 86400 : null;

    const filteredCheckIns = checkIns.filter(checkIn => {
        const checkInTime = checkIn.createdAt._seconds;

        const hasClient = checkIn.midias.some(photo => {
            const client = photo.cliente ? photo.cliente.toLowerCase() : "desconhecido";
            return client === searchInput;
        });

        const isWithinDateRange =
            (!startDate || checkInTime >= startDate) &&
            (!endDate || checkInTime <= endDate);

        return hasClient && isWithinDateRange;
    });

    if (filteredCheckIns.length === 0) {
        document.getElementById("checkins-list").innerHTML = "<p>Nenhum check-in encontrado para o cliente e as datas fornecidas.</p>";
    } else {
        currentPage = 1;
        setupPagination(filteredCheckIns);
        renderPaginatedCheckIns(filteredCheckIns, currentPage);
    }
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
                                        <video controls>
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

document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    document.getElementById("start-date").value = "";
    document.getElementById("end-date").value = "";
    selectedClient = "";
    document.getElementById("error-message").innerText = "";
    document.getElementById("checkins-list").innerHTML = "";
});

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
    const response = await fetch(`${API_URL}/pdf/checkin/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkIn)
    });

    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio_checkin-${checkIn.midias[0].cliente}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } else {
        console.error("Erro ao gerar o PDF de check-in");
    }
}