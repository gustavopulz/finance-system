import type { Finance, Competencia, Account } from './types';
import { todayComp, monthsDiff } from './date';

const KEY = 'moai-financas-v3';

/** ---------- persistência local (legado) ---------- */
export function loadFinances(): Finance[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const seed = seedData();
    saveFinances(seed);
    return seed;
  }
  const list: Finance[] = safeJSON(raw) ?? [];
  return migrate(list);
}

export function saveFinances(list: Finance[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Pega a competência de início tanto do modelo antigo (Finance) quanto do novo (Account) */
function getStartComp(f: Finance | Account): Competencia | null {
  if ('start' in f) {
    return f.start ?? null; // Finance (legado)
  }
  // Account (novo) — início é year/month
  if ('year' in f && 'month' in f) {
    return { year: f.year, month: f.month };
  }
  return null;
}

/** Aparece no mês filtrado?
 * Regras:
 * - quitado: não aparece
 * - precisa ter um início (start para Finance, ou {year,month} para Account)
 * - se mês filtrado < início => não aparece
 * - indeterminada (X no legado ou null no novo): aparece a partir do início
 * - parcelado (número): aparece do início até (início + total - 1)
 */
export function isVisibleInMonth(
  f: Finance | Account,
  month: Competencia
): boolean {
  if (f.status === 'quitado') return false;

  const start = getStartComp(f);
  if (!start) return false;

  const diff = monthsDiff(start, month);
  if (diff < 0) return false; // antes do início não aparece

  // Indeterminada
  const isIndet =
    ('parcelasTotal' in f && (f as any).parcelasTotal === null) ||
    (f as any).parcelasTotal === 'X';

  if (isIndet) return true;

  // Número de parcelas
  const total =
    typeof (f as any).parcelasTotal === 'number'
      ? (f as any).parcelasTotal
      : null;

  if (total !== null) {
    return diff <= total - 1;
  }

  return false;
}

/** Entra no total do mês filtrado? (igual às regras de visibilidade, mas ignora cancelado/quitado) */
export function willCountInMonth(
  f: Finance | Account,
  month: Competencia
): boolean {
  if (f.status === 'cancelado' || f.status === 'quitado') return false;

  const start = getStartComp(f);
  if (!start) return false;

  const diff = monthsDiff(start, month);
  if (diff < 0) return false;

  const isIndet =
    ('parcelasTotal' in f && (f as any).parcelasTotal === null) ||
    (f as any).parcelasTotal === 'X';

  if (isIndet) return true;

  const total =
    typeof (f as any).parcelasTotal === 'number'
      ? (f as any).parcelasTotal
      : null;

  if (total !== null) {
    return diff <= total - 1;
  }

  return false;
}

/** ---------- internos (legado/seed) ---------- */

function safeJSON<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function seedData(): Finance[] {
  const start = todayComp();
  const nowISO = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      pessoa: 'Amanda',
      descricao: 'MP inthebox',
      valor: 60.5,
      start,
      parcelasTotal: 3,
      status: 'ativo',
      createdAt: nowISO,
    },
    {
      id: crypto.randomUUID(),
      pessoa: 'Amanda',
      descricao: 'Notebooks',
      valor: 97.71,
      start,
      parcelasTotal: 10,
      status: 'ativo',
      createdAt: nowISO,
    },
  ];
}

/** Migração do modelo antigo (parcela "n/m" ou "X") */
function migrate(items: Finance[]): Finance[] {
  return items.map((f) => {
    const anyF = f as any;
    if (!f.start && anyF.parcela) {
      const m = String(anyF.parcela).match(/^(\d+)\/(\d+)$/i);
      const x = String(anyF.parcela).trim().toUpperCase() === 'X';
      if (m) {
        const total = Number(m[2]);
        return { ...f, start: todayComp(), parcelasTotal: total };
      }
      if (x) {
        return { ...f, start: todayComp(), parcelasTotal: 'X' as const };
      }
    }
    return f;
  });
}
