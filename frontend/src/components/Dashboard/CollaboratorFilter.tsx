import { useEffect, useMemo, useState } from 'react';
import type { Collaborator } from '../../lib/types';

interface CollaboratorFilterProps {
  collaborators: (Collaborator & { userId?: string })[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function CollaboratorFilter({
  collaborators,
  selected,
  onChange,
}: CollaboratorFilterProps) {
  const [open, setOpen] = useState(false);
  const allIds = useMemo(() => collaborators.map((c) => c.id), [collaborators]);

  useEffect(() => {
    const stillValid = selected.filter((id) => allIds.includes(id));
    if (stillValid.length !== selected.length) onChange(stillValid);
  }, [allIds.join(','), selected.join(',')]);

  const allSelected = selected.length === allIds.length && allIds.length > 0;
  const noneSelected = selected.length === 0;

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  }
  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(allIds);
  }

  const label = allSelected
    ? 'Todos os colaboradores'
    : noneSelected
      ? 'Nenhum selecionado'
      : `${selected.length} selecionado(s)`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dash-select select px-3 py-1.5 pr-6 text-sm flex items-center min-w-[210px] justify-start"
      >
        <span className="truncate max-w-[170px] text-left" title={label}>
          {label}
        </span>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-72 max-h-80 overflow-auto rounded-lg border border-blue-500/50 dark:border-blue-400/40 bg-blue-50/70 dark:bg-blue-500/10 backdrop-blur-md shadow-lg">
          <div className="sticky top-0 z-10 p-2 border-b border-blue-500/40 dark:border-blue-400/30 bg-blue-100/60 dark:bg-blue-500/20 backdrop-blur flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200">
            <span>Colaboradores</span>
            <button
              onClick={toggleAll}
              className="text-blue-600 dark:text-blue-300 hover:underline text-[10px]"
            >
              {allSelected ? 'Limpar' : 'Selecionar todos'}
            </button>
          </div>
          <ul className="divide-y divide-blue-500/20 dark:divide-blue-400/10">
            {collaborators.map((c) => {
              const active = selected.includes(c.id);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-blue-100/40 dark:hover:bg-blue-500/20 transition-colors"
                  onClick={() => toggle(c.id)}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(c.id)}
                    className="dash-checkbox"
                  />
                  <span className="flex-1 truncate" title={c.name}>
                    {c.name}
                  </span>
                  {active && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">
                      OK
                    </span>
                  )}
                </li>
              );
            })}
            {collaborators.length === 0 && (
              <li className="px-3 py-2 text-xs text-blue-600/70 dark:text-blue-300/70">
                Nenhum colaborador.
              </li>
            )}
          </ul>
        </div>
      )}
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
