const formatDate = (date) => {
    // Verificar se a data é do formato EXIF "2024:04:26 12:44:02"
    if (typeof date === "string" && date.match(/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/)) {
        // Converter o formato "2024:04:26 12:44:02" para "2024-04-26T12:44:02"
        const standardizedDate = date.replace(" ", "T").replace(/:/g, "-").replace("-", ":");
        return new Date(standardizedDate).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    // Caso seja um objeto Date ou timestamp válido
    const dateObject = new Date(date);
    if (!isNaN(dateObject.getTime())) {
        return dateObject.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    // Caso a data não seja válida
    console.warn("[WARN] Data inválida detectada:", date);
    return "Data inválida";
};
