import { formatRupiah } from '@/lib/format'
import { getPrincipalReturned, getRemaining } from '@/lib/loan-utils'
import type { PaymentForm } from '@/hooks/usePayment'
import { QuickChips } from './QuickChips'

// MODAL 2: CICIL / BAYAR
export function PaymentModal({ payment }: { payment: PaymentForm }) {
  const { selectedLoan } = payment
  if (!selectedLoan) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Catat Pembayaran</h3>
          <p className="text-xs text-slate-500 mt-0.5">Peminjam: <span className="font-semibold text-slate-700">{selectedLoan.borrowers?.name}</span></p>
        </div>

        <form onSubmit={payment.submit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Nominal Pembayaran (Rp)</label>
            <input
              autoFocus
              required
              type="text"
              value={formatRupiah(payment.payAmount)}
              onChange={e => payment.setPayAmount(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masukkan nominal"
            />
            <QuickChips onSelect={amt => payment.setPayAmount(amt.toString())} />
            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1.5 mt-2">
              Cicilan masuk ke pokok dulu. Sisa pokok: Rp {Math.max(0, Number(selectedLoan.principal_amount) - getPrincipalReturned(selectedLoan)).toLocaleString('id-ID')}
              {' · '}Sisa tagihan: Rp {Math.max(0, getRemaining(selectedLoan)).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={payment.close} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
            <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Simpan Bayar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
