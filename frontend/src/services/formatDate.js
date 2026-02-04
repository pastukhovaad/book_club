export function FormatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        // hour: '2-digit',
        // minute: '2-digit',
        // second: '2-digit',
        // hour12: true
    }).replace(',', '');
}

export function FormatDateWithHour(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit',
        // hour12: true
    }).replace(',', '');
}