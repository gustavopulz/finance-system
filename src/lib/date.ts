import type { Competencia } from './types';

export function todayComp(): Competencia {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}
export function compKey(c: Competencia) {
  return `${c.year}-${String(c.month).padStart(2, '0')}`;
}
export function monthsDiff(a: Competencia, b: Competencia) {
  // quantos meses de A até B (b >= a => 0,1,2,...)
  return (b.year - a.year) * 12 + (b.month - a.month);
}
export function addMonths(c: Competencia, n: number): Competencia {
  const idx = c.year * 12 + (c.month - 1) + n;
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return { year, month };
}
