import type { CapitalTx, Loan } from '@/lib/types'
import { getPrincipalReturned } from '@/lib/loan-utils'

export interface CashSummary {
  liquidCapital: number
  totalPrincipalOut: number
  pureProfitBank: number
  totalMarginReceived: number
  unrecordedMargin: number
}

// --- KALKULASI ARUS KAS ---
export function computeCashSummary(loans: Loan[], capitalTxs: CapitalTx[]): CashSummary {
  const sumByType = (type: string) =>
    capitalTxs.filter(t => t.type === type).reduce((acc, t) => acc + Number(t.amount), 0)

  const totalInjected = sumByType('inject_capital')
  const totalLoanOut = sumByType('loan_out')
  const totalPrincipalReturned = sumByType('repayment_principal')
  // Profit di kantong HANYA dari input manual (profit_in)
  const totalProfitEarned = sumByType('profit_in')
  const totalProfitWithdrawn = sumByType('withdraw_profit')

  // Modal yang masih dibawa peminjam = pokok - pokok yang sudah kembali (dari principal_portion)
  const totalPrincipalOut = loans
    .filter(l => l.status !== 'paid_off')
    .reduce((acc, l) => acc + Math.max(0, Number(l.principal_amount) - getPrincipalReturned(l)), 0)

  // Margin yang sudah diterima dari cicilan (hanya informasi, tidak otomatis masuk kantong)
  const totalMarginReceived = loans.reduce(
    (acc, l) => acc + (l.repayments || []).reduce((s, r) => s + Number(r.profit_portion || 0), 0),
    0
  )
  const unrecordedMargin = Math.max(0, totalMarginReceived - totalProfitEarned)

  // Rumus asli: injected - out + (returned - (loanOut - out)) — suku `out` saling meniadakan,
  // hasilnya identik dengan: injected - loanOut + returned
  const liquidCapital = totalInjected - totalLoanOut + totalPrincipalReturned
  const pureProfitBank = totalProfitEarned - totalProfitWithdrawn

  return { liquidCapital, totalPrincipalOut, pureProfitBank, totalMarginReceived, unrecordedMargin }
}
