/** Saudi riyal amount with thousands separators, e.g. "7,420 ر.س". */
export function sar(value: number): string {
  return value.toLocaleString('en-US') + ' ر.س';
}

/** Keeps the first and last four digits of a phone number, e.g. "0544•••0447". */
export function maskPhone(phone: string): string {
  return phone.slice(0, 4) + '•••' + phone.slice(-4);
}
