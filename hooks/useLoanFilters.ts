import { useMemo, useState } from 'react'
import { getLoanStatus, getRemaining } from '@/lib/loan-utils'
import type { Loan, SortKey, StatusFilter } from '@/lib/types'

// --- SEARCH / FILTER / SORT PINJAMAN ---
export function useLoanFilters(loans: Loan[], today: string) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const statusCounts = {
    all: loans.length,
    active: loans.filter(l => getLoanStatus(l, today) === 'active').length,
    overdue: loans.filter(l => getLoanStatus(l, today) === 'overdue').length,
    paid_off: loans.filter(l => getLoanStatus(l, today) === 'paid_off').length,
  }

  const filteredLoans = useMemo(() => {
    return loans
      .filter(l => statusFilter === 'all' || getLoanStatus(l, today) === statusFilter)
      .filter(l => {
        if (!normalizedQuery) return true
        const haystack = [
          l.borrowers?.name,
          l.borrowers?.notes,
          ...(l.collaterals || []).map(c => c.item_name),
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(normalizedQuery)
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'due_asc': return String(a.due_date).localeCompare(String(b.due_date))
          case 'due_desc': return String(b.due_date).localeCompare(String(a.due_date))
          case 'remaining_desc': return getRemaining(b) - getRemaining(a)
          case 'name_asc': return String(a.borrowers?.name || '').localeCompare(String(b.borrowers?.name || ''), 'id')
          default: return String(b.created_at).localeCompare(String(a.created_at))
        }
      })
  }, [loans, today, statusFilter, normalizedQuery, sortKey])

  const isFiltering = statusFilter !== 'all' || normalizedQuery !== ''

  function resetFilters() {
    setSearchQuery('')
    setStatusFilter('all')
  }

  return {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sortKey, setSortKey,
    statusCounts, filteredLoans, isFiltering, resetFilters,
  }
}

export type LoanFilters = ReturnType<typeof useLoanFilters>
