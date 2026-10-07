export const money = (n: number) => new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n);
export const decimal = (n: number) => new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 1 }).format(n);
