// src/components/FinanceDialog.tsx
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseBRL, MONTHS_PT } from '../lib/format';
import type { Finance, Person, Status } from '../lib/types';

const schema = z.object({
  pessoa: z.enum(['Amanda', 'Gustavo', 'CartaoMae', 'Outros']),
  descricao: z.string().min(2),
  valor: z.string().min(1),
  // 1..12 ou "X" (Indeterminada). z.coerce.number converte "1" -> 1
  parcelasTotal: z.union([z.coerce.number().min(1).max(12), z.literal('X')]),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  status: z.enum(['ativo', 'quitado', 'cancelado']).optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  initial?: Finance;
  onSave: (data: Omit<Finance, 'id'> & { id?: string }) => void;
  onClose: () => void;
};

export default function FinanceDialog({ initial, onSave, onClose }: Props) {
  const defaultMonth = initial?.start?.month ?? new Date().getMonth() + 1;
  const defaultYear = initial?.start?.year ?? new Date().getFullYear();

  const { register, handleSubmit } = useForm<FormData>({
    // ⚠️ Tipar o resolver com FormData resolve o conflito de 'unknown'
    resolver: zodResolver<FormData>(schema),
    defaultValues: {
      pessoa: initial?.pessoa ?? 'Amanda',
      descricao: initial?.descricao ?? '',
      valor: initial ? String(initial.valor).replace('.', ',') : '',
      parcelasTotal: (initial?.parcelasTotal ??
        'X') as FormData['parcelasTotal'],
      month: defaultMonth as FormData['month'],
      year: defaultYear as FormData['year'],
      status: (initial?.status ?? 'ativo') as FormData['status'],
    },
  });

  const submit: SubmitHandler<FormData> = (d) => {
    onSave({
      id: initial?.id,
      pessoa: d.pessoa as Person,
      descricao: d.descricao.trim(),
      valor: parseBRL(d.valor),
      start: { month: d.month, year: d.year },
      parcelasTotal: d.parcelasTotal,
      status: (d.status || 'ativo') as Status,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      competencia: undefined, // legado não é mais usado
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-lg p-5">
        <h3 className="text-lg font-semibold mb-3">
          {initial ? 'Editar finança' : 'Adicionar finança'}
        </h3>

        <form className="grid gap-3" onSubmit={handleSubmit(submit)}>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Pessoa/Grupo</span>
            <select className="select" {...register('pessoa')}>
              <option>Amanda</option>
              <option>Gustavo</option>
              <option value="CartaoMae">Cartão Família</option>
              <option>Outros</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Descrição</span>
            <input
              className="input"
              {...register('descricao')}
              placeholder="Ex.: Uber"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Valor (R$)</span>
            <input
              className="input"
              {...register('valor')}
              placeholder="Ex.: 119,00"
              inputMode="decimal"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Parcelas</span>
              <select className="select" {...register('parcelasTotal')}>
                <option value="X">Indeterminada</option>
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
                <select className="select" {...register('month')}>
                  {MONTHS_PT.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input className="input" type="number" {...register('year')} />
              </div>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Status</span>
            <select className="select" {...register('status')}>
              <option value="ativo">Ativo</option>
              <option value="cancelado">Cancelado</option>
              <option value="quitado">Quitado</option>
            </select>
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
