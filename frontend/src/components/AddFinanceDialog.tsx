// src/components/AddFinanceDialog.tsx
import { useEffect, useRef } from 'react';
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
      collaboratorId: string;
      description: string;
      value: number;
      parcelasTotal: number | null;
      month: number;
      year: number;
      status: Status;
    },
    idToUpdate?: string
  ) => void;
  onClose: () => void;
};

// ⚡ Schema do form
// (corrigido: converte "3" -> 3 antes de validar; mantém "X" como string)
const schema = z.object({
  collaboratorId: z.string().min(1, 'Selecione um colaborador'),
  description: z.string().min(1, 'Informe uma descrição'),
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
  status: z.enum(['Pendente', 'Cancelado', 'quitado']),
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

  // Ref para focar no input de descrição
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema), // Voltamos a usar o zodResolver
    defaultValues: {
      collaboratorId: initial?.collaboratorId
        ? String(initial.collaboratorId)
        : collaborators[0]?.id
          ? String(collaborators[0].id)
          : '',
      description: initial?.description || '',
      value:
        initial?.value != null ? String(initial.value).replace('.', ',') : '',
      parcelasTotal: initial
        ? initial.parcelasTotal === null || initial.parcelasTotal === undefined
          ? 'X' // Conta fixa/recorrente
          : initial.parcelasTotal === 0
            ? '-' // Conta avulsa
            : initial.parcelasTotal // Número de parcelas
        : '-', // NOVO: padrão é Avulsa
      month: initial?.month ?? defaultMonth,
      year: initial?.year ?? defaultYear,
      status:
        initial?.status === 'Pendente' ||
        initial?.status === 'Cancelado' ||
        initial?.status === 'quitado'
          ? initial.status
          : 'Pendente',
    },
  });

  // Registrar o campo description com ref
  const { ref: descriptionRef, ...descriptionRegister } =
    register('description');
  // Formata o valor como moeda brasileira ao digitar
  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, ''); // remove não dígitos
    if (!value) {
      setValue('value', '');
      return;
    }
    // Garante pelo menos dois dígitos para centavos
    if (value.length < 3) {
      value = value.padStart(3, '0');
    }
    const reais = value.slice(0, -2);
    const centavos = value.slice(-2);
    const formatted = `${Number(reais)}${reais ? '' : '0'},${centavos}`;
    setValue('value', formatted);
  }

  // garante colaborador setado quando a lista chega depois
  useEffect(() => {
    if (!initial && collaborators[0]) {
      setValue('collaboratorId', String(collaborators[0].id));
    }
  }, [collaborators, initial, setValue]);

  // Foca no input de descrição ao abrir o dialog
  useEffect(() => {
    if (descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, []); // executa apenas uma vez ao montar o componente

  const submit: SubmitHandler<FormData> = (d) => {
    const parsedValue = parseBRL(d.value);
    if (isNaN(parsedValue)) {
      alert('Valor inválido. Por favor, informe um valor numérico.');
      return;
    }

    const payload: any = {
      collaboratorId: d.collaboratorId,
      description: String(d.description || '').trim(),
      value: parsedValue, // já em reais
      month: d.month,
      year: d.year,
      status: d.status as Status,
    };

    // Correção na lógica de parcelasTotal:
    // - 'X' (Fixo) = null (conta recorrente em todos os meses)
    // - '-' (Avulsa) = 0 (conta apenas no mês específico)
    // - número (1-12) = número de parcelas
    if (d.parcelasTotal === 'X') {
      payload.parcelasTotal = null; // Conta fixa/recorrente
    } else if (d.parcelasTotal === '-') {
      payload.parcelasTotal = 0; // Conta avulsa
    } else if (typeof d.parcelasTotal === 'number') {
      payload.parcelasTotal = d.parcelasTotal; // Número específico de parcelas
    }

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

        <form className="grid gap-3" onSubmit={handleSubmit(submit)}>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Colaborador</span>
            <select
              className="select select-full"
              {...register('collaboratorId')}
              disabled={disabled}
            >
              {collaborators.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Descrição</span>
            <input
              {...descriptionRegister}
              ref={(e) => {
                descriptionRef(e);
                descriptionInputRef.current = e;
              }}
              className="input input-full"
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
              onChange={handleValueChange}
              maxLength={10}
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
                {...register('parcelasTotal')}
                disabled={disabled}
                defaultValue="-"
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
              <option value="Pendente">Pendente</option>
              <option value="Cancelado">Cancelado</option>
              <option value="quitado">Quitado</option>
            </select>
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
              onClick={onClose}
            >
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
