// src/lib/storage.ts
import type { Finance, Competencia, Account } from './types';
import { todayComp, monthsDiff } from './date';

const KEY = 'moai-financas-v3';

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

/**
 * Deve APARECER no mês filtrado?
 */
export function isVisibleInMonth(
  f: Finance | Account,
  month: Competencia
): boolean {
  if (f.status === 'quitado') return false;

  if (isAccountLike(f)) {
    const start = { year: Number(f.year), month: Number(f.month) };

    // mês/ano inválidos -> não exibe
    if (!start.year || !start.month || start.month < 1 || start.month > 12) {
      return false;
    }

    // Se status for Cancelado, só aparece até o mês/ano do cancelamento (inclusive)
    if (f.status === 'Cancelado') {
      if (!f.cancelledAt) return false;
      const cancelledDate = new Date(f.cancelledAt);
      const cancelledYear = cancelledDate.getFullYear();
      const cancelledMonth = cancelledDate.getMonth() + 1;
      // Só não exibe se o mês filtrado for maior que o mês/ano do cancelamento
      if (
        month.year > cancelledYear ||
        (month.year === cancelledYear && month.month > cancelledMonth)
      ) {
        return false;
      }
      // Exibe se for igual ou menor
    }

    const diff = monthsDiff(start, month);
    if (diff < 0) return false; // antes do início, não mostra

    // Trate  null, undefined, '' e 0 como indeterminada
    const p = f.parcelasTotal;
    const total =
      p === null || p === undefined || String(p) === '' ? null : Number(p);

    if (total === null || !Number.isFinite(total) || total <= 0) {
      // Indeterminada: aparece de start em diante
      return true;
    }

    return diff <= total - 1;
  }

  // --- modelo Finance antigo (localStorage) ---
  if (!f.start) return false;
  const diff = monthsDiff(f.start, month);
  if (diff < 0) return false;
  if ((f as Finance).parcelasTotal === 'X') return true;
  const total = Number((f as Finance).parcelasTotal);
  return Number.isFinite(total) && diff <= total - 1;
}

/**
 * Deve ENTRAR NO TOTAL do mês filtrado?
 */
export function willCountInMonth(
  f: Finance | Account,
  month: Competencia
): boolean {
  if (f.status === 'Cancelado' || f.status === 'quitado') return false;

  if (isAccountLike(f)) {
    const start = { year: num(f.year), month: num(f.month) };
    const diff = monthsDiff(start, month);
    if (diff < 0) return false;

    if (f.parcelasTotal == null) return true;
    return diff <= num(f.parcelasTotal) - 1;
  }

  if (!f.start) return false;
  const diff = monthsDiff(f.start, month);
  if (diff < 0) return false;
  if (f.parcelasTotal === 'X') return true;
  return diff <= (f.parcelasTotal as number) - 1;
}

/* ---------------- internos ---------------- */

function isAccountLike(x: any): x is Account {
  // mais tolerante: basta ter as chaves e elas serem coeríveis a número
  return (
    x &&
    typeof x === 'object' &&
    'month' in x &&
    'year' in x &&
    !Number.isNaN(num((x as any).month)) &&
    !Number.isNaN(num((x as any).year))
  );
}

function num(v: any): number {
  return typeof v === 'number' ? v : Number(v);
}

function safeJSON<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** SEED (modelo Finance, só para localStorage antigo) */
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
      status: 'Pendente',
      createdAt: nowISO,
    },
    {
      id: crypto.randomUUID(),
      pessoa: 'Amanda',
      descricao: 'Notebooks',
      valor: 97.71,
      start,
      parcelasTotal: 10,
      status: 'Pendente',
      createdAt: nowISO,
    },
  ];
}

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
