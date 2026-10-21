export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return '0';
    }
    return new Intl.NumberFormat('en-US').format(Number(value));
}

export function formatCompactNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return '0';
    }
    const num = Number(value);
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(num);
}

export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
    if (value === null || value === undefined || isNaN(Number(value))) {
        return '0%';
    }
    return `${Number(value).toFixed(decimals)}%`;
}
