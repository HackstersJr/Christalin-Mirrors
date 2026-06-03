/** Convert whole rupees to paisa (integer) */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paisa (integer) to whole rupees */
export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}
