// Game clock. Solo play reads the browser clock; online play keeps an offset
// to the account service so cooldowns and slow effects use server time.

let offset = 0;

export function now() { return Date.now() + offset; }

export function setServerNow(serverNow) {
  if (Number.isFinite(serverNow)) offset = serverNow - Date.now();
}

export function clockOffset() { return offset; }
