const API_URL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5001/sobremidia-ce/us-central1/v1"
    : "https://us-central1-sobremidia-ce.cloudfunctions.net/v1";
/*
FUNÇÕES PARA A SEÇÃO DE ENDEREÇOS
*/
let currentSort = {
    tableId: '',
    column: '',
    direction: 'asc'
};
const diasSemanaOrdem = {
    "Domingo": 0,
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    "Sábado": 6
};

let address = [];

function carregarTotal() {
   document.getElementById("totalAudience").innerText = Math.round(dadosApi.total.audience).toLocaleString('pt-BR');
   document.getElementById("totalImpact").innerText = Math.round(dadosApi.total.impact).toLocaleString('pt-BR');
   document.getElementById("frequency").innerText = dadosApi.total.frequency.toLocaleString('pt-BR');
   document.getElementById("dwellTime").innerText = dadosApi.total.dwell_time.toLocaleString('pt-BR') + "s";
   document.getElementById("medianDays").innerText = dadosApi.total.median_days_monitored.toLocaleString('pt-BR');
   document.getElementById("locations").innerText = dadosApi.total.locations.toLocaleString('pt-BR');
}

async function carregarEnderecos() {
  const addressesList = document.getElementById("addressesList");

  const response = await fetch(`${API_URL}/analytics/paineis`);
  const paineis = await response.json();

  address = dadosApi.locations.map(loc => {
      const painel = paineis.find(p => p.local == loc.id);
      return {
          id: loc.id,
          nome: painel ? painel.nameManager : `-`,
          audiencia: Math.round(loc.audience).toLocaleString('pt-BR'),
          impacto: Math.round(loc.impact).toLocaleString('pt-BR'),
          frequencia: loc.frequency.toLocaleString('pt-BR'),
          dwellTime: `${loc.dwell_time}s`,
          medianDays: loc.median_days_monitored.toLocaleString('pt-BR'),
          minDate: loc.min_date.split("-").reverse().join("/"),
          maxDate: loc.max_date.split("-").reverse().join("/")
      };
  });

  addressesList.innerHTML = "";
  address.forEach(loc => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${loc.nome}</td>
          <td>${loc.audiencia}</td>
          <td>${loc.impacto}</td>
          <td>${loc.frequencia}</td>
          <td>${loc.dwellTime}</td>
          <td>${loc.medianDays}</td>
          <td>${loc.minDate}</td>
          <td>${loc.maxDate}</td>
      `;
      addressesList.appendChild(row);
  });
  document.querySelectorAll('.address-table th').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.column;
      const isNumeric = ['audiencia', 'impacto', 'frequencia', 'dwellTime', 'medianDays'].includes(column);
      sortTable('addressesTable', column, isNumeric);
      updateSortIcons('addressesTable', header, column);
    });
  });
  sortTable('addressesTable', 'local', false);
  sortTable('addressesTable', 'local', false); // chama duas vezes pra ficar asc
}

function sortTable(tableId, column, isNumeric) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.querySelectorAll("tbody tr")); 
    const headers = table.querySelectorAll("th");
    const columnIndex = Array.from(headers).findIndex(header => header.dataset.column === column);

    // Ajusta a direção do sort
    if (currentSort.tableId === tableId && currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = { tableId, column, direction: 'asc' };
    }

    // Ordena as linhas
    rows.sort((a, b) => {
        let aValue = a.cells[columnIndex].innerText.trim();
        let bValue = b.cells[columnIndex].innerText.trim();
        
        if (column.toLowerCase().includes("date")) {
            aValue = new Date(aValue.split("/").reverse().join("-"));
            bValue = new Date(bValue.split("/").reverse().join("-"));
            return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (column.toLowerCase().includes("day")) {
            aValue = diasSemanaOrdem[aValue] ?? 7;
            bValue = diasSemanaOrdem[bValue] ?? 7;
            return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (isNumeric) {
            aValue = parseFloat(aValue.replace(/\./g, '').replace(',', '.')) || 0;
            bValue = parseFloat(bValue.replace(/\./g, '').replace(',', '.')) || 0;
            return currentSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            return currentSort.direction === 'asc' 
                ? aValue.localeCompare(bValue) 
                : bValue.localeCompare(aValue);
        }
    });

    // Reanexa as linhas
    rows.forEach(row => table.querySelector("tbody").appendChild(row));
}

function updateSortIcons(tableId, currentHeader, column) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll("th");

    // Remove classes e ícones existentes
    headers.forEach(header => {
        header.classList.remove('asc', 'desc');
        header.querySelector('.sort-icon')?.remove();
    });

    // Adiciona classe (asc ou desc) ao cabeçalho atual
    currentHeader.classList.add(currentSort.direction);

    // Cria ícone
    const sortIcon = document.createElement('span');
    sortIcon.classList.add('sort-icon');
    sortIcon.innerHTML = currentSort.direction === 'asc'
      ? '<i class="fas fa-sort-up"></i>'
      : '<i class="fas fa-sort-down"></i>';

    currentHeader.appendChild(sortIcon);
}

/*
FUNÇÕES PARA DIA E SEMANA
*/
function carregarAudienciaImpacto() {
   const dailyCtx = document.getElementById('dailyChart').getContext('2d');
   const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');

   // Dados para o gráfico diário
   const dailyData = dadosApi.audience_x_impact.daily.map(item => ({
       date: item.date.split("-").reverse().join("/"),
       audience: item.audience,
       impact: item.impact,
       dwell_time: item.dwell_time
   }));

   // Ordena as datas do gráfico diário
   dailyData.sort((a, b) => new Date(a.date.split("/").reverse().join("-")) - new Date(b.date.split("/").reverse().join("-")));

   const dailyLabels = dailyData.map(item => item.date);
   const dailyAudience = dailyData.map(item => item.audience);
   const dailyImpact = dailyData.map(item => item.impact);
   const dailyDwellTime = dailyData.map(item => item.dwell_time);

   // Ajusta o tamanho do container do gráfico diário
  const dailyChartContainer = document.querySelector('.chart-body');
  const totalLabels = dailyLabels.length;
  if (totalLabels > 3) {
    dailyChartContainer.style.width = (800 + (totalLabels - 3) * 40) + 'px';
  }
   
   const dailyDataTable = document.getElementById('dailyDataTable');
   dailyDataTable.innerHTML = '';
   dailyData.forEach(item => {
      dailyDataTable.innerHTML += `<tr>
         <td>${item.date}</td>
         <td>${Math.round(item.audience).toLocaleString('pt-BR')}</td>
         <td>${Math.round(item.impact).toLocaleString('pt-BR')}</td>
         <td>${Math.round(item.dwell_time)}s</td>
      </tr>`;
   });

   document.querySelectorAll('.audience-table th').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.column;
      const isNumeric = ['audience', 'impact'].includes(column);
      sortTable('audienceTable', column, isNumeric);
      updateSortIcons('audienceTable', header, column);
    });
  });

   new Chart(dailyCtx, {
       type: 'bar',
       data: {
           labels: dailyLabels,
           datasets: [
               {
                   label: 'Impactos',
                   data: dailyImpact,
                   backgroundColor: '#4887F3',
                   yAxisID: 'y-axis-impact',
               },
               {
                   label: 'Audiência',
                   data: dailyAudience,
                   backgroundColor: '#35C759',
                   yAxisID: 'y-axis-impact',
               },
               {
                   label: 'Dwell Time',
                   data: dailyDwellTime,
                   type: 'line',
                   borderColor: '#FFA500',
                   backgroundColor: '#FFA500',
                   fill: false,
                   yAxisID: 'y-axis-dwell',
               }
           ]
       },
       options: {
           barPercentage: 0.9,
           categoryPercentage: 0.7,
           aspectRatio: 1,
           responsive: true,
           maintainAspectRatio: false,
           scales: {
               x: {
                   ticks: { 
                       font: {size: 14}, 
                       color: '#ffffff',
                     //   autoSkip: false,
                       maxRotation: 90,
                       minRotation: 30
                   },
                   title: {
                       display: true,
                       text: 'Data',
                       font: {
                           size: 18
                       }
                   }
               },
               'y-axis-impact': {
                   position: 'left',
                   ticks: { font: { size: 14 }, color: '#ffffff' },
                   title: {
                       display: true,
                       text: 'Impactos / Audiência',
                       font: {
                           size: 18
                       }
                   }
               },
               'y-axis-dwell': {
                   position: 'right',
                   ticks: { font: { size: 14}, color: '#ffffff'},
                   title: {
                       display: true,
                       text: 'Dwell Time',
                       font: {
                           size: 18
                       }
                   }
               }
           },
           plugins: {
               legend: { labels: { color: '#ffffff' } },
               tooltip: {
                   callbacks: {
                       label: function(tooltipItem) {
                           return `${tooltipItem.dataset.label}: ${Math.round(tooltipItem.raw).toLocaleString('pt-BR')}`;
                       }
                   }
               }
           }
       }
   });

   // Dados para o gráfico semanal
   
   const ordemDias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
   const weeklyData = dadosApi.audience_x_impact.weekly.map(item => ({
       name: item.name,
       audience: item.audience,
       impact: item.impact,
       dwell_time: item.dwell_time
   }));

   // Organiza os dias da semana na ordem correta
    
   const weeklyDataTable = document.getElementById('weeklyDataTable');
   weeklyDataTable.innerHTML = '';
 
   const weeklyAggregatedData = ordemDias.map(dia => {
       const item = weeklyData.find(data => {
           switch (data.name.toLowerCase()) {
               case 'sunday': return dia === 'Domingo';
               case 'monday': return dia === 'Segunda-feira';
               case 'tuesday': return dia === 'Terça-feira';
               case 'wednesday': return dia === 'Quarta-feira';
               case 'thursday': return dia === 'Quinta-feira';
               case 'friday': return dia === 'Sexta-feira';
               case 'saturday': return dia === 'Sábado';
               default: return false;
           }
        }) || { audience: 0, impact: 0, dwell_time: 0 };
 
        weeklyDataTable.innerHTML += `<tr>
            <td>${dia}</td>
            <td>${Math.round(item.audience).toLocaleString('pt-BR')}</td>
            <td>${Math.round(item.impact).toLocaleString('pt-BR')}</td>
            <td>${Math.round(item.dwell_time)}s</td>
        </tr>`;
  
        return {
            label: dia,
            audience: item.audience,
            impact: item.impact,
            dwell_time: item.dwell_time
        };
    });

   document.querySelectorAll('.audience-table-weekly th').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.dataset.column;
      const isNumeric = ['audience', 'impact'].includes(column);
      sortTable('audienceTable-weekly', column, isNumeric);
      updateSortIcons('audienceTable-weekly', header, column);
    });
  });

   const weeklyLabels = weeklyAggregatedData.map(d => d.label);
   const weeklyAudience = weeklyAggregatedData.map(d => d.audience);
   const weeklyImpact = weeklyAggregatedData.map(d => d.impact);
   const weeklyDwellTime = weeklyAggregatedData.map(d => d.dwell_time);

   new Chart(weeklyCtx, {
       type: 'bar',
       data: {
           labels: weeklyLabels,
           datasets: [
               {
                   label: 'Impactos',
                   data: weeklyImpact,
                   backgroundColor: '#4887F3',
                   yAxisID: 'y-axis-impact',
               },
               {
                   label: 'Audiência',
                   data: weeklyAudience,
                   backgroundColor: '#35C759',
                   yAxisID: 'y-axis-impact',
               },
               {
                   label: 'Dwell Time',
                   data: weeklyDwellTime,
                   type: 'line',
                   borderColor: '#FFA500',
                   backgroundColor: '#FFA500',
                   fill: false,
                   yAxisID: 'y-axis-dwell',
               }
           ]
       },
       options: {
           responsive: true,
           maintainAspectRatio: false,
           scales: {
               x: {
                   ticks: { font: { size: 14}, color: '#ffffff'},
                   title: {
                       display: true,
                       text: 'Dia da semana',
                       font: {
                           size: 18
                       }
                   }
               },
               'y-axis-impact': {
                   position: 'left',
                   ticks: { font: { size: 14}, color: '#ffffff'},
                   title: {
                       display: true,
                       text: 'Impactos / Audiência',
                       font: {
                           size: 18
                       }
                   }
               },
               'y-axis-dwell': {
                   position: 'right',
                   ticks: { font: { size: 14}, color: '#ffffff'},
                   title: {
                       display: true,
                       text: 'Dwell Time',
                       font: {
                           size: 18
                       }
                   }
               }
           },
           plugins: {
               legend: { labels: { color: '#ffffff' } },
               tooltip: {
                   callbacks: {
                       label: function(tooltipItem) {
                           return `${tooltipItem.dataset.label}: ${Math.round(tooltipItem.raw).toLocaleString('pt-BR')}`;
                       }
                   }
               }
           }
       }
   });
}

/*
FUNÇÕES PARA A SEÇÃO DE HORA E TURNO
*/
function carregarAvg() {
   const hourCtx = document.getElementById('hourlyChart').getContext('2d');
   const shiftCtx = document.getElementById('shiftChart').getContext('2d');

   let horas = dadosApi.impacts_per_hour.average.map(item => ({
       hour: parseInt(item.hour),
       impact: item.impact
   }));

   horas.sort((a, b) => a.hour - b.hour);

   const horasFormatadas = horas.map(item => `${item.hour.toString().padStart(2, '0')}:00`);
   const impactosHora = horas.map(item => item.impact);

   const periodosOrdem = ["early_morning", "morning", "afternoon", "night"];
   const periodos = [];
   const impactosPeriodo = [];

   periodosOrdem.forEach(turno => {
       const item = dadosApi.impacts_per_hour.period.find(p => p.name === turno);
       if (item) {
           periodos.push(
               turno === "early_morning" ? "Madrugada" :
               turno === "morning" ? "Manhã" :
               turno === "afternoon" ? "Tarde" :
               "Noite"
           );
           impactosPeriodo.push(item.impact);
       }
   });

   new Chart(hourCtx, {
       type: 'bar',
       data: {
           labels: horasFormatadas,
           datasets: [{
               label: 'Impactos por Hora',
               data: impactosHora,
               backgroundColor: '#4887F3',
               borderRadius: 20,
           }]
       },
       options: {
           responsive: true,
           scales: {
               x: {
                   ticks: { 
                       font: { size: 14, color: '#ffffff' },
                       color: '#ffffff',
                       maxRotation: 0
                   },
                   title: {
                       display: true,
                       text: 'Horário',
                       font: {
                           size: 18
                       }
                   }
               },
               y: { 
                   beginAtZero: true,
                   ticks: { 
                       font: { size: 14, color: '#ffffff' },
                       color: '#ffffff'
                   },
                   title: {
                       display: true,
                       text: 'Impactos',
                       font: {
                           size: 18
                       }
                   }
               }
           },
           plugins: {
               tooltip: {
                   callbacks: {
                       label: function(tooltipItem) {
                           return `${tooltipItem.dataset.label}: ${Math.round(tooltipItem.raw).toLocaleString('pt-BR')}`;
                       }
                   }
               },
               legend: {
                   labels: {
                       color: '#ffffff',
                       font: {
                           size: 14
                       }
                   }
               }
           }
       }
   });

   new Chart(shiftCtx, {
       type: 'bar',
       data: {
           labels: periodos,
           datasets: [{
               label: 'Impactos por Turno',
               data: impactosPeriodo,
               backgroundColor: '#4887F3',
               borderRadius: {
                   topLeft: 100,
                   topRight: 100,
                   bottomLeft: 0,
                   bottomRight: 0
               },
               barPercentage: 1.3,
               categoryPercentage: 0.5,
           }]
       },
       options: {
           responsive: true,
           scales: {
               x: {
                   ticks: { 
                       font: { size: 18, color: '#ffffff' },
                       color: '#ffffff'
                   },
                   title: {
                       display: true,
                       text: 'Turno',
                       font: {
                           size: 18
                       }
                   }
               },
               y: { 
                   beginAtZero: true,
                   ticks: { 
                       font: { size: 18, color: '#ffffff' },
                       color: '#ffffff'
                   },
                   title: {
                       display: true,
                       text: 'Impactos',
                       font: {
                           size: 18
                       }
                   }
               }
           },
           plugins: {
               tooltip: {
                   callbacks: {
                       label: function(tooltipItem) {
                           return `${tooltipItem.dataset.label}: ${Math.round(tooltipItem.raw).toLocaleString('pt-BR')}`;
                       }
                   }
               },
               legend: {
                   labels: {
                     color: '#ffffff',
                       font: {
                           size: 14
                       }
                   }
               }
           }
       }
   });
}

/*
FUNÇÕES PARA USO GERAL
*/
function toggleSection(sectionId) {
   const section = document.getElementById(sectionId);
   const content = section.querySelector(`.${sectionId}-container`);
   const icon = section.querySelector('.toggle-button i');
 
   if (content.classList.contains('collapsed')) {
     content.classList.remove('collapsed');
     icon.classList.remove('fa-chevron-down');
     icon.classList.add('fa-chevron-up');
   } else {
     content.classList.add('collapsed');
     icon.classList.remove('fa-chevron-up');
     icon.classList.add('fa-chevron-down');
   }
 }
 

// Chama a função ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
   carregarTotal();
   carregarEnderecos();
   carregarAvg();
   carregarAudienciaImpacto();
});