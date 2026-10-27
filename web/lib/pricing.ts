export const FREE_SHIP_FROM = 2999;
export const SHIP_FEE = 99;
export const MAX_QTY = 20;

export const shippingFor = (sub: number) => (sub === 0 || sub >= FREE_SHIP_FROM ? 0 : SHIP_FEE);
