export type StatusFilter = 'all' | 'active' | 'overdue' | 'paid_off'
export type LoanStatus = Exclude<StatusFilter, 'all'>
export type SortKey = 'newest' | 'due_asc' | 'due_desc' | 'remaining_desc' | 'name_asc'
export type CapitalTxType = 'inject_capital' | 'withdraw_profit' | 'profit_in'

type Money = number | string

export interface Repayment {
  id?: string
  amount_paid: Money
  principal_portion?: Money | null
  profit_portion?: Money | null
}

export interface Collateral {
  id: string
  item_name: string
  status: string // 'held' | 'returned'
}

export interface Loan {
  id: string
  borrower_id?: string
  principal_amount: Money
  margin_amount: Money
  total_amount: Money
  due_date: string
  status?: string
  created_at?: string
  borrowers?: { name?: string; notes?: string | null } | null
  repayments?: Repayment[]
  collaterals?: Collateral[]
}

export interface CapitalTx {
  id: string
  type: string // inject_capital | withdraw_profit | profit_in | loan_out | repayment_principal
  amount: Money
  description?: string | null
  created_at?: string
  loan_id?: string | null
}
