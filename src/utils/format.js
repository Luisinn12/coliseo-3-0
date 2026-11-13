export const fmt = (n) => Math.round(n).toLocaleString('en-US');
export const sgn = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n));
export const COL = { jordan: '#d4a73a', owari: '#ff2b3a', fyodor: '#7fc4ff', barbero: '#b57bff' };
