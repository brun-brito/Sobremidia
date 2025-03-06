const usersList = document.getElementById("users-list");
const searchUser = document.getElementById("search-user");
const filterRole = document.getElementById("filter-role");
const toggleFormButton = document.getElementById("toggle-form");
const signupForm = document.getElementById("signup-form");
const paginationDiv = document.getElementById("pagination");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const currentPageText = document.getElementById("current-page");
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");

// const API_URL = "http://127.0.0.1:5001/sobremidia-ce/us-central1/v1";
const API_URL = "https://us-central1-sobremidia-ce.cloudfunctions.net/v1";

let users = [];
let filteredUsers = [];
let currentPage = 1;
const usersPerPage = 5;

// Alternar visibilidade do formulário de cadastro
toggleFormButton.addEventListener("click", () => {
    if (signupForm.style.display === "none" || signupForm.style.display === "") {
        signupForm.style.display = "block";
        toggleFormButton.textContent = "Fechar Formulário";
    } else {
        signupForm.style.display = "none";
        toggleFormButton.textContent = "Adicionar Usuário";
    }
});


// Carregar usuários do Firestore
async function carregarUsuarios() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/user`);
        users = await response.json();
        filtrarUsuarios();
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
    } finally {
        hideLoading();
    }
}

// 🔹 Filtrar usuários por nome e função
function filtrarUsuarios() {
    const searchTerm = searchUser.value.toLowerCase();
    const selectedRole = filterRole.value;

    filteredUsers = users.filter(user =>
        (user.nome?.toLowerCase().includes(searchTerm) || user.email?.toLowerCase().includes(searchTerm)) &&
        (selectedRole === "" || user.funcao === selectedRole)
    );

    currentPage = 1;
    renderizarUsuarios();
}

// 🔹 Renderizar usuários com paginação
function renderizarUsuarios() {
    paginationDiv.style.display = filteredUsers.length > usersPerPage ? "flex" : "none";
    usersList.innerHTML = "";
    const startIndex = (currentPage - 1) * usersPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

    paginatedUsers.forEach(user => {
        const tr = document.createElement("tr");
        tr.id = `row-${user.id}`;
        tr.innerHTML = `
            <td>${user.nome}</td>
            <td>${user.email}</td>
            <td>${user.funcao}</td>
            <td>
                <button onclick="editarUsuario('${user.id}', '${user.nome}', '${user.email}', '${user.funcao}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirUsuario('${user.id}')">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        usersList.appendChild(tr);
    });

    currentPageText.textContent = currentPage;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = startIndex + usersPerPage >= filteredUsers.length;
}

// 🔹 Criar novo usuário
signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const funcao = document.getElementById("funcao").value;

    try {
        showLoading();

        const response = await fetch(`${API_URL}/user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, senha, funcao })
        });

        const result = await response.json(); // Captura a resposta da API

        if (!response.ok) {
            throw new Error(result.error || "Erro ao cadastrar usuário");
        }

        alert("Usuário cadastrado com sucesso!");
        signupForm.style.display = "none";
        carregarUsuarios();
    } catch (error) {
        showError(error.message); // Exibe o erro real da API
    } finally {
        hideLoading();
    }
});

function showError(message) {
    const errorMessage = document.getElementById("error-message");
    if (errorMessage) {
        errorMessage.innerText = message;
        errorMessage.style.display = "block";
    }
}

// 🔹 Editar usuário
async function editarUsuario(id, nome, email, funcao) {
    const row = document.getElementById(`row-${id}`);

    // Criar inputs dentro da própria linha da tabela
    row.innerHTML = `
        <td><input type="text" id="edit-nome-${id}" value="${nome}"></td>
        <td><input type="email" id="edit-email-${id}" value="${email}"></td>
        <td>
            <select id="edit-funcao-${id}">
                <option value="administrador" ${funcao === "administrador" ? "selected" : ""}>Administrador</option>
                <option value="tecnico" ${funcao === "tecnico" ? "selected" : ""}>Técnico</option>
                <option value="OPEC" ${funcao === "OPEC" ? "selected" : ""}>OPEC</option>
            </select>
        </td>
        <td>
            <button onclick="salvarEdicaoUsuario('${id}')">
                <i class="fas fa-save"></i>
            </button>
            <button onclick="cancelarEdicaoUsuario('${id}', '${nome}', '${email}', '${funcao}')">
                <i class="fas fa-times"></i>
            </button>
        </td>
    `;
}

// Função para salvar edição
async function salvarEdicaoUsuario(id) {
    const novoNome = document.getElementById(`edit-nome-${id}`).value;
    const novoEmail = document.getElementById(`edit-email-${id}`).value;
    const novaFuncao = document.getElementById(`edit-funcao-${id}`).value;

    try {
        showLoading();
        const response = await fetch(`${API_URL}/user/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: novoNome, email: novoEmail, funcao: novaFuncao })
        });

        if (!response.ok) throw new Error("Erro ao atualizar usuário");

        alert("Usuário atualizado com sucesso!");
        carregarUsuarios();
    } catch (error) {
        alert(error.message);
    } finally {
        hideLoading();
    }
}

// Função para cancelar edição e restaurar a linha original
function cancelarEdicaoUsuario(id, nome, email, funcao) {
    const row = document.getElementById(`row-${id}`);
    row.innerHTML = `
        <td>${nome}</td>
        <td>${email}</td>
        <td>${funcao}</td>
        <td>
            <button onclick="editarUsuario('${id}', '${nome}', '${email}', '${funcao}')">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="excluirUsuario('${id}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;
}

// 🔹 Excluir usuário
async function excluirUsuario(id) {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
        try {
            showLoading();
            const response = await fetch(`${API_URL}/user/${id}`, { method: "DELETE" });

            if (!response.ok) throw new Error("Erro ao excluir usuário");

            alert("Usuário excluído com sucesso!");
            carregarUsuarios();
        } catch (error) {
            alert(error.message);
        } finally {
            hideLoading();
        }
    }
}

// 🔹 Paginação
prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderizarUsuarios();
    }
});

nextPageBtn.addEventListener("click", () => {
    if ((currentPage - 1) * usersPerPage + usersPerPage < filteredUsers.length) {
        currentPage++;
        renderizarUsuarios();
    }
});

// 🔹 Filtros
searchUser.addEventListener("input", filtrarUsuarios);
filterRole.addEventListener("change", filtrarUsuarios);

// Carregar dados ao iniciar
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("usuarios").doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().funcao.toLowerCase() !== "administrador") {
                alert("Acesso negado! Apenas administradores podem gerenciar usuários.");
                window.location.href = "profile.html";
            }
        });

        carregarUsuarios();
    }
});

function showLoading() {
    if (loadingSpinner) loadingSpinner.style.display = "flex";
    if (errorMessage) errorMessage.style.display = "none";
}

function hideLoading() {
    if (loadingSpinner) loadingSpinner.style.display = "none";
}

function showError(message) {
    if (errorMessage) {
        errorMessage.innerText = message;
        errorMessage.style.display = "block";
    }
}