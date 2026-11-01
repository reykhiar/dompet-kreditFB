import { formatRupiah } from '@/lib/format'
import type { CapitalTxType } from '@/lib/types'
import type { CapitalForm } from '@/hooks/useCapitalForm'
import { QuickChips } from './QuickChips'

// MODAL 3: INJECT CAPITAL / WITHDRAW PROFIT / CATAT PROFIT
export function CapitalModal({ form }: { form: CapitalForm }) {
  if (!form.isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900">
          {form.editingCapTxId ? 'Edit Transaksi Kas' : 'Kelola Arus Kas'}
        </h3>
        <form onSubmit={form.submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Jenis Transaksi</label>
            <select
              value={form.capType}
              onChange={e => form.setCapType(e.target.value as CapitalTxType)}
              className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="inject_capital">➕ Inject Modal Kerja Baru</option>
              <option value="profit_in">✅ Catat Profit Masuk (manual)</option>
              <option value="withdraw_profit">💸 Tarik Profit Murni (Gajian)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Nominal (Rp) *</label>
            <input
              required
              type="text"
              value={formatRupiah(form.capAmount)}
              onChange={e => form.setCapAmount(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="500.000"
            />
            <QuickChips onSelect={amt => form.setCapAmount(amt.toString())} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Keterangan / Catatan</label>
            <input type="text" value={form.capDesc} onChange={e => form.setCapDesc(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: Suntikan modal tambahan" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={form.close} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
            <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
              {form.editingCapTxId ? 'Update Transaksi' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
