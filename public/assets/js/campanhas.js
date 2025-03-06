// document.addEventListener('DOMContentLoaded', async () => {
//     const loadingSpinnerContainer = document.getElementById('loading-spinner');
//     let todasCampanhas = [];

//     async function buscarCampanhas(razaoSocial) {
//         try {
//             const response = await fetch('https://api.4yousee.com.br/v1/medias', {
//                 headers: {
//                     'Secret-Token': '67c7c2b91bcb315098bb733c07ce8b90'
//                 }
//             });
//             if (!response.ok) {
//                 throw new Error('Erro ao buscar campanhas.');
//             }
//             const data = await response.json();
//             return data.results.filter(campanha =>
//                 campanha.categories.some(categoria => categoria.name === razaoSocial)
//             );
//         } catch (error) {
//             console.error('Erro:', error);
//             return [];
//         }
//     }

//     function calcularStatusCampanha(startDate, endDate) {
//         const hoje = new Date();
//         const inicio = startDate ? new Date(`${startDate}T00:00:00`) : null;
//         const fim = endDate ? new Date(`${endDate}T23:59:59`) : null;

//         if (!inicio && !fim) {
//             return { status: 'Data não especificada', tipo: '' };
//         }

//         if (inicio && inicio > hoje) {
//             const diasParaInicio = Math.ceil((inicio - hoje) / (1000 * 60 * 60 * 24));
//             return { status: `Campanha se inicia em ${diasParaInicio} dias`, tipo: 'aguardando' };
//         }

//         if (fim && fim < hoje) {
//             const diasExpirados = Math.floor((hoje - fim) / (1000 * 60 * 60 * 24));
//             return { status: `Expirada há ${diasExpirados} dias`, tipo: 'expirada' };
//         }

//         if (fim && fim >= hoje) {
//             const diasRestantes = Math.floor((fim - hoje) / (1000 * 60 * 60 * 24)) + 1;
//             return { status: `${diasRestantes} dias restantes`, tipo: 'ativa' };
//         }

//         return { status: 'Ativa', tipo: 'ativa' };
//     }

//     function exibirCampanhas(campanhas) {
//         const campanhasContainer = document.getElementById('campaigns-section-content');
//         campanhasContainer.innerHTML = ''; 

//         if (campanhas.length === 0) {
//             campanhasContainer.innerHTML = '<p>Nenhuma campanha encontrada para a sua empresa.</p>';
//         } else {
//             campanhas.forEach(campanha => {
//                 const { status, tipo } = calcularStatusCampanha(campanha.schedule.startDate, campanha.schedule.endDate);

//                 const campanhaElement = document.createElement('div');
//                 campanhaElement.className = `campanha ${tipo}`;
//                 campanhaElement.innerHTML = `
//                     <h3>${campanha.name}</h3>
//                     <p><strong>Duração:</strong> ${campanha.durationInSeconds} segundos</p>
//                     <p><strong>Arquivo:</strong> ${campanha.file}</p>
//                     <p><strong>Empresa:</strong> ${campanha.categories.map(cat => cat.name).join(', ')}</p>
//                     <p><strong>Data de Início:</strong> ${campanha.schedule.startDate || 'N/A'}</p>
//                     <p><strong>Data de Fim:</strong> ${campanha.schedule.endDate || 'N/A'}</p>
//                     <p class="status ${tipo}"><strong>Status:</strong> ${status}</p>
//                 `;
//                 campanhasContainer.appendChild(campanhaElement);
//             });
//         }

//         loadingSpinnerContainer.style.display = 'none';
//     }

//     function filtrarCampanhas(tipoFiltro, termoPesquisa = '') {
//         let campanhasFiltradas = todasCampanhas;

//         if (tipoFiltro !== 'todas') {
//             campanhasFiltradas = campanhasFiltradas.filter(campanha => {
//                 const { tipo } = calcularStatusCampanha(campanha.schedule.startDate, campanha.schedule.endDate);
//                 return tipo === tipoFiltro;
//             });
//         }

//         if (termoPesquisa) {
//             campanhasFiltradas = campanhasFiltradas.filter(campanha =>
//                 campanha.name.toLowerCase().includes(termoPesquisa.toLowerCase())
//             );
//         }

//         exibirCampanhas(campanhasFiltradas);
//     }

//     document.querySelector('.nav-link[data-section="campaigns-section"]').addEventListener('click', async function() {
//         const razaoSocial = document.getElementById('user-razao').innerText;

//         loadingSpinnerContainer.style.display = 'flex';

//         todasCampanhas = await buscarCampanhas(razaoSocial);
//         exibirCampanhas(todasCampanhas);
//     });

//     document.querySelectorAll('.filter-btn').forEach(button => {
//         button.addEventListener('click', function() {
//             document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
//             this.classList.add('active');
//             const tipoFiltro = this.getAttribute('data-filter');
//             const termoPesquisa = document.getElementById('search-input').value;
//             filtrarCampanhas(tipoFiltro, termoPesquisa);
//         });
//     });

//     document.getElementById('search-input').addEventListener('input', function() {
//         const tipoFiltro = document.querySelector('.filter-btn.active') ? document.querySelector('.filter-btn.active').getAttribute('data-filter') : 'todas';
//         const termoPesquisa = this.value;
//         filtrarCampanhas(tipoFiltro, termoPesquisa);
//     });
// });

// document.addEventListener('DOMContentLoaded', async () => {
//     const campanhasContainer = document.getElementById('campaigns-section-content');
//     let todasCampanhas = [];
//     let clientesDaAgencia = [];

//     async function obterClientesDaAgencia(cnpjAgencia) {
//         try {
//             const response = await fetch('https://api.4yousee.com.br/v1/medias/categories', {
//                 headers: { 'Secret-Token': '67c7c2b91bcb315098bb733c07ce8b90' }
//             });
//             const data = await response.json();

//             // Encontra a categoria da agência pelo CNPJ
//             const agencia = data.results.find(category => {
//                 const [cnpj] = category.name.split('-');
//                 return cnpj === cnpjAgencia && category.parent === null;
//             });

//             if (agencia && agencia.children && agencia.children.length > 0) {
//                 const filtroClientes = document.getElementById('filter-dropdown');
//                 filtroClientes.style.display = 'block';
//                 clientesDaAgencia = agencia.children.map(childId => {
//                     const cliente = data.results.find(cat => cat.id === childId);
//                     return cliente ? cliente.name : null;
//                 }).filter(cliente => cliente !== null);
//             } else {
//                 // Significa que é um cliente independente, sem agência
//             }

//             return clientesDaAgencia;
//         } catch (error) {
//             console.error('Erro ao obter clientes da agência:', error);
//             return [];
//         }
//     }

//     async function buscarMidiasDosClientes(cnpjAgencia) {
//         try {
//             const response = await fetch('https://api.4yousee.com.br/v1/medias', {
//                 headers: { 'Secret-Token': 'a59202bc005fa4305916bca8aa7e31d0' }
//             });
//             const data = await response.json();

//             // Inclua o CNPJ da agência e todos os clientes da agência na lista de categorias para filtrar
//             const cnpjsParaFiltrar = [cnpjAgencia, ...clientesDaAgencia.map(cliente => cliente.split('-')[0])];

//             // Filtra mídias que pertencem às categorias dos clientes da agência
//             todasCampanhas = data.results.filter(media => {
//                 const pertence = media.categories.some(category => {
//                     const [cnpj] = category.name.split('-');
//                     return cnpjsParaFiltrar.includes(cnpj);
//                 });
//                 return pertence;
//             });

//             exibirClientesNoDropdown(clientesDaAgencia);
//             return todasCampanhas;
//         } catch (error) {
//             console.error('Erro ao buscar mídias:', error);
//             return [];
//         }
//     }

//     function calcularStatusCampanha(startDate, endDate) {
//         const hoje = new Date();
//         const inicio = startDate ? new Date(`${startDate}T00:00:00`) : null;
//         const fim = endDate ? new Date(`${endDate}T23:59:59`) : null;

//         if (!inicio && !fim) {
//             return { status: 'Data não especificada', tipo: '' };
//         }

//         if (inicio && inicio > hoje) {
//             const diasParaInicio = Math.ceil((inicio - hoje) / (1000 * 60 * 60 * 24));
//             return { status: `Campanha se inicia em ${diasParaInicio} dias`, tipo: 'aguardando' };
//         }

//         if (fim && fim < hoje) {
//             const diasExpirados = Math.floor((hoje - fim) / (1000 * 60 * 60 * 24));
//             return { status: `Expirada há ${diasExpirados} dias`, tipo: 'expirada' };
//         }

//         if (fim && fim >= hoje) {
//             const diasRestantes = Math.floor((fim - hoje) / (1000 * 60 * 60 * 24)) + 1;
//             return { status: `${diasRestantes} dias restantes`, tipo: 'ativa' };
//         }

//         return { status: 'Ativa', tipo: 'ativa' };
//     }

//     function exibirClientesNoDropdown(clientes) {
//         const clientFilter = document.getElementById('client-filter');
//         clientFilter.innerHTML = '<option value="todos">Todos</option>';
//         clientes.forEach(cliente => {
//             clientFilter.innerHTML += `<option value="${cliente}">${cliente}</option>`;
//         });
//     }

//     function exibirCampanhas(campanhas) {
//         campanhasContainer.innerHTML = '';

//         if (campanhas.length === 0) {
//             console.warn('Nenhuma campanha encontrada para inserção.');
//             campanhasContainer.innerHTML = '<p>Não encontramos nenhuma campanha para a sua empresa. Se você possui campanhas registradas, tente clicar no botão de atualizar acima. Em caso de persistência do erro, entre em contato.</p>';
//         } else {
//             campanhas.forEach(campanha => {
//                 const { status, tipo } = calcularStatusCampanha(campanha.schedule.startDate, campanha.schedule.endDate);

//                 const campanhaElement = document.createElement('div');
//                 campanhaElement.className = `campanha ${tipo}`;
//                 campanhaElement.innerHTML = `
//                     <h4>${campanha.name}</h4>
//                     <p><strong>Duração:</strong> ${campanha.durationInSeconds} segundos</p>
//                     <p><strong>Arquivo:</strong> ${campanha.file}</p>
//                     <p><strong>Empresa:</strong> ${campanha.categories.map(cat => cat.name).join(', ')}</p>
//                     <p><strong>Data de Início:</strong> ${campanha.schedule.startDate || 'N/A'}</p>
//                     <p><strong>Data de Fim:</strong> ${campanha.schedule.endDate || 'N/A'}</p>
//                     <p class="status ${tipo}"><strong>Status:</strong> ${status}</p>
//                 `;
//                 campanhasContainer.appendChild(campanhaElement);
//             });
//         }
//     }

//     function filtrarCampanhas(tipoFiltro, clienteFiltro = 'todos', termoPesquisa = '') {
//         let campanhasFiltradas = todasCampanhas;

//         if (tipoFiltro !== 'todas') {
//             campanhasFiltradas = campanhasFiltradas.filter(campanha => {
//                 const { tipo } = calcularStatusCampanha(campanha.schedule.startDate, campanha.schedule.endDate);
//                 return tipo === tipoFiltro;
//             });
//         }

//         if (clienteFiltro !== 'todos') {
//             campanhasFiltradas = campanhasFiltradas.filter(campanha =>
//                 campanha.categories.some(categoria => categoria.name === clienteFiltro)
//             );
//         }

//         if (termoPesquisa) {
//             campanhasFiltradas = campanhasFiltradas.filter(campanha =>
//                 campanha.name.toLowerCase().includes(termoPesquisa.toLowerCase())
//             );
//         }

//         exibirCampanhas(campanhasFiltradas);
//     }

//     // Evento de clique para carregar campanhas quando o usuário abre a seção de campanhas
//     document.querySelector('.nav-link[data-section="campaigns-section"]').addEventListener('click', async function () {
//         const cnpj = document.getElementById('user-cnpj').innerText.trim();

//         campanhasContainer.innerHTML = '<p>Carregando<span class="loading-dots"></span></p>';

//         clientesDaAgencia = await obterClientesDaAgencia(cnpj);
//         todasCampanhas = await buscarMidiasDosClientes(cnpj);
//         exibirCampanhas(todasCampanhas);
//     });

//     // Evento de clique para o botão de atualização
//     document.getElementById('refresh-btn').addEventListener('click', async function () {
//         const cnpj = document.getElementById('user-cnpj').innerText.trim();

//         campanhasContainer.innerHTML = '<p>Carregando<span class="loading-dots"></span></p>';

//         clientesDaAgencia = await obterClientesDaAgencia(cnpj);
//         todasCampanhas = await buscarMidiasDosClientes(cnpj);
//         exibirCampanhas(todasCampanhas);
//     });

//     document.querySelectorAll('.filter-btn').forEach(button => {
//         button.addEventListener('click', function () {
//             document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
//             this.classList.add('active');
//             const tipoFiltro = this.getAttribute('data-filter');
//             const clienteFiltro = document.getElementById('client-filter').value;
//             const termoPesquisa = document.getElementById('search-input').value;
//             filtrarCampanhas(tipoFiltro, clienteFiltro, termoPesquisa);
//         });
//     });

//     document.getElementById('client-filter').addEventListener('change', function () {
//         const tipoFiltro = document.querySelector('.filter-btn.active') ? document.querySelector('.filter-btn.active').getAttribute('data-filter') : 'todas';
//         const clienteFiltro = this.value;
//         const termoPesquisa = document.getElementById('search-input').value;
//         filtrarCampanhas(tipoFiltro, clienteFiltro, termoPesquisa);
//     });

//     document.getElementById('search-input').addEventListener('input', function () {
//         const tipoFiltro = document.querySelector('.filter-btn.active') ? document.querySelector('.filter-btn.active').getAttribute('data-filter') : 'todas';
//         const clienteFiltro = document.getElementById('client-filter').value;
//         const termoPesquisa = this.value;
//         filtrarCampanhas(tipoFiltro, clienteFiltro, termoPesquisa);
//     });
// });
