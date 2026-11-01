import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { parseRawNumber } from '@/lib/format'
import { getPrincipalReturned, getTotalPaid } from '@/lib/loan-utils'
import type { Loan } from '@/lib/types'

// Modal Cicil / Bayar
export function usePayment(refetch: () => void | Promise<void>) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [payAmount, setPayAmount] = useState('')

  const open = (loan: Loan) => setSelectedLoan(loan)
  const close = () => setSelectedLoan(null)

  // 2. Catat Cicilan / Pelunasan
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!selectedLoan) return

    const amountPaid = parseRawNumber(payAmount)
    if (amountPaid <= 0) return alert('Nominal tidak valid')

    const totalLoan = Number(selectedLoan.total_amount)
    const alreadyPaid = getTotalPaid(selectedLoan)
    const remainingBefore = totalLoan - alreadyPaid

    // Guard: cegah input cicilan melebihi sisa tagihan (data jadi negatif/aneh kalau lolos)
    if (amountPaid > remainingBefore) {
      return alert(`Nominal melebihi sisa tagihan (Rp ${remainingBefore.toLocaleString('id-ID')})`)
    }

    // ATURAN: cicilan masuk ke POKOK dulu. Baru setelah pokok kembali penuh,
    // kelebihannya dihitung sebagai margin yang diterima (profit_portion).
    // Margin ini TIDAK otomatis masuk Kantong Profit — owner mencatatnya sendiri
    // lewat "Kelola Kas" (Catat Profit Masuk).
    const principalReturnedBefore = getPrincipalReturned(selectedLoan)
    const principalRemaining = Math.max(0, Number(selectedLoan.principal_amount) - principalReturnedBefore)
    const principalPaid = Math.min(amountPaid, principalRemaining)
    const marginReceived = amountPaid - principalPaid

    const { error: repError } = await supabase
      .from('repayments')
      .insert([{
        loan_id: selectedLoan.id,
        amount_paid: amountPaid,
        principal_portion: principalPaid,
        profit_portion: marginReceived
      }])

    if (repError) {
      console.error('Insert repayment error:', repError)
      return alert(`Gagal mencatat cicilan: ${repError.message}`)
    }

    const currentTotalPaid = alreadyPaid + amountPaid
    const isPaidOff = currentTotalPaid >= totalLoan

    if (isPaidOff) {
      const { error: loanUpdateError } = await supabase.from('loans').update({ status: 'paid_off' }).eq('id', selectedLoan.id)
      if (loanUpdateError) console.error('Update loan status error:', loanUpdateError)

      if ((selectedLoan.collaterals?.length ?? 0) > 0) {
        const { error: collateralError } = await supabase.from('collaterals').update({ status: 'returned' }).eq('loan_id', selectedLoan.id)
        if (collateralError) console.error('Update collateral error:', collateralError)
      }
    }

    // Hanya pengembalian pokok yang dicatat otomatis ke kas modal.
    // Margin sengaja TIDAK dibuatkan transaksi otomatis (profit = input manual).
    if (principalPaid > 0) {
      const { error: capTxError } = await supabase.from('capital_transactions').insert([
        { type: 'repayment_principal', amount: principalPaid, description: `Pengembalian Modal (${selectedLoan.borrowers?.name})`, loan_id: selectedLoan.id }
      ])
      if (capTxError) {
        console.error('Insert capital_transactions error:', capTxError)
        alert(`Cicilan tercatat, TAPI pencatatan kas modal gagal: ${capTxError.message}`)
      }
    }

    setPayAmount('')
    setSelectedLoan(null)
    refetch()
  }

  return { selectedLoan, payAmount, setPayAmount, open, close, submit }
}

export type PaymentForm = ReturnType<typeof usePayment>
