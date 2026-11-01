'use client'

import { MANUAL_CAP_TYPES } from '@/lib/constants'
import { computeCashSummary } from '@/lib/cash'
import { getToday } from '@/lib/loan-utils'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useLoanFilters } from '@/hooks/useLoanFilters'
import { useLoanForm } from '@/hooks/useLoanForm'
import { usePayment } from '@/hooks/usePayment'
import { useCapitalForm } from '@/hooks/useCapitalForm'
import { DashboardHeader } from '@/components/DashboardHeader'
import { SummaryCards } from '@/components/SummaryCards'
import { LoanListSection } from '@/components/LoanListSection'
import { CapitalHistory } from '@/components/CapitalHistory'
import { LoanModal } from '@/components/LoanModal'
import { PaymentModal } from '@/components/PaymentModal'
import { CapitalModal } from '@/components/CapitalModal'

export default function Dashboard() {
  const { loans, capitalTxs, loading, refetch } = useDashboardData()
  const today = getToday()

  const cash = computeCashSummary(loans, capitalTxs)
  const filters = useLoanFilters(loans, today)

  const loanForm = useLoanForm(loans, refetch)
  const payment = usePayment(refetch)
  const capitalForm = useCapitalForm(refetch)

  // Transaksi kas yang diinput manual (bisa diedit/dihapus) — beda sama loan_out/repayment_* yang otomatis dari sistem
  const manualCapTxs = capitalTxs.filter(t => MANUAL_CAP_TYPES.includes(t.type))

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <DashboardHeader onNewCapitalTx={capitalForm.openNew} onNewLoan={loanForm.openNew} />

        <SummaryCards cash={cash} />

        <LoanListSection
          loans={loans}
          loading={loading}
          today={today}
          filters={filters}
          onPay={payment.open}
          onEdit={loanForm.openEdit}
          onDelete={loanForm.remove}
        />

        <CapitalHistory
          txs={manualCapTxs}
          loading={loading}
          onEdit={capitalForm.openEdit}
          onDelete={capitalForm.remove}
        />
      </div>

      <LoanModal form={loanForm} />
      <PaymentModal payment={payment} />
      <CapitalModal form={capitalForm} />
    </div>
  )
}
