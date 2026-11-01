import { QUICK_AMOUNTS } from '@/lib/constants'

// --- SHORTCUT CHIPS COMPONENT ---
export function QuickChips({ onSelect }: { onSelect: (amount: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {QUICK_AMOUNTS.map((amt) => (
        <button
          key={amt}
          type="button"
          onClick={() => onSelect(amt)}
          className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-2 py-0.5 rounded-md transition border border-slate-200"
        >
          +Rp {new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(amt)}
        </button>
      ))}
    </div>
  )
}
