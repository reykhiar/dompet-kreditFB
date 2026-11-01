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

// Versi TABEL — layar >=640px (tablet/desktop)
export function LoanTable({ loans, today, onPay, onEdit, onDelete }: Props) {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
            <th className="p-4">Peminjam</th>
            <th className="p-4">Pokok + Margin</th>
            <th className="p-4">Agunan / Jaminan</th>
            <th className="p-4">Sisa Tagihan</th>
            <th className="p-4">Jatuh Tempo</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {loans.map((item) => {
            const remaining = getRemaining(item)
            const collateralItem = item.collaterals?.[0]

            return (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="p-4">
                  <div className="font-medium text-slate-900">{item.borrowers?.name}</div>
                  {item.borrowers?.notes && <div className="text-xs text-slate-400">{item.borrowers.notes}</div>}
                </td>
                <td className="p-4">
                  <div className="font-medium">Rp {Number(item.total_amount).toLocaleString('id-ID')}</div>
                  <div className="text-xs text-emerald-600">Margin: +Rp {Number(item.margin_amount).toLocaleString('id-ID')}</div>
                </td>
                <td className="p-4">
                  {collateralItem ? (
                    <div className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-slate-400" />
                      <div>
                        <div className="text-xs font-medium text-slate-700">{collateralItem.item_name}</div>
                        <span className={`text-[10px] font-semibold ${collateralItem.status === 'returned' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {collateralItem.status === 'returned' ? 'Dikembalikan' : 'Disimpan'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300">-</span>
                  )}
                </td>
                <td className="p-4 font-bold text-slate-900">
                  Rp {remaining > 0 ? remaining.toLocaleString('id-ID') : 0}
                </td>
                <td className="p-4 text-xs text-slate-500">
                  {item.due_date}
                </td>
                <td className="p-4">
                  <StatusBadge status={getLoanStatus(item, today)} />
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {item.status !== 'paid_off' && (
                      <button
                        onClick={() => onPay(item)}
                        className="inline-flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md font-medium transition"
                      >
                        <HandCoins className="w-3.5 h-3.5" /> Cicil / Bayar
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit pinjaman"
                      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      title="Hapus pinjaman"
                      className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
