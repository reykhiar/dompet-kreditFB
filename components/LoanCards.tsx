import type { ReactNode } from 'react'
import { Box, HandCoins, Pencil, Trash2 } from 'lucide-react'
import { getLoanStatus, getRemaining } from '@/lib/loan-utils'
import type { Loan } from '@/lib/types'
import { StatusBadge } from './StatusBadge'

interface Props {
  loans: Loan[]
  today: string
  onPay: (loan: Loan) => void
  onEdit: (loan: Loan) => void
  onDelete: (loan: Loan) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      {children}
    </div>
  )
}

// Versi KARTU — layar <640px (iPhone 11 & HP lain), nggak perlu scroll horizontal
export function LoanCards({ loans, today, onPay, onEdit, onDelete }: Props) {
  return (
    <div className="sm:hidden divide-y divide-slate-100">
      {loans.map((item) => {
        const remaining = getRemaining(item)
        const collateralItem = item.collaterals?.[0]
        const isPaidOff = item.status === 'paid_off'

        return (
          <div key={item.id} className="p-4 space-y-3">
            {/* Nama + status */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900 truncate">{item.borrowers?.name}</div>
                {item.borrowers?.notes && (
                  <div className="text-sm text-slate-500 truncate">{item.borrowers.notes}</div>
                )}
              </div>
              <StatusBadge status={getLoanStatus(item, today)} className="shrink-0" />
            </div>

            {/* Rincian */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-slate-50 p-3">
              <Field label="Pokok + Margin">
                <div className="text-[15px] font-semibold text-slate-900">
                  Rp {Number(item.total_amount).toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-emerald-600 mt-0.5">
                  +Rp {Number(item.margin_amount).toLocaleString('id-ID')}
                </div>
              </Field>
              <Field label="Sisa Tagihan">
                <div className="text-[15px] font-bold text-slate-900">
                  Rp {remaining > 0 ? remaining.toLocaleString('id-ID') : 0}
                </div>
              </Field>
              <Field label="Jatuh Tempo">
                <div className="text-[15px] text-slate-700">{item.due_date}</div>
              </Field>
              <Field label="Agunan">
                {collateralItem ? (
                  <div className="flex items-center gap-1 min-w-0">
                    <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[15px] text-slate-700 truncate">{collateralItem.item_name}</span>
                  </div>
                ) : (
                  <span className="text-[15px] text-slate-300">-</span>
                )}
              </Field>
            </div>

            {/* Aksi — tinggi 44px (tap target iOS) */}
            <div className="flex items-center gap-2">
              {!isPaidOff && (
                <button
                  onClick={() => onPay(item)}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-blue-600 text-[15px] font-semibold active:bg-blue-100 transition"
                >
                  <HandCoins className="w-4 h-4" /> Cicil / Bayar
                </button>
              )}
              <button
                onClick={() => onEdit(item)}
                title="Edit pinjaman"
                aria-label="Edit pinjaman"
                className={`h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200 transition ${isPaidOff ? 'flex-1' : 'w-11 shrink-0'}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                title="Hapus pinjaman"
                aria-label="Hapus pinjaman"
                className={`h-11 inline-flex items-center justify-center rounded-xl bg-red-50 text-red-500 active:bg-red-100 transition ${isPaidOff ? 'flex-1' : 'w-11 shrink-0'}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
