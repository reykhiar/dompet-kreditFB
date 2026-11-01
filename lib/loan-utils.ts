import type { Loan, LoanStatus } from '@/lib/types'

// NOTE: ini UTC (perilaku asli dipertahankan). Jam 00:00–07:00 WIB hasilnya masih "kemarin".
// Kalau mau pakai zona lokal: new Date().toLocaleDateString('en-CA')
export const getToday = () => new Date().toISOString().split('T')[0]

// Total pokok yang sudah kembali dari cicilan pinjaman ini
export const getPrincipalReturned = (loan: Loan) =>
  (loan.repayments || []).reduce((acc, r) => acc + Number(r.principal_portion || 0), 0)

export const getTotalPaid = (loan: Loan) =>
  (loan.repayments || []).reduce((acc, r) => acc + Number(r.amount_paid), 0)

export const getRemaining = (loan: Loan) => Number(loan.total_amount) - getTotalPaid(loan)

export const getLoanStatus = (loan: Loan, today: string): LoanStatus =>
  loan.status === 'paid_off' ? 'paid_off' : loan.due_date < today ? 'overdue' : 'active'
