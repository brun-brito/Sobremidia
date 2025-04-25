const API_URL_PAINEIS = `${API_URL}/paineis`;
const ITEMS_PER_PAGE = 10;

let todosPaineis = [];
let paginaAtual = 1;
let termoBusca = "";

document.addEventListener("DOMContentLoaded", () => {
  carregarPaineis();

  document.getElementById("painelForm").addEventListener("submit", salvarPainel);
  document.getElementById("filtroPainel").addEventListener("input", (e) => {
    termoBusca = e.target.value.toLowerCase();
    paginaAtual = 1;
    renderizarPaineis();
  });
});

async function carregarPaineis() {
  mostrarLoading(true);
  try {
    const res = await fetch(API_URL_PAINEIS);
    todosPaineis = await res.json();
    renderizarPaineis();
  } catch (err) {
    alert("Erro ao carregar painéis.");
  }
  mostrarLoading(false);
}

function renderizarPaineis() {
  const lista = document.getElementById("painelList");
  lista.innerHTML = "";

  const filtrados = todosPaineis.filter(p =>
    p.nameManager.toLowerCase().includes(termoBusca) ||
    p.local.toLowerCase().includes(termoBusca)
  );

  const inicio = (paginaAtual - 1) * ITEMS_PER_PAGE;
  const pagina = filtrados.slice(inicio, inicio + ITEMS_PER_PAGE);

  pagina.forEach((painel) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${painel.nameManager}</td>
      <td>${painel.idManager || ""}</td>
      <td>${painel.local || ""}</td>
      <td>${painel.sensor || ""}</td>
      <td>
        <button onclick="editarPainel('${painel.id}', ${painel.idManager}, '${painel.local}', '${painel.nameManager}', '${painel.sensor}')" class="btn-icone editar">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="excluirPainel('${painel.id}')" class="btn-icone deletar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    lista.appendChild(tr);
  });

  renderizarPaginacao(filtrados.length);
}

function renderizarPaginacao(totalItens) {
    const container = document.getElementById("paginacao");
    if (!container) return;
  
    container.innerHTML = "";
  
    const totalPaginas = Math.ceil(totalItens / ITEMS_PER_PAGE);
  
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement("button");
      btn.innerText = i;
      btn.className = "btn-pagina";
      if (i === paginaAtual) btn.classList.add("ativo");
  
      btn.addEventListener("click", () => {
        paginaAtual = i;
        renderizarPaineis();
      });
  
      container.appendChild(btn);
    }
}

async function salvarPainel(e) {
  e.preventDefault();
  const id = document.getElementById("painelId").value;
  const dados = {
    idManager: Number(document.getElementById("idManager").value),
    local: document.getElementById("local").value,
    nameManager: document.getElementById("nameManager").value,
    sensor: document.getElementById("sensor").value,
  };

  const metodo = id ? "PUT" : "POST";
  const url = id ? `${API_URL_PAINEIS}/${id}` : API_URL_PAINEIS;

  await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  document.getElementById("painelForm").reset();
  paginaAtual = 1;
  carregarPaineis();
}

function editarPainel(id, idManager, local, nameManager, sensor) {
    const linha = document.querySelector(`button[onclick*="${id}"]`).closest("tr");
  
    linha.innerHTML = `
      <td><input type="text" value="${nameManager}" id="edit-nameManager-${id}"></td>
      <td><input type="number" value="${idManager}" id="edit-idManager-${id}"></td>
      <td><input type="text" value="${local}" id="edit-local-${id}"></td>
      <td><input type="text" value="${sensor}" id="edit-sensor-${id}"></td>
      <td>
        <button onclick="salvarEdicaoPainel('${id}')" class="btn-icone salvar"><i class="fa-solid fa-check"></i></button>
        <button onclick="cancelarEdicaoPainel('${id}')" class="btn-icone cancelar"><i class="fa-solid fa-xmark"></i></button>
      </td>
    `;
}

async function salvarEdicaoPainel(id) {
    const dados = {
      nameManager: document.getElementById(`edit-nameManager-${id}`).value,
      idManager: Number(document.getElementById(`edit-idManager-${id}`).value),
      local: document.getElementById(`edit-local-${id}`).value,
      sensor: document.getElementById(`edit-sensor-${id}`).value,
    };
  
    await fetch(`${API_URL_PAINEIS}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
  
    carregarPaineis();
}

function cancelarEdicaoPainel(id) {
    carregarPaineis();
  }

async function excluirPainel(id) {
  if (confirm("Tem certeza que deseja excluir este painel?")) {
    await fetch(`${API_URL_PAINEIS}/${id}`, { method: "DELETE" });
    carregarPaineis();
  }
}

function mostrarLoading(ativo) {
    const loading = document.getElementById("loading");
    if (loading) {
      loading.style.display = ativo ? "block" : "none";
    }
}

function abrirFormulario() {
    const form = document.getElementById("painelForm");
    form.classList.toggle("ativo");

    // scroll suave até o formulário
    if (form.classList.contains("ativo")) {
        form.scrollIntoView({ behavior: "smooth" });
    }
}