async function buscarDadosDoAnalytics(startDate, endDate) {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-message');
  loadingEl.style.display = 'flex';
  errorEl.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        locations: [
          "4409", "4410", "4411", "4412", "4413",
          "4499", "4500", "4541", "4792", "4793"
        ]
      })
    });

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.error || 'Erro desconhecido');
    }

    const dados = await response.json();
    return dados;
  } catch (error) {
    console.error('Erro ao buscar dados do analytics:', error.message);
    errorEl.innerText = `Erro: ${error.message}`;
    errorEl.style.display = 'block';
    throw error;
  }
}