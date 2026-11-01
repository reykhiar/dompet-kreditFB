import { Plus, RefreshCw } from 'lucide-react'

interface Props {
  onNewCapitalTx: () => void
  onNewLoan: () => void
}

export function DashboardHeader({ onNewCapitalTx, onNewLoan }: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dompet Kredit</h1>
        <p className="text-sm text-slate-500">Sistem Mikro Pinjaman, Agunan, & Pemisah Kas Modal/Profit</p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={onNewCapitalTx}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 sm:py-2 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4 shrink-0" /> Kelola Kas Modal/Profit
        </button>
        <button
          onClick={onNewLoan}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4 shrink-0" /> Pinjaman Baru
        </button>
      </div>
    </div>
  )
}
