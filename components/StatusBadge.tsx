import { CheckCircle, Clock, ShieldAlert } from 'lucide-react'
import type { LoanStatus } from '@/lib/types'

const BASE = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium'

export function StatusBadge({ status, className = '' }: { status: LoanStatus; className?: string }) {
  if (status === 'paid_off') {
    return (
      <span className={`${BASE} bg-emerald-50 text-emerald-700 ${className}`}>
        <CheckCircle className="w-3 h-3" /> Lunas
      </span>
    )
  }
  if (status === 'overdue') {
    return (
      <span className={`${BASE} bg-red-50 text-red-700 ${className}`}>
        <ShieldAlert className="w-3 h-3" /> Overdue
      </span>
    )
  }
  return (
    <span className={`${BASE} bg-amber-50 text-amber-700 ${className}`}>
      <Clock className="w-3 h-3" /> Aktif
    </span>
  )
}
