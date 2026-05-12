const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion

export function generatePin(): string {
  let pin = "";
  for (let i = 0; i < 6; i++) {
    pin += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return pin;
}

export function formatPin(pin: string): string {
  return `${pin.slice(0, 3)}-${pin.slice(3)}`;
}
