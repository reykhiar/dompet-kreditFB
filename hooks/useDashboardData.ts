import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CapitalTx, Loan } from '@/lib/types'

export function useDashboardData() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [capitalTxs, setCapitalTxs] = useState<CapitalTx[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)

    const { data: loansData } = await supabase
      .from('loans')
      .select('*, borrowers(name, notes), repayments(*), collaterals(*)')
      .order('created_at', { ascending: false })

    const { data: capData } = await supabase
      .from('capital_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    setLoans(loansData || [])
    setCapitalTxs(capData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { loans, capitalTxs, loading, refetch }
}
