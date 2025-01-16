// const API_URL_MEDIA = "https://api.4yousee.com.br/v1/medias";
// const API_URL_PANELS = "https://api.4yousee.com.br/v1/players";

// async function loadFilters() {
//   const mediaList = document.getElementById("media-list");
//   const panelList = document.getElementById("panel-list");

//   try {
//     // Carregar todas as mídias
//     const mediaResponse = await fetch(API_URL_MEDIA, { headers: { "Secret-Token": "67c7c2b91bcb315098bb733c07ce8b90" } });
//     const mediaData = await mediaResponse.json();
//     const mediaHTML = mediaData.results.map(media => `
//       <label class="media-item">
//         <input type="checkbox" name="media" value="${media.id}">
//         <img src="https://sobremidia.4yousee.com.br/common/videos/thumbnails/i_${media.id}.png" alt="${media.name}">
//         <p>${media.name}</p>
//       </label>
//     `).join("");
//     mediaList.innerHTML = mediaHTML;

//     // Carregar todos os painéis
//     const panelResponse = await fetch(API_URL_PANELS, { headers: { "Secret-Token": "a59202bc005fa4305916bca8aa7e31d0" } });
//     const panelData = await panelResponse.json();
//     const panelHTML = panelData.results.map(panel => `
//       <label class="panel-item">
//         <input type="checkbox" name="panel" value="${panel.id}">
//         <p>${panel.name}</p>
//       </label>
//     `).join("");
//     panelList.innerHTML = panelHTML;

//     setupCheckboxLogic();
//     setupToggleLogic();
//     setupSearchLogic();
//   } catch (error) {
//     console.error("[ERROR] Falha ao carregar mídias e painéis:", error);
//   }
// }

// /**
//  * Configura a lógica de seleção para "Todos" e as demais opções.
//  */
// function setupCheckboxLogic() {
//   const allMediaCheckbox = document.getElementById("allMedia");
//   const mediaCheckboxes = document.querySelectorAll('input[name="media"]');
//   const allPanelsCheckbox = document.getElementById("allPanels");
//   const panelCheckboxes = document.querySelectorAll('input[name="panel"]');

//   // Lógica para mídias
//   allMediaCheckbox.addEventListener("change", () => {
//     if (allMediaCheckbox.checked) {
//       mediaCheckboxes.forEach(checkbox => checkbox.checked = false);
//     }
//   });

//   mediaCheckboxes.forEach(checkbox => {
//     checkbox.addEventListener("change", () => {
//       if (Array.from(mediaCheckboxes).some(checkbox => checkbox.checked)) {
//         allMediaCheckbox.checked = false;
//       } else {
//         allMediaCheckbox.checked = true;
//       }
//     });
//   });

//   // Lógica para painéis
//   allPanelsCheckbox.addEventListener("change", () => {
//     if (allPanelsCheckbox.checked) {
//       panelCheckboxes.forEach(checkbox => checkbox.checked = false);
//     }
//   });

//   panelCheckboxes.forEach(checkbox => {
//     checkbox.addEventListener("change", () => {
//       if (Array.from(panelCheckboxes).some(checkbox => checkbox.checked)) {
//         allPanelsCheckbox.checked = false;
//       } else {
//         allPanelsCheckbox.checked = true;
//       }
//     });
//   });
// }

// /**
//  * Configura a lógica de expandir/recolher para mídias e painéis.
//  */
// function setupToggleLogic() {
//   const mediaList = document.getElementById("media-list");
//   const panelList = document.getElementById("panel-list");
//   const toggleMediaButton = document.getElementById("toggle-media");
//   const togglePanelButton = document.getElementById("toggle-panels");

//   let isMediaExpanded = false;
//   let isPanelExpanded = false;

//   toggleMediaButton.addEventListener("click", () => {
//     isMediaExpanded = !isMediaExpanded;
//     const items = Array.from(mediaList.children);
//     items.forEach((item, index) => {
//       item.style.display = isMediaExpanded || index < 5 ? "block" : "none";
//     });
//     toggleMediaButton.textContent = isMediaExpanded ? "Recolher" : "Expandir";
//   });

//   togglePanelButton.addEventListener("click", () => {
//     isPanelExpanded = !isPanelExpanded;
//     const items = Array.from(panelList.children);
//     items.forEach((item, index) => {
//       item.style.display = isPanelExpanded || index < 5 ? "block" : "none";
//     });
//     togglePanelButton.textContent = isPanelExpanded ? "Recolher" : "Expandir";
//   });

//   // Mostrar os 5 primeiros itens por padrão
//   Array.from(mediaList.children).forEach((item, index) => {
//     if (index >= 5) item.style.display = "none";
//   });
//   Array.from(panelList.children).forEach((item, index) => {
//     if (index >= 5) item.style.display = "none";
//   });
// }

// /**
//  * Configura a lógica de pesquisa para mídias e painéis.
//  */
// function setupSearchLogic() {
//   const mediaSearch = document.getElementById("media-search");
//   const panelSearch = document.getElementById("panel-search");
//   const mediaItems = document.querySelectorAll(".media-item");
//   const panelItems = document.querySelectorAll(".panel-item");

//   mediaSearch.addEventListener("input", (event) => {
//     const searchTerm = event.target.value.toLowerCase();
//     mediaItems.forEach(item => {
//       const mediaName = item.querySelector("p").textContent.toLowerCase();
//       item.style.display = mediaName.includes(searchTerm) ? "block" : "none";
//     });
//   });

//   panelSearch.addEventListener("input", (event) => {
//     const searchTerm = event.target.value.toLowerCase();
//     panelItems.forEach(item => {
//       const panelName = item.querySelector("p").textContent.toLowerCase();
//       item.style.display = panelName.includes(searchTerm) ? "block" : "none";
//     });
//   });
// }

// // Carregar os filtros na inicialização
// loadFilters();
