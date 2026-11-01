import type { SortKey, StatusFilter } from '@/lib/types'

// Transaksi kas yang diinput manual oleh owner (bisa diedit/dihapus)
export const MANUAL_CAP_TYPES: string[] = ['inject_capital', 'withdraw_profit', 'profit_in']

export const CAP_TX_LABEL: Record<string, string> = {
  inject_capital: 'Inject Modal',
  withdraw_profit: 'Withdraw Profit',
  profit_in: 'Catat Profit',
}

export const CAP_TX_COLOR: Record<string, string> = {
  inject_capital: 'text-blue-600',
  withdraw_profit: 'text-rose-600',
  profit_in: 'text-emerald-600',
}

export const CAP_TX_DEFAULT_DESC: Record<string, string> = {
  inject_capital: 'Suntik Modal Kerja',
  withdraw_profit: 'Tarik Profit Bersih',
  profit_in: 'Profit Dicatat Manual',
}

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid_off', label: 'Lunas' },
]

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Terbaru dibuat' },
  { key: 'due_asc', label: 'Jatuh tempo terdekat' },
  { key: 'due_desc', label: 'Jatuh tempo terjauh' },
  { key: 'remaining_desc', label: 'Sisa tagihan terbesar' },
  { key: 'name_asc', label: 'Nama A–Z' },
]

export const QUICK_AMOUNTS = [500000, 1000000, 2000000, 5000000, 10000000]
