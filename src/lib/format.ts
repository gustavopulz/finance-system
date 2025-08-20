// src/lib/format.ts
import type { Competencia, Finance } from './types';
import { monthsDiff } from './date';

export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const parseBRL = (s: string) =>
  Number(
    String(s)
      .replace(/[^\d,-]/g, '')
      .replace(',', '.')
  ) || 0;

export const MONTHS_PT = [
  '01 - Janeiro',
  '02 - Fevereiro',
  '03 - Março',
  '04 - Abril',
  '05 - Maio',
  '06 - Junho',
  '07 - Julho',
  '08 - Agosto',
  '09 - Setembro',
  '10 - Outubro',
  '11 - Novembro',
  '12 - Dezembro',
];

/** Texto da coluna "Parcela" no mês filtrado (sem extrapolar tipo 14/10) */
export function parcelaLabel(f: Finance, inMonth: Competencia): string {
  if (f.status === 'cancelado') return '—';
  if (f.parcelasTotal === 'X') return 'Indeterminada';
  if (typeof f.parcelasTotal === 'number' && f.start) {
    const k = monthsDiff(f.start, inMonth) + 1; // 1..N
    if (k < 1) return `1/${f.parcelasTotal}`;
    if (k > f.parcelasTotal) return 'Quitado';
    // clamp para não mostrar 14/10
    const shown = Math.min(k, f.parcelasTotal);
    return `${shown}/${f.parcelasTotal}`;
  }
  return '-';
}
