// src/components/AddFinanceDialog.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseBRL, MONTHS_PT } from '../lib/format';
import type { Collaborator, Status, Account } from '../lib/types';

type Props = {
  initial?: Account;
  collaborators: Collaborator[];
  onSave: (
    data: {
      collaboratorId: number;
      description: string;
      value: number;
      parcelasTotal: number | null;
      month: number;
      year: number;
      status: Status;
    },
    idToUpdate?: number
  ) => void;
  onClose: () => void;
};

// ⚡ Schema do form
// (corrigido: converte "3" -> 3 antes de validar; mantém "X" como string)
const schema = z.object({
  collaboratorId: z.number().int().positive(),
  description: z.string().min(2, 'Descrição muito curta'),
  value: z.string().min(1, 'Informe um valor'),
  parcelasTotal: z.preprocess(
    (val) => {
      if (val === 'X') return 'X';
      if (val === '-') return '-';
      return Number(val);
    },
    z.union([z.literal('X'), z.literal('-'), z.number().min(1).max(12)])
  ),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  status: z.enum(['ativo', 'cancelado', 'quitado']),
});

// Use the input type for FormData to match the raw form values before Zod preprocessing
type FormData = z.input<typeof schema>;

export default function AddFinanceDialog({
  collaborators,
  initial,
  onSave,
  onClose,
}: Props) {
  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      collaboratorId: initial?.collaboratorId ?? collaborators[0]?.id ?? 0,
      description: initial?.description ?? '',
      value:
        initial?.value != null ? String(initial.value).replace('.', ',') : '',
      parcelasTotal:
        initial?.parcelasTotal == null ? ('X' as const) : initial.parcelasTotal,
      month: initial?.month ?? defaultMonth,
      year: initial?.year ?? defaultYear,
      status: initial?.status ?? 'ativo',
    },
  });

  // garante colaborador setado quando a lista chega depois
  useEffect(() => {
    if (!initial && collaborators[0]) {
      setValue('collaboratorId', collaborators[0].id);
    }
  }, [collaborators, initial, setValue]);

  const submit: SubmitHandler<FormData> = (d) => {
    const parsedValue = parseBRL(d.value);
    if (isNaN(parsedValue)) {
      alert('Valor inválido. Por favor, informe um valor numérico.');
      return;
    }

    const payload = {
      collaboratorId: d.collaboratorId,
      description: d.description.trim(),
      value: parsedValue, // já em reais
      parcelasTotal:
        d.parcelasTotal === 'X'
          ? null
          : d.parcelasTotal === '-'
            ? 0
            : (d.parcelasTotal as number),
      month: d.month,
      year: d.year,
      status: d.status as Status,
    };

    onSave(payload, initial?.id); // edita se houver id; senão, cria
    onClose();
  };

  const disabled = collaborators.length === 0;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-lg p-5">
        <h3 className="text-lg font-semibold mb-3">
          {initial ? 'Editar finança' : 'Adicionar finança'}
        </h3>

        {disabled && (
          <div className="mb-3 text-sm text-red-600">
            Você ainda não tem colaboradores. Crie um colaborador primeiro.
          </div>
        )}

        {/* debug opcional
        {Object.keys(errors).length > 0 && (
          <pre className="text-xs text-red-600">{JSON.stringify(errors, null, 2)}</pre>
        )} */}

        <form className="grid gap-3" onSubmit={handleSubmit(submit)}>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Colaborador</span>
            <select
              className="select select-full"
              {...register('collaboratorId', { valueAsNumber: true })}
              disabled={disabled}
            >
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Descrição</span>
            <input
              className="input input-full"
              {...register('description')}
              placeholder="Ex.: Uber"
              disabled={disabled}
            />
            {errors.description && (
              <span className="text-xs text-red-600">
                {errors.description.message}
              </span>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Valor (R$)</span>
            <input
              className="input input-full"
              {...register('value')}
              placeholder="Ex.: 119,00"
              inputMode="decimal"
              disabled={disabled}
            />
            {errors.value && (
              <span className="text-xs text-red-600">
                {errors.value.message as string}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Parcelas</span>
              <select
                className="select select-full"
                {...register('parcelasTotal')} // agora o schema converte
                disabled={disabled}
              >
                <option value="-">Avulsa</option>
                <option value="X">Fixo</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Início</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="select"
                  {...register('month', { valueAsNumber: true })}
                  disabled={disabled}
                >
                  {MONTHS_PT.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  disabled={disabled}
                />
              </div>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Status</span>
            <select
              className="select select-full"
              {...register('status')}
              disabled={disabled}
            >
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="quitado">Quitado</option>
            </select>
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={disabled}
            >
              {initial ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
