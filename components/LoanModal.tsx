import { formatRupiah } from '@/lib/format'
import type { LoanForm } from '@/hooks/useLoanForm'
import { QuickChips } from './QuickChips'

// MODAL 1: PINJAMAN BARU / EDIT
export function LoanModal({ form }: { form: LoanForm }) {
  if (!form.isOpen) return null

  const { editingLoanId, principalLocked } = form

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900">
          {editingLoanId ? 'Edit Pinjaman' : 'Buat Pinjaman Baru'}
        </h3>
        <form onSubmit={form.submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Nama Peminjam *</label>
            <input required type="text" value={form.name} onChange={e => form.setName(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: Budi" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Catatan (Opsional)</label>
            <input type="text" value={form.notes} onChange={e => form.setNotes(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: Pak Budi, tukang bakso" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-600">Nominal Pokok (Rp) *</label>
              <input
                required
                type="text"
                disabled={principalLocked}
                value={formatRupiah(form.principal)}
                onChange={e => form.setPrincipal(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                placeholder="1.000.000"
              />
              {!principalLocked && (
                <QuickChips onSelect={amt => form.setPrincipal(amt.toString())} />
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Flat Margin (Rp) *</label>
              <input
                required
                type="text"
                disabled={principalLocked}
                value={formatRupiah(form.margin)}
                onChange={e => form.setMargin(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                placeholder="200.000"
              />
            </div>
          </div>
          {principalLocked && (
            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
              Pokok & margin dikunci karena pinjaman ini sudah punya riwayat cicilan — mengubahnya bisa bikin perhitungan profit yang sudah tercatat jadi salah.
            </p>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-600">Tanggal Jatuh Tempo *</label>
            <input required type="date" value={form.dueDate} onChange={e => form.setDueDate(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Jaminan / Agunan (Opsional)</label>
            <input type="text" value={form.collateral} onChange={e => form.setCollateral(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: STNK Vario 2020 / KTP Asli" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={form.close} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
            <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              {editingLoanId ? 'Update Pinjaman' : 'Simpan Pinjaman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
