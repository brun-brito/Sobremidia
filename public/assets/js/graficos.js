let mediaChartInstance = null;

function renderMediaChart(mediaDetails) {
    const ctx = document.getElementById("mediaChart").getContext("2d");

    // Verificar e destruir o gráfico existente, se necessário
    if (mediaChartInstance) {
        mediaChartInstance.destroy();
    }

    const labels = Object.keys(mediaDetails).map(mediaId => `Mídia ${mediaId}`);
    const tooltips = Object.keys(mediaDetails).map(mediaId => mediaNames[mediaId]); // Nomes das mídias para tooltip
    const data = Object.values(mediaDetails).map(media => media.totalExhibitions);

    // Criar um novo gráfico
    mediaChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels, // Exibe "Mídia {idMidia}" na parte de baixo
            datasets: [
                {
                    label: "Exibições por Mídia",
                    data,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            // Exibe o nome da mídia no tooltip
                            const index = context[0].dataIndex;
                            return tooltips[index]; // Retorna o nome da mídia
                        },
                        label: function (context) {
                            // Mostra o valor no tooltip
                            return `Exibições: ${context.raw}`;
                        },
                    },
                },
            },
        },
    });
}

let playerChartInstance = null;

function renderPlayerChart(playerDetails) {
    const ctx = document.getElementById("playerChart").getContext("2d");

    // Verificar e destruir o gráfico existente, se necessário
    if (playerChartInstance) {
        playerChartInstance.destroy();
    }

    const labels = Object.keys(playerDetails).map(playerId => panelNames[playerId]);
    const data = Object.values(playerDetails).map(player => player.totalExhibitions);

    // Gerar uma lista dinâmica de cores
    const generateDistinctColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = Math.floor((360 / count) * i); // Distribui as cores uniformemente no círculo de cores
            colors.push(`hsl(${hue}, 70%, 50%)`); // HSL: Matiz, Saturação, Luminosidade
        }
        return colors;
    };

    const backgroundColors = generateDistinctColors(labels.length);
    const borderColors = backgroundColors.map(color => color.replace('50%)', '40%)')); // Ajustar a luminosidade das bordas

    // Criar um novo gráfico
    playerChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels,
            datasets: [
                {
                    label: "Exibições por Painel",
                    data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}`;
                        },
                    },
                },
            },
        },
    });
}
