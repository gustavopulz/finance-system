// src/lib/storage.ts
import type { Finance, Competencia } from './types';
import { todayComp, monthsDiff } from './date';

const KEY = 'moai-financas-v3';

/** Carrega + migra o modelo antigo para {start, parcelasTotal} */
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

/** Item deve APARECER no mês filtrado?
 * - cancelado: aparece (não soma) — pedido do usuário
 * - indeterminada: aparece em todo mês >= start
 * - parcelado: aparece de start..end (end = start + total - 1)
 * - sem start com número (legado corrompido): NÃO aparece (evita “14/10”)
 */
export function isVisibleInMonth(f: Finance, month: Competencia): boolean {
  if (f.status === 'quitado') return false;

  if (f.parcelasTotal === 'X') {
    if (!f.start) return false;
    return monthsDiff(f.start, month) >= 0;
  }

  if (typeof f.parcelasTotal === 'number') {
    if (!f.start) return false; // precisa do início
    const diff = monthsDiff(f.start, month);
    return diff >= 0 && diff <= f.parcelasTotal - 1;
  }

  // sem controle de parcelas: mostra (caso muito legado)
  return true;
}

/** Item deve ENTRAR NO TOTAL do mês filtrado?
 * - não soma se cancelado
 * - indeterminada: soma em todo mês >= start
 * - parcelado: soma apenas se dentro do range de parcelas
 */
export function willCountInMonth(f: Finance, month: Competencia): boolean {
  if (f.status === 'cancelado' || f.status === 'quitado') return false;

  if (f.parcelasTotal === 'X') {
    if (!f.start) return false;
    return monthsDiff(f.start, month) >= 0;
  }

  if (typeof f.parcelasTotal === 'number') {
    if (!f.start) return false;
    const diff = monthsDiff(f.start, month);
    return diff >= 0 && diff <= f.parcelasTotal - 1;
  }

  return true;
}

/** ---------- internos ---------- */

function safeJSON<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/** SEED INICIAL (exemplo) */
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
    {
      id: crypto.randomUUID(),
      pessoa: 'Gustavo',
      descricao: 'Vivo',
      valor: 95.0,
      start,
      parcelasTotal: 'X',
      status: 'ativo',
      createdAt: nowISO,
    },
    {
      id: crypto.randomUUID(),
      pessoa: 'CartaoMae',
      descricao: 'Revisão',
      valor: 140.0,
      start,
      parcelasTotal: 6,
      status: 'ativo',
      createdAt: nowISO,
    },
    {
      id: crypto.randomUUID(),
      pessoa: 'Outros',
      descricao: 'Wesley',
      valor: 172.0,
      start,
      parcelasTotal: 6,
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
        const start =
          f.competencia ?? guessStartFromProgress(f, Number(m[1]), total);
        return { ...f, start, parcelasTotal: total };
      }
      if (x) {
        const start = f.competencia ?? todayComp();
        return { ...f, start, parcelasTotal: 'X' as const };
      }
    }
    return f;
  });
}

/** Deduz início: now - (n-1) meses */
function guessStartFromProgress(
  f: Finance,
  current: number,
  total: number
): Competencia {
  const now = f.competencia ?? todayComp();
  const idx = now.year * 12 + (now.month - 1) - Math.max(0, current - 1);
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return { year, month };
}
