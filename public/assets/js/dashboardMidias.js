const TOKEN = 'a59202bc005fa4305916bca8aa7e31d0';
const TOKEN2 = '67c7c2b91bcb315098bb733c07ce8b90';

let currentSortColumn = '';
let currentSortDirection = 'asc';

function setLoadingMessage(msg) {
  const el = document.getElementById('loading-message');
  if (el) el.textContent = msg;
}

let currentPageIndex = 1;
let pageSize = 10;
let paginatedMedias = [];

let allMedias = [];

function aplicarFiltros() {
  const textoLivre = document.getElementById('barraPesquisa').value.toLowerCase();
  const getChecked = (containerId) => {
    return Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)).map(cb => cb.value);
  };

  // Garante que pelo menos "Todos" esteja marcado em cada filtro se nenhum estiver marcado
  ['checkboxFiltroTexto', 'checkboxFiltroCliente', 'checkboxFiltroPainel'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const checked = Array.from(checkboxes).some(cb => cb.checked);
    const todosCb = container.querySelector('input[type="checkbox"][value="__ALL__"]');
    if (!checked && todosCb) {
      todosCb.checked = true;
      todosCb.closest('label')?.classList.add('checked');
    }
  });

  const textoSelecionado = getChecked('checkboxFiltroTexto').map(v => v.toLowerCase());
  const clientesSelecionados = getChecked('checkboxFiltroCliente');
  const paineisSelecionados = getChecked('checkboxFiltroPainel');

  const filtrado = allMedias.filter(media => {
    const cliente = media.name?.split('-')[0]?.trim() || '';
    const texto = `${media.name} ${media.painel} ${cliente}`.toLowerCase();
    const inicio = media.schedule.startDate || '';
    const fim = media.schedule.endDate || '';

    const matchTexto = textoSelecionado.includes('__all__') || textoSelecionado.length === 0 || textoSelecionado.some(t => texto.includes(t));
    const matchCliente = clientesSelecionados.includes('__ALL__') || clientesSelecionados.length === 0 || clientesSelecionados.includes(cliente);
    const matchPainel = paineisSelecionados.includes('__ALL__') || paineisSelecionados.length === 0 || paineisSelecionados.includes(media.painel);
    const matchLivre = textoLivre === '' || texto.includes(textoLivre);

    return matchTexto && matchCliente && matchPainel && matchLivre;
  });

  // Sempre mostrar todas as opções possíveis nos filtros (não filtrar as opções)
  preencherFiltros(allMedias);
  paginateAndRender(filtrado);
}

function preencherFiltros(medias, reset = false) {
  const unicos = (array) => [...new Set(array.filter(Boolean))];
  const getChecked = (containerId) =>
    Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)).map(cb => cb.value);
  // Add checkboxes to container
  const addCheckboxes = (containerId, values, selectedValues = []) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    // "Todos" checkbox
    const inputAll = document.createElement('input');
    inputAll.type = 'checkbox';
    inputAll.value = '__ALL__';
    inputAll.id = `${containerId}__ALL__`;
    inputAll.name = `${containerId}[]`;
    inputAll.checked = reset || selectedValues.includes('__ALL__') || selectedValues.length === 0;

    const labelAll = document.createElement('label');
    labelAll.htmlFor = inputAll.id;
    const spanAll = document.createElement('span');
    spanAll.textContent = 'Todos';
    if (inputAll.checked) labelAll.classList.add('checked');

    inputAll.addEventListener('change', () => {

      const allLabels = container.querySelectorAll('label');
      const otherCheckboxes = container.querySelectorAll('input[type="checkbox"]:not([value="__ALL__"])');

      if (inputAll.checked) {
        // Marca todos
        otherCheckboxes.forEach(cb => {
          cb.checked = true;
          cb.closest('label')?.classList.add('checked');
        });
        inputAll.indeterminate = false;
        labelAll.classList.add('checked');
      } else {
        // Desmarca todos
        otherCheckboxes.forEach(cb => {
          cb.checked = false;
          cb.closest('label')?.classList.remove('checked');
        });
        inputAll.indeterminate = true;
        labelAll.classList.remove('checked');
      }

      const checkedNow = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

      aplicarFiltros();
    });
    labelAll.appendChild(inputAll);
    labelAll.appendChild(spanAll);
    container.appendChild(labelAll);
    // Ordem alfabetica
    values = values.filter(v => v && v !== '__ALL__').sort((a, b) => a.localeCompare(b));
    values.forEach(val => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = val;
      input.id = `${containerId}_${val}`;
      input.name = `${containerId}[]`;

      const label = document.createElement('label');
      label.htmlFor = input.id;
      const span = document.createElement('span');
      span.textContent = val;
      const isTodos = selectedValues.includes('__ALL__') || selectedValues.length === 0;
      input.checked = !isTodos && selectedValues.includes(val);
      
      if (input.checked) {
        label.classList.add('checked');
      }
        input.addEventListener('change', () => {
        // Remove "Todos" se algum checkbox individual for clicado
        const todosCb = container.querySelector('input[type="checkbox"][value="__ALL__"]');
        if (input.value !== '__ALL__' && todosCb && todosCb.checked) {
          todosCb.checked = false;
          todosCb.closest('label').classList.remove('checked');
        }

        if (input.checked) {
          label.classList.add('checked');
        } else {
          label.classList.remove('checked');
        }

        // Se nenhum estiver marcado, ativa novamente o "Todos"
        const outrosMarcados = Array.from(container.querySelectorAll('input[type="checkbox"]')).filter(cb => cb.checked && cb.value !== '__ALL__');
        if (outrosMarcados.length === 0 && todosCb) {
          todosCb.checked = true;
          todosCb.closest('label').classList.add('checked');
        }

        aplicarFiltros();
      });
      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });
  };
  const textos = unicos(medias.map(m => m.name));
  const clientes = unicos(medias.map(m => m.name?.split('-')[0]?.trim()));
  const paineis = unicos(medias.map(m => m.painel));

  addCheckboxes('checkboxFiltroTexto', textos, reset ? ['__ALL__'] : getChecked('checkboxFiltroTexto'));
  addCheckboxes('checkboxFiltroCliente', clientes, reset ? ['__ALL__'] : getChecked('checkboxFiltroCliente'));
  addCheckboxes('checkboxFiltroPainel', paineis, reset ? ['__ALL__'] : getChecked('checkboxFiltroPainel'));
}

function renderPaginationControls(totalPages) {
  let container = document.querySelector('.pagination');

  if (!container) {
    container = document.createElement('div');
    container.className = 'pagination';
    document.querySelector('main').appendChild(container);
  }

  container.innerHTML = '';

  const createButton = (label, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    if (active) btn.classList.add('active');
    if (disabled) btn.disabled = true;
    btn.onclick = () => {
      currentPageIndex = page;
      renderTable(paginatedMedias);
      renderPaginationControls(totalPages);
    };
    return btn;
  };

  // Sempre mostra a primeira página
  container.appendChild(createButton('1', 1, false, currentPageIndex === 1));

  // Elipse após a primeira se necessário
  if (currentPageIndex > 3) {
    const dots = document.createElement('span');
    dots.textContent = '...';
    container.appendChild(dots);
  }

  // Página anterior
  if (currentPageIndex > 2) {
    container.appendChild(createButton(currentPageIndex - 1, currentPageIndex - 1));
  }

  // Página atual
  if (currentPageIndex !== 1 && currentPageIndex !== totalPages) {
    container.appendChild(createButton(currentPageIndex, currentPageIndex, false, true));
  }

  // Página seguinte
  if (currentPageIndex < totalPages - 1) {
    container.appendChild(createButton(currentPageIndex + 1, currentPageIndex + 1));
  }

  // Elipse antes da última se necessário
  if (currentPageIndex < totalPages - 2) {
    const dots = document.createElement('span');
    dots.textContent = '...';
    container.appendChild(dots);
  }

  // Sempre mostra a última página se houver mais de 1
  if (totalPages > 1) {
    container.appendChild(createButton(`${totalPages}`, totalPages, false, currentPageIndex === totalPages));
  }
}

function paginateAndRender(medias) {
  paginatedMedias = medias;
  const totalPages = Math.ceil(medias.length / pageSize);
  renderPaginationControls(totalPages);
  renderTable(medias);

  // Adiciona ícones de ordenação dinâmicos aos cabeçalhos
  const columnMap = ['index', 'painel', 'cliente', 'name', 'startDate', 'endDate', 'slotsAtivos', 'ocupacao'];
  const thElements = document.querySelectorAll('#mediaTable thead th');
  thElements.forEach((th, index) => {
    const field = columnMap[index];
    if (field === 'index') return;

    th.style.cursor = 'pointer';
    th.onclick = () => {
      if (currentSortColumn === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = field;
        currentSortDirection = 'asc';
      }
      aplicarFiltros();
    };

    // Limpa ícone antigo
    th.innerHTML = th.textContent.trim();

    if (field === currentSortColumn) {
      const icon = document.createElement('i');
      icon.className = currentSortDirection === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
      icon.style.marginLeft = '6px';
      icon.style.color = '#ffffff';
      th.appendChild(icon);
    }
  });
}

function renderTable(medias) {
  const tbody = document.querySelector('#mediaTable tbody');
  tbody.innerHTML = '';

  const start = (currentPageIndex - 1) * pageSize;
  const end = start + pageSize;

  const sortedMedias = [...medias].sort((a, b) => {
    let aVal = a[currentSortColumn];
    let bVal = b[currentSortColumn];

    if (currentSortColumn === 'startDate' || currentSortColumn === 'endDate') {
      aVal = new Date(a.schedule?.[currentSortColumn] || '');
      bVal = new Date(b.schedule?.[currentSortColumn] || '');
    } else if (currentSortColumn === 'cliente') {
      aVal = a.name?.split('-')?.[0]?.trim();
      bVal = b.name?.split('-')?.[0]?.trim();
    } else if (currentSortColumn === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (currentSortColumn === 'painel') {
      aVal = a.painel;
      bVal = b.painel;
    } else if (currentSortColumn === 'ocupacao') {
      aVal = parseFloat(a.ocupacao) || 0;
      bVal = parseFloat(b.ocupacao) || 0;
    } else if (currentSortColumn === 'slotsAtivos') {
      aVal = parseInt(a.slotsAtivos) || 0;
      bVal = parseInt(b.slotsAtivos) || 0;
    }

    if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const currentItems = sortedMedias.slice(start, end);

  if (currentItems.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td colspan="8" style="text-align: center; padding: 1rem;">Nenhum resultado encontrado para a busca realizada.</td>
    `;
    tbody.appendChild(row);
    return;
  }

  currentItems.forEach((media, index) => {
    const cliente = media.name?.split('-')?.[0]?.trim() || 'Desconhecido';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${media.painel || 'N/A'}</td>
      <td>${cliente}</td>
      <td>${media.name || 'N/A'}</td>
      <td>${media.schedule?.startDate || 'N/A'}</td>
      <td>${media.schedule?.endDate || 'N/A'}</td>
      <td>${media.slotsAtivos || 0}</td>
      <td>${media.ocupacao || 0}%</td>
    `;
    tbody.appendChild(row);
  });
}

(async function () {

  function configurarComportamentoFiltro(id) {
    const select = document.getElementById(id);
    select.addEventListener('click', (e) => {
      const clickedOption = e.target;
      if (clickedOption.tagName === 'OPTION' && clickedOption.selected && clickedOption.value !== '__ALL__') {
        // Verifica se será desmarcado após o clique
        setTimeout(() => {
          const algumaSelecionada = Array.from(select.options).some(o => o.selected && o.value !== clickedOption.value);
          if (!algumaSelecionada) {
            const allOption = select.querySelector('option[value="__ALL__"]');
            if (allOption) allOption.selected = true;
          }
          aplicarFiltros();
        }, 0);
      }
    });

    select.addEventListener('change', () => {
      const allOption = select.querySelector('option[value="__ALL__"]');
      const selectedValues = Array.from(select.selectedOptions).map(opt => opt.value);

      if (selectedValues.includes('__ALL__') && selectedValues.length > 1) {
        allOption.selected = false;
      }

      if (!selectedValues.length) {
        allOption.selected = true;
      }

      aplicarFiltros();
    });
  }

  let tokenIndex = 0;
  const TOKENS = [TOKEN, TOKEN2];

  async function fetchWithRetries(url) {
    let attempts = 0;
    const maxAttempts = 5;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < maxAttempts) {
      try {
        const tokenToUse = TOKENS[tokenIndex % TOKENS.length];
        tokenIndex++;
        const res = await fetch(url, { headers: { 'Secret-Token': tokenToUse } });

        if (res.status === 429) {
          const wait = 1000 + attempts * 500;
          console.warn(`429 Too Many Requests para ${url}, aguardando ${wait}ms`);
          await delay(wait);
          attempts++;
        } else if (!res.ok) {
          console.error(`Erro ao buscar ${url}: ${res.statusText}`);
          return { results: [] };
        } else {
          return await res.json();
        }
      } catch (err) {
        console.error(`Erro de rede ao acessar ${url}:`, err);
        await delay(1000);
        attempts++;
      }
    }

    return { results: [] };
  }

  async function fetchAllPaginated(baseUrl) {
    let currentPage = 1;
    let results = [];
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const res = await fetchWithRetries(`${baseUrl}?page=${currentPage}`);
      totalPages = res.totalPages || 1;
      results = results.concat(res.results || []);
      currentPage++;
    }

    return results;
  }

  setLoadingMessage('Buscando dados dos players...');
  const playerList = await fetchAllPaginated("https://api.4yousee.com.br/v1/players");

  setLoadingMessage('Buscando playlists e mídias ativas...');
  const playlistList = await fetchAllPaginated("https://api.4yousee.com.br/v1/playlists");
  window.playerList = playerList;
  window.playlistList = playlistList;
  // Mapeia: playlistId => [painelName1, painelName2]
  const playlistToPainel = {};
  playerList.forEach(player => {
    const painelName = player.name;
    const playlists = Object.values(player.playlists || {});
    playlists.forEach(pl => {
      if (!playlistToPainel[pl.id]) playlistToPainel[pl.id] = new Set();
      playlistToPainel[pl.id].add(painelName);
    });
  });

  window.playlistToPainel = playlistToPainel;

  // Encontra as mídias nas playlists
  const painelMedias = [];

  playlistList.forEach(playlist => {
    const playlistId = playlist.id;
    const items = playlist.items || [];

    items.forEach(item => {
      const hoje = new Date().toISOString().split('T')[0];

      if (item.type === 'media') {
        const isActive = !item.contentSchedule?.endDate || item.contentSchedule.endDate > hoje;
        if (isActive) {
          const painels = playlistToPainel[playlistId];
          if (painels) {
            painels.forEach(painelName => {
              painelMedias.push({
                painel: painelName,
                name: item.name,
                schedule: {
                  startDate: item.contentSchedule?.startDate || 'N/A',
                  endDate: item.contentSchedule?.endDate || 'N/A'
                },
                slotsAtivos: 0,
                ocupacao: 0
              });
            });
          }
        }
      } else if (item.type === 'carousel') {
        const subItems = item.items || [];
        subItems.forEach(media => {
          const isActive = !media.contentSchedule?.endDate || media.contentSchedule.endDate > hoje;
          if (media.type === 'media' && isActive) {
            const painels = playlistToPainel[playlistId];
            if (painels) {
              painels.forEach(painelName => {
                painelMedias.push({
                  painel: painelName,
                  name: media.name,
                  schedule: {
                    startDate: media.contentSchedule?.startDate || 'N/A',
                    endDate: media.contentSchedule?.endDate || 'N/A'
                  },
                  slotsAtivos: 0,
                  ocupacao: 0
                });
              });
            }
          }
        });
      }
    });
  });

  setLoadingMessage('Calculando taxa de ocupação e organizando dados...');

  document.getElementById('itemsPerPage').addEventListener('change', (e) => {
    pageSize = parseInt(e.target.value, 10);
    currentPageIndex = 1;
    aplicarFiltros();
  });

  document.getElementById('barraPesquisa').addEventListener('input', () => {
    aplicarFiltros();
  });

  document.getElementById('limparFiltrosBtn').addEventListener('click', () => {
    [
      'checkboxFiltroTexto',
      'checkboxFiltroCliente',
      'checkboxFiltroPainel',
    ].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;
      Array.from(container.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
        cb.checked = false;
        cb.closest('label')?.classList.remove('checked');
      });
      const todosCb = container.querySelector('input[type="checkbox"][value="__ALL__"]');
      if (todosCb) {
        todosCb.checked = true;
        todosCb.closest('label')?.classList.add('checked');
      }
    });
    document.getElementById('barraPesquisa').value = '';
    aplicarFiltros();
  });

  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'flex';

  setLoadingMessage('Formatando dados para exibição...');
  setTimeout(() => {
    allMedias = painelMedias;

    const painelContagem = {};
    painelMedias.forEach(m => {
      if (!painelContagem[m.painel]) painelContagem[m.painel] = 0;
      painelContagem[m.painel]++;
    });
    painelMedias.forEach(m => {
      m.slotsAtivos = painelContagem[m.painel];
      m.ocupacao = painelContagem[m.painel] ? ((painelContagem[m.painel] / 12) * 100).toFixed(0) : 0;
    });

    preencherFiltros(painelMedias, true);
    aplicarFiltros();
    loadingElement.style.display = 'none';
  }, 300);
})();

function toggleFiltros() {
  const filtros = document.getElementById('filtrosAvancados');
  const header = document.querySelector('.filtros-header');
  if (filtros.classList.contains('hidden')) {
    filtros.classList.remove('hidden');
    header.classList.remove('collapsed');
  } else {
    filtros.classList.add('hidden');
    header.classList.add('collapsed');
  }
}