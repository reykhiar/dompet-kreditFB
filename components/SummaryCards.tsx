import { ArrowUpRight, PiggyBank, Wallet } from 'lucide-react'
import type { CashSummary } from '@/lib/cash'

// --- PEMISAH KAS ---
export function SummaryCards({ cash }: { cash: CashSummary }) {
  const { liquidCapital, totalPrincipalOut, pureProfitBank, totalMarginReceived, unrecordedMargin } = cash

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="flex justify-between items-center text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">Kas Modal Siap Pakai</span>
          <Wallet className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Rp {Math.max(0, liquidCapital).toLocaleString('id-ID')}
        </h2>
        <p className="text-xs text-slate-400">Modal mengendap yang siap dipinjamkan</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="flex justify-between items-center text-slate-500">
          <span className="text-xs font-semibold uppercase tracking-wider">Modal Dipinjamkan</span>
          <ArrowUpRight className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-amber-600">
          Rp {totalPrincipalOut.toLocaleString('id-ID')}
        </h2>
        <p className="text-xs text-slate-400">Pokok uang modal yang lagi dibawa peminjam</p>
      </div>

      <div className="bg-emerald-900 text-white p-5 rounded-xl border border-emerald-800 shadow-md space-y-1">
        <div className="flex justify-between items-center text-emerald-300">
          <span className="text-xs font-semibold uppercase tracking-wider">Kantong Profit Murni</span>
          <PiggyBank className="w-5 h-5 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-300">
          Rp {pureProfitBank.toLocaleString('id-ID')}
        </h2>
        <p className="text-xs text-emerald-200/70">Keuntungan bersih (Bisa ditarik/dipakai bebas)</p>
        {totalMarginReceived > 0 && (
          <p className="text-[11px] text-emerald-200/70 pt-1 border-t border-emerald-800 mt-2">
            Margin diterima dari cicilan: Rp {totalMarginReceived.toLocaleString('id-ID')}
            {unrecordedMargin > 0 && (
              <span className="text-amber-300"> · belum dicatat: Rp {unrecordedMargin.toLocaleString('id-ID')}</span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
