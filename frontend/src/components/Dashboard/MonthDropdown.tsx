import { useState, useRef, useEffect } from 'react';

interface MonthDropdownProps {
  value: number;
  onChange: (m: number) => void;
  label?: string;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function MonthDropdown({ value, onChange, label }: MonthDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function pick(m: number) {
    onChange(m);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref} aria-label={label}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="dash-select select px-3 py-2 text-sm flex items-center justify-start w-20"
      >
        <span className="tracking-wide">{String(value).padStart(2, '0')}</span>
      </button>
      {open && (
        <div className="absolute z-40 mt-2 w-28 max-h-72 overflow-auto rounded-lg border border-blue-500/50 dark:border-blue-400/40 bg-blue-50/80 dark:bg-blue-500/10 backdrop-blur-md shadow-lg month-dropdown-scroll">
          <ul className="py-1 text-sm divide-y divide-blue-500/20 dark:divide-blue-400/10 text-left">
            {MONTHS.map((m) => {
              const active = m === value;
              return (
                <li key={m}>
                  <button
                    type="button"
                    onClick={() => pick(m)}
                    className={`w-full text-left px-4 py-1.5 flex items-center justify-start transition-colors ${active ? 'bg-blue-600 text-white dark:bg-blue-500' : 'hover:bg-blue-100/50 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-200'}`}
                  >
                    <span>{String(m).padStart(2, '0')}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
