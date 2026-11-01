import type { Loan } from '@/lib/types'
import type { LoanFilters } from '@/hooks/useLoanFilters'
import { LoanToolbar } from './LoanToolbar'
import { LoanTable } from './LoanTable'
import { LoanCards } from './LoanCards'

interface Props {
  loans: Loan[]
  loading: boolean
  today: string
  filters: LoanFilters
  onPay: (loan: Loan) => void
  onEdit: (loan: Loan) => void
  onDelete: (loan: Loan) => void
}

// --- TABEL UTAMA PINJAMAN ---
export function LoanListSection({ loans, loading, today, filters, onPay, onEdit, onDelete }: Props) {
  const { filteredLoans, isFiltering, resetFilters } = filters

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Mobile: judul di atas, keterangan di bawah. Desktop: sejajar kiri-kanan */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h3 className="text-base font-semibold text-slate-900">Daftar Pinjaman & Agunan</h3>
        <span className="text-xs text-slate-400">
          {isFiltering ? `${filteredLoans.length} dari ${loans.length}` : `Total: ${loans.length}`} Transaksi
        </span>
      </div>

      {!loading && loans.length > 0 && <LoanToolbar filters={filters} />}

      {loading ? (
        <div className="p-8 text-center text-slate-400">Memuat data...</div>
      ) : loans.length === 0 ? (
        <div className="p-8 text-center text-slate-400">Belum ada catatan pinjaman.</div>
      ) : filteredLoans.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-slate-400">Tidak ada pinjaman yang cocok dengan pencarian/filter.</p>
          <button type="button" onClick={resetFilters} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Reset pencarian & filter
          </button>
        </div>
      ) : (
        <>
          <LoanTable loans={filteredLoans} today={today} onPay={onPay} onEdit={onEdit} onDelete={onDelete} />
          <LoanCards loans={filteredLoans} today={today} onPay={onPay} onEdit={onEdit} onDelete={onDelete} />
        </>
      )}
    </div>
  )
}
