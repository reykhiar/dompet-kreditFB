import { ChevronDown, Search, X } from 'lucide-react'
import { SORT_OPTIONS, STATUS_FILTERS } from '@/lib/constants'
import type { SortKey } from '@/lib/types'
import type { LoanFilters } from '@/hooks/useLoanFilters'

// TOOLBAR: search, sorting, filter status (segmented control)
// Catatan iPhone: font input harus >=16px (text-base) supaya Safari tidak auto-zoom saat fokus.
export function LoanToolbar({ filters }: { filters: LoanFilters }) {
  const {
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sortKey, setSortKey,
    statusCounts,
  } = filters

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-slate-100 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, catatan, atau agunan..."
            className="w-full h-11 pl-10 pr-10 bg-slate-100 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Hapus pencarian"
              aria-label="Hapus pencarian"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort — select native tapi panah dibuat sendiri */}
        <div className="relative sm:w-56">
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            aria-label="Urutkan pinjaman"
            className="appearance-none w-full h-11 pl-3.5 pr-10 bg-slate-100 rounded-xl text-base sm:text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Filter status: segmented control ala iOS */}
      <div className="flex w-full sm:w-fit gap-0.5 p-0.5 bg-slate-100 rounded-xl">
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f.key
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setStatusFilter(f.key)}
              className={`flex-1 sm:flex-none sm:px-4 py-1.5 rounded-[10px] text-[13px] font-medium whitespace-nowrap transition ${
                active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
              <span className="ml-1 text-xs tabular-nums text-slate-400">
                {statusCounts[f.key]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
