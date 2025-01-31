const formatDate = (date) => {
    if (typeof date === "string" && date.match(/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/)) {
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

    console.warn("[WARN] Data inválida detectada:", date);
    return "Data inválida";
};
