const formatDate = (date) => {
    if (typeof date === "string") {
        // Verifica se a string já está no formato DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            return date; // Retorna diretamente sem alterações
        }

        // Se for no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss, extrai somente a parte da data
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, year, month, day] = match;
            return `${day}/${month}/${year}`; // Retorna no formato DD/MM/YYYY
        }

        console.warn("[WARN] Formato de data desconhecido:", date);
        return "Data inválida";
    }

    // Se for um objeto Date, extrai apenas o dia, mês e ano sem alteração de valores
    if (date instanceof Date && !isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    console.warn("[WARN] Data inválida detectada:", date);
    return "Data inválida";
};

function parseDateString(dateStr, endOfDay = false) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (endOfDay) {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date;
}