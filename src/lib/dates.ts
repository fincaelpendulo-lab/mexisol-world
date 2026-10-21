const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m: m - 1, d };
}

/** "January 16-22" or "May 13 - June 22"; short: "Jan 16-22". */
export function dateRange(start: string, end: string, short = false): string {
  const a = parts(start);
  const b = parts(end);
  const names = short ? SHORT : MONTHS;
  if (a.m === b.m) return `${names[a.m]} ${a.d}-${b.d}`;
  return `${names[a.m]} ${a.d} - ${names[b.m]} ${b.d}`;
}

/** Like dateRange, but adds the year when it is not the main calendar year. */
export function retreatDates(start: string, end: string, mainYear: number, short = false): string {
  const y = Number(start.slice(0, 4));
  return y === mainYear ? dateRange(start, end, short) : `${dateRange(start, end, short)}, ${y}`;
}
