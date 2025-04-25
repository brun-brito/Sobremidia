async function buscarDadosDoAnalytics(startDate, endDate, reportId) {
  try {
    const response = await fetch(`${API_URL}/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        reportId: reportId
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
    throw error;
  }
}