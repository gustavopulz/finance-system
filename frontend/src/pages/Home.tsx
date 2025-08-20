import { useState } from 'react'
import AccountTable from '../components/AccountTable'
import AccountModal from '../components/AccountModal'

export default function Home() {
  const [open, setOpen] = useState(false)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Financeiro</h1>
      <AccountTable onAdd={() => setOpen(true)} />
      <AccountModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
