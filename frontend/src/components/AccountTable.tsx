import { useEffect, useState } from 'react'
import { listAccounts } from '../lib/api'
import type { Account } from '../lib/api'

type Props = {
  onAdd: () => void
}

export default function AccountTable({ onAdd }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAccounts().then(setAccounts).finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Contas Financeiras</h2>
        <button
          onClick={onAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Cadastrar Conta
        </button>
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Valor</th>
              <th className="p-2 text-left">Parcela</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Dono</th>
              <th className="p-2 text-left">Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-2">{a.description}</td>
                <td className="p-2">R$ {Number(a.value).toFixed(2)}</td>
                <td className="p-2">{a.installment ?? '-'}</td>
                <td className="p-2">{a.type}</td>
                <td className="p-2">{a.owner?.name ?? '-'}</td>
                <td className="p-2">
                  {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
