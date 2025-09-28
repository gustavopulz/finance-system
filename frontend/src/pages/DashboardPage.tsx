import { useEffect, useMemo, useState } from 'react';
import { getMergedFinances } from '../lib/api';
import { monthsDiff } from '../lib/date';
import { isAccountPaidInMonth } from '../lib/format';
import { isVisibleInMonth } from '../lib/storage';
import type { Account, Collaborator } from '../lib/types';
import { SummaryCards } from '../components/Dashboard/SummaryCards';
import { AnnualExpensesChart } from '../components/Dashboard/AnnualExpensesChart';
import { CategoryBreakdownChart } from '../components/Dashboard/CategoryBreakdownChart';
import type { CategoryDatum } from '../components/Dashboard/CategoryBreakdownChart';
import { CollaboratorFilter } from '../components/Dashboard/CollaboratorFilter';
import { MonthlyPaidStatusChart } from '../components/Dashboard/MonthlyPaidStatusChart';
import { CollaboratorPaidRateChart } from '../components/Dashboard/CollaboratorPaidRateChart';
import { MonthDropdown } from '../components/Dashboard/MonthDropdown';

interface MergedFinancesResponse {
  accounts: Account[];
  collabs: (Collaborator & { userId?: string })[];
}

function normalizeAccount(a: any): Account {
  const rawPt = a.parcelasTotal;
  let parcelasTotal: number | null;
  if (
    rawPt === '' ||
    rawPt === null ||
    rawPt === undefined ||
    (typeof rawPt === 'string' &&
      rawPt.toString().trim().toUpperCase() === 'X') ||
    (typeof rawPt === 'string' &&
      rawPt.toString().trim().toLowerCase() === 'null')
  ) {
    parcelasTotal = null;
  } else {
    const n = Number(rawPt);
    parcelasTotal = Number.isFinite(n) ? n : null;
  }
  let dtPaid: string | undefined = undefined;
  const v = (a as any).dtPaid;
  if (v) {
    if (typeof v === 'string') dtPaid = v;
    else if (v instanceof Date) {
      try {
        dtPaid = v.toISOString();
      } catch {}
    } else if (v && typeof (v as any).toDate === 'function') {
      try {
        dtPaid = (v as any).toDate().toISOString();
      } catch {}
    } else if (typeof v === 'object') {
      const secs = (v as any)._seconds ?? (v as any).seconds;
      const nanos = (v as any)._nanoseconds ?? (v as any).nanoseconds;
      if (typeof secs === 'number') {
        const ms =
          secs * 1000 +
          (typeof nanos === 'number' ? Math.floor(nanos / 1e6) : 0);
        try {
          dtPaid = new Date(ms).toISOString();
        } catch {}
      }
    }
  }
  return {
    id: String(a.id),
    collaboratorId: String(a.collaboratorId),
    collaboratorName: a.collaboratorName ?? '',
    description: String(a.description ?? ''),
    value: Number(a.value),
    parcelasTotal,
    month: Math.min(12, Math.max(1, Number(a.month ?? 1))),
    year: Math.max(1900, Number(a.year ?? new Date().getFullYear())),
    status: (a.status as Account['status']) ?? 'Pendente',
    paid: Boolean(a.paid),
    dtPaid,
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
    cancelledAt: a.cancelledAt ?? undefined,
  };
}

export default function DashboardPage() {
  const today = new Date();
  const [startMonth, setStartMonth] = useState<number>(today.getMonth() + 1);
  const [startYear, setStartYear] = useState<number>(today.getFullYear());
  const [endMonth, setEndMonth] = useState<number>(today.getMonth() + 1);
  const [endYear, setEndYear] = useState<number>(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MergedFinancesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
    []
  );
  const [showCancelled, setShowCancelled] = useState(false);

  function expandAccountsForMonth(
    raw: Account[],
    comp: { year: number; month: number }
  ): Account[] {
    const result: Account[] = [];
    raw.forEach((acc) => {
      if (
        acc.parcelasTotal === null ||
        acc.parcelasTotal === undefined ||
        acc.parcelasTotal === 0 ||
        acc.parcelasTotal === 1
      ) {
        if (isVisibleInMonth(acc as any, comp)) result.push(acc);
        return;
      }
      if (typeof acc.parcelasTotal === 'number' && acc.parcelasTotal > 1) {
        const start = { year: acc.year, month: acc.month };
        const diff = monthsDiff(start, comp);
        if (
          diff >= 0 &&
          diff < acc.parcelasTotal &&
          isVisibleInMonth(acc as any, comp)
        ) {
          result.push(acc);
        }
      } else {
        if (isVisibleInMonth(acc as any, comp)) result.push(acc);
      }
    });
    return result;
  }

  function generateCompetenceRange(
    aYear: number,
    aMonth: number,
    bYear: number,
    bMonth: number
  ) {
    const start = new Date(aYear, aMonth - 1, 1);
    const end = new Date(bYear, bMonth - 1, 1);
    if (end < start) return [] as { year: number; month: number }[];
    const list: { year: number; month: number }[] = [];
    let y = start.getFullYear();
    let m = start.getMonth() + 1;
    while (
      y < end.getFullYear() ||
      (y === end.getFullYear() && m <= end.getMonth() + 1)
    ) {
      list.push({ year: y, month: m });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return list;
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getMergedFinances(endYear, endMonth)
      .then((res: MergedFinancesResponse) => {
        if (!active) return;
        const normalized = {
          ...res,
          accounts: (res.accounts || []).map(normalizeAccount),
        };
        setData(normalized);
        if (res?.collabs?.length) {
          const allIds = res.collabs.map((c) => c.id);
          setSelectedCollaborators(allIds);
        } else {
          setSelectedCollaborators([]);
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [endMonth, endYear]);

  const periodCompetences = useMemo(
    () => generateCompetenceRange(startYear, startMonth, endYear, endMonth),
    [startYear, startMonth, endYear, endMonth]
  );

  const filteredAccounts = useMemo(() => {
    if (!data) return [] as Account[];
    let base = data.accounts as Account[];
    if (!showCancelled) base = base.filter((a) => a.status !== 'Cancelado');
    const allOccurrences: Account[] = [];
    periodCompetences.forEach((comp) => {
      const expanded = expandAccountsForMonth(base, comp);
      expanded.forEach((e) => allOccurrences.push(e));
    });
    const filtered =
      selectedCollaborators.length === 0
        ? allOccurrences
        : allOccurrences.filter((a) =>
            selectedCollaborators.includes(a.collaboratorId)
          );
    return filtered;
  }, [data, periodCompetences, selectedCollaborators, showCancelled]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, monthTotal: 0, pending: 0, paid: 0 };
    const endComp = { year: endYear, month: endMonth };
    const total = filteredAccounts.reduce(
      (s, a) => s + (Number(a.value) || 0),
      0
    );
    const paid = filteredAccounts
      .filter((a) => isAccountPaidInMonth(a as any, endComp))
      .reduce((s, a) => s + (Number(a.value) || 0), 0);
    const pending = total - paid;
    return { total, monthTotal: total, pending, paid };
  }, [filteredAccounts, endMonth, endYear]);

  const categoryData: CategoryDatum[] = useMemo(() => {
    if (!data) return [];
    const nameMap: Record<string, string> = {};
    (data.collabs || []).forEach((c) => {
      nameMap[c.id] = c.name;
    });

    const totals: Record<string, number> = {};
    filteredAccounts.forEach((a) => {
      totals[a.collaboratorId] =
        (totals[a.collaboratorId] || 0) + (Number(a.value) || 0);
    });
    return Object.entries(totals)
      .map(([collabId, value]) => ({
        name: nameMap[collabId] || collabId,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAccounts, data]);

  const annualData = useMemo(() => {
    if (!data) return [] as any[];
    const targetYear = endYear;
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const collabIds =
      selectedCollaborators.length > 0
        ? selectedCollaborators
        : (data.collabs || []).map((c) => c.id);
    const rows = months.map((m) => {
      const row: any = { month: String(m).padStart(2, '0'), total: 0 };
      collabIds.forEach((id) => {
        row[id] = 0;
      });
      return row;
    });
    const rowByMonth: Record<number, any> = {};
    rows.forEach((r) => {
      rowByMonth[Number(r.month)] = r;
    });
    months.forEach((m) => {
      const comp = { year: targetYear, month: m };
      const expanded = expandAccountsForMonth(data.accounts || [], comp);
      expanded.forEach((a) => {
        if (!showCancelled && a.status === 'Cancelado') return;
        if (
          selectedCollaborators.length &&
          !selectedCollaborators.includes(a.collaboratorId)
        )
          return;
        const r = rowByMonth[m];
        if (!r) return;
        const v = Number(a.value) || 0;
        r.total += v;
        if (a.collaboratorId in r) r[a.collaboratorId] += v;
        else r[a.collaboratorId] = v;
      });
    });
    return rows;
  }, [data, endYear, selectedCollaborators, showCancelled]);

  const monthlyStatusData = useMemo(() => {
    if (!data)
      return [] as {
        month: string;
        paid: number;
        pending: number;
        total: number;
      }[];
    const byKey: Record<
      string,
      { month: string; paid: number; pending: number; total: number }
    > = {};
    periodCompetences.forEach((comp) => {
      const key = `${comp.year}-${String(comp.month).padStart(2, '0')}`;
      const expanded = expandAccountsForMonth(data.accounts as Account[], comp);
      let paid = 0;
      let total = 0;
      expanded.forEach((a) => {
        if (!showCancelled && a.status === 'Cancelado') return;
        if (
          selectedCollaborators.length &&
          !selectedCollaborators.includes(a.collaboratorId)
        )
          return;
        const v = Number(a.value) || 0;
        total += v;
        if (isAccountPaidInMonth(a as any, comp)) paid += v;
      });
      byKey[key] = {
        month: `${String(comp.month).padStart(2, '0')}/${String(comp.year).slice(-2)}`,
        paid,
        pending: total - paid,
        total,
      };
    });
    return Object.values(byKey).sort((a, b) => a.month.localeCompare(b.month));
  }, [
    data,
    periodCompetences,
    selectedCollaborators,
    showCancelled,
    endMonth,
    endYear,
  ]);

  const collaboratorPaidRates = useMemo(() => {
    if (!data)
      return [] as {
        collaboratorId: string;
        name: string;
        paid: number;
        pending: number;
        total: number;
        paidPct: number;
      }[];
    const endComp = { year: endYear, month: endMonth };
    const map: Record<
      string,
      { paid: number; pending: number; total: number; name: string }
    > = {};
    (data.collabs || []).forEach((c) => {
      map[c.id] = { paid: 0, pending: 0, total: 0, name: c.name };
    });
    filteredAccounts.forEach((a) => {
      if (!showCancelled && a.status === 'Cancelado') return;
      if (
        selectedCollaborators.length &&
        !selectedCollaborators.includes(a.collaboratorId)
      )
        return;
      const v = Number(a.value) || 0;
      const bucket =
        map[a.collaboratorId] ||
        (map[a.collaboratorId] = {
          paid: 0,
          pending: 0,
          total: 0,
          name: a.collaboratorName || a.collaboratorId,
        });
      bucket.total += v;
      if (isAccountPaidInMonth(a as any, endComp)) bucket.paid += v;
      else bucket.pending += v;
    });
    return Object.entries(map)
      .map(([id, m]) => ({
        collaboratorId: id,
        name: m.name,
        paid: m.paid,
        pending: m.pending,
        total: m.total,
        paidPct: m.total ? (m.paid / m.total) * 100 : 0,
      }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.paidPct - a.paidPct || b.total - a.total);
  }, [
    data,
    filteredAccounts,
    selectedCollaborators,
    showCancelled,
    endMonth,
    endYear,
  ]);

  return (
    <div className="px-4 lg:px-20 2xl:px-40">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Visão geral das despesas compartilhadas
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-end">
          <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300 mb-2">
            <input
              type="checkbox"
              className="dash-checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
            />{' '}
            Canceladas
          </label>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
              Início
            </span>
            <div className="flex items-center gap-2">
              <MonthDropdown
                value={startMonth}
                onChange={setStartMonth}
                label="Mês início"
              />
              <input
                className="dash-input w-24"
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
              Fim
            </span>
            <div className="flex items-center gap-2">
              <MonthDropdown
                value={endMonth}
                onChange={setEndMonth}
                label="Mês fim"
              />
              <input
                className="dash-input w-24"
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">
              Colaboradores
            </span>
            <CollaboratorFilter
              collaborators={data?.collabs || []}
              selected={selectedCollaborators}
              onChange={setSelectedCollaborators}
            />
          </div>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-500">Erro: {error}</div>}

      <SummaryCards {...stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {annualData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 h-[28rem] flex items-center justify-center">
              {loading ? 'Carregando...' : 'Sem dados para o ano.'}
            </div>
          ) : (
            <AnnualExpensesChart
              data={annualData}
              collaborators={(data?.collabs || []).filter(
                (c) =>
                  selectedCollaborators.length === 0 ||
                  selectedCollaborators.includes(c.id)
              )}
              loading={loading}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          {categoryData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 h-[28rem] flex items-center justify-center">
              {loading ? 'Carregando...' : 'Sem dados.'}
            </div>
          ) : (
            <CategoryBreakdownChart data={categoryData} loading={loading} />
          )}
        </div>
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {monthlyStatusData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 h-[24rem] flex items-center justify-center">
              {loading ? 'Carregando...' : 'Sem dados no período.'}
            </div>
          ) : (
            <MonthlyPaidStatusChart
              data={monthlyStatusData}
              loading={loading}
            />
          )}
        </div>
        <div className="lg:col-span-1">
          {collaboratorPaidRates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 h-[24rem] flex items-center justify-center">
              {loading ? 'Carregando...' : 'Sem dados.'}
            </div>
          ) : (
            <CollaboratorPaidRateChart
              data={collaboratorPaidRates}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
