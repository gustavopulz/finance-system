import { Dialog } from '@headlessui/react'
import { useState } from 'react'
import { createAccount } from '../lib/api'

type Props = {
  open: boolean
  onClose: () => void
}

export default function AccountModal({ open, onClose }: Props) {
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [installment, setInstallment] = useState('')
  const [type, setType] = useState<'nubank' | 'boleto' | 'outro_cartao'>('nubank')
  const [dueDate, setDueDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createAccount({
      description,
      value: parseFloat(value),
      installment,
      type,
      dueDate,
    })
    onClose()
    window.location.reload() // simples por enquanto
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" />
      <div className="bg-white rounded-lg p-6 z-10 w-96">
        <Dialog.Title className="text-lg font-semibold mb-4">Cadastrar Conta</Dialog.Title>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Parcela (ex: 1/5)"
            value={installment}
            onChange={(e) => setInstallment(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="nubank">Nubank</option>
            <option value="boleto">Boleto</option>
            <option value="outro_cartao">Outro Cartão</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 text-white"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
