// src/lib/format.ts
import { monthsDiff } from './date';
import type { Account, Competencia } from './types';

export const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Mantido para compatibilidade (retorna número em REAIS)
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

/**
 * Rótulo de parcela para o modelo novo (Account) considerando a competência atual.
 * - cancelado -> "—"
 * - parcelasTotal === null -> "Indeterminada"
 * - parcelasTotal = número -> "k/N", onde k = monthsDiff(início, atual) + 1 (clamp 1..N)
 * - se k > N -> "Quitado"
 * OBS: visibilidade é controlada por isVisibleInMonth; aqui é só o rótulo.
 */
export function parcelaLabel(f: Account, inMonth: Competencia): string {
  // Se cancelado, só mostra '—' se o mês filtrado for após o cancelamento
  if (f.status === 'cancelado' && f.cancelledAt) {
    const cancelledDate = new Date(f.cancelledAt);
    const cancelledYear = cancelledDate.getFullYear();
    const cancelledMonth = cancelledDate.getMonth() + 1;
    if (
      inMonth.year > cancelledYear ||
      (inMonth.year === cancelledYear && inMonth.month > cancelledMonth)
    ) {
      return '—';
    }
    // Se ainda está visível, mostra o label normal
  }
  if (f.parcelasTotal === null) return 'Fixo';
  if (f.parcelasTotal === 0) return '-';

  if (typeof f.parcelasTotal === 'number') {
    const start = { year: f.year, month: f.month };
    const k = monthsDiff(start, inMonth) + 1; // 1..N
    if (k < 1) return `1/${f.parcelasTotal}`;
    if (k > f.parcelasTotal) return 'Quitado';
    return `${Math.min(k, f.parcelasTotal)}/${f.parcelasTotal}`;
  }

  return '-';
}
