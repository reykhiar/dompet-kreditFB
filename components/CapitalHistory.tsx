import { Pencil, Trash2 } from 'lucide-react'
import { CAP_TX_COLOR, CAP_TX_LABEL } from '@/lib/constants'
import type { CapitalTx } from '@/lib/types'

interface Props {
  txs: CapitalTx[]
  loading: boolean
  onEdit: (tx: CapitalTx) => void
  onDelete: (tx: CapitalTx) => void
}

// RIWAYAT KAS MODAL/PROFIT (hanya transaksi manual: inject_capital, profit_in & withdraw_profit)
export function CapitalHistory({ txs, loading, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Mobile: judul di atas, keterangan di bawah. Desktop: sejajar kiri-kanan */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h3 className="text-base font-semibold text-slate-900">Riwayat Kas Modal/Profit</h3>
        <span className="text-xs text-slate-400">Inject, Profit & Withdraw manual</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat data...</div>
      ) : txs.length === 0 ? (
        <div className="p-8 text-center text-slate-400">Belum ada transaksi kas manual.</div>
      ) : (
        <>
          {/* Versi TABEL — layar >=640px */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Jenis</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {txs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-xs text-slate-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold ${CAP_TX_COLOR[tx.type] || 'text-slate-600'}`}>
                        {CAP_TX_LABEL[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{tx.description}</td>
                    <td className="p-4 font-medium">Rp {Number(tx.amount).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(tx)}
                          title="Edit transaksi"
                          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(tx)}
                          title="Hapus transaksi"
                          className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Versi KARTU — layar <640px (iPhone 11 & HP lain)
              Kiri: jenis, keterangan, tanggal. Kanan: nominal + tombol aksi. */}
          <div className="sm:hidden divide-y divide-slate-100">
            {txs.map((tx) => (
              <div key={tx.id} className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-semibold ${CAP_TX_COLOR[tx.type] || 'text-slate-600'}`}>
                    {CAP_TX_LABEL[tx.type] || tx.type}
                  </span>
                  <div className="text-[15px] text-slate-700 truncate mt-0.5">{tx.description}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="text-[17px] font-semibold text-slate-900 tabular-nums">
                    Rp {Number(tx.amount).toLocaleString('id-ID')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(tx)}
                      title="Edit transaksi"
                      aria-label="Edit transaksi"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      title="Hapus transaksi"
                      aria-label="Hapus transaksi"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-red-50 text-red-500 active:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
