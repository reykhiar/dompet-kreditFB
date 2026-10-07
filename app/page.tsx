'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Wallet, ArrowUpRight, Clock, CheckCircle, HandCoins, 
  ShieldAlert, PiggyBank, RefreshCw, Box, Pencil, Trash2
} from 'lucide-react'

// --- HELPER FORMAT RUPIAH ---
const formatRupiah = (val: string | number) => {
  if (!val) return ''
  const raw = val.toString().replace(/\D/g, '')
  return new Intl.NumberFormat('id-ID').format(Number(raw))
}

const parseRawNumber = (val: string) => {
  return Number(val.replace(/\D/g, '')) || 0
}

// --- SHORTCUT CHIPS COMPONENT ---
const QuickChips = ({ onSelect }: { onSelect: (amount: number) => void }) => {
  const options = [500000, 1000000, 2000000, 5000000, 10000000]
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {options.map((amt) => (
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

export default function Dashboard() {
  const [loans, setLoans] = useState<any[]>([])
  const [capitalTxs, setCapitalTxs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<any>(null)

  // Form State Pinjaman Baru / Edit Pinjaman
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [principal, setPrincipal] = useState('')
  const [margin, setMargin] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [collateral, setCollateral] = useState('')
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null)
  // true kalau pinjaman yang sedang diedit sudah punya riwayat cicilan
  // -> pokok/margin dikunci supaya tidak merusak principal_portion/profit_portion yang sudah tercatat
  const [hasRepaymentsForEdit, setHasRepaymentsForEdit] = useState(false)

  // Form State Cicil / Bayar
  const [payAmount, setPayAmount] = useState('')

  // Form State Transaksi Kas (Inject / Withdraw) / Edit Transaksi Kas
  const [capType, setCapType] = useState<'inject_capital' | 'withdraw_profit'>('inject_capital')
  const [capAmount, setCapAmount] = useState('')
  const [capDesc, setCapDesc] = useState('')
  const [editingCapTxId, setEditingCapTxId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const { data: loansData } = await supabase
      .from('loans')
      .select('*, borrowers(name, phone_number), repayments(*), collaterals(*)')
      .order('created_at', { ascending: false })

    const { data: capData } = await supabase
      .from('capital_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    setLoans(loansData || [])
    setCapitalTxs(capData || [])
    setLoading(false)
  }

  // 1. Tambah Pinjaman Baru
  async function handleSubmitLoan(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: borrower, error: bError } = await supabase
      .from('borrowers')
      .insert([{ name, phone_number: phone }])
      .select()
      .single()

    if (bError) {
      console.error('Insert borrower error:', bError)
      return alert(`Gagal menambah peminjam: ${bError.message}`)
    }

    const principalNum = parseRawNumber(principal)
    const marginNum = parseRawNumber(margin)
    const totalNum = principalNum + marginNum

    const { data: loan, error: lError } = await supabase
      .from('loans')
      .insert([{
        borrower_id: borrower.id,
        principal_amount: principalNum,
        margin_amount: marginNum,
        total_amount: totalNum,
        due_date: dueDate
      }])
      .select()
      .single()

    if (lError) {
      console.error('Insert loan error:', lError)
      return alert(`Gagal membuat pinjaman: ${lError.message}`)
    }

    if (collateral) {
      const { error: collError } = await supabase.from('collaterals').insert([{
        loan_id: loan.id,
        item_name: collateral,
        status: 'held'
      }])
      if (collError) console.error('Insert collateral error:', collError)
    }

    const { error: capTxError } = await supabase.from('capital_transactions').insert([{
      type: 'loan_out',
      amount: principalNum,
      description: `Pinjaman Keluar (${name})`,
      loan_id: loan.id
    }])
    if (capTxError) {
      console.error('Insert capital_transactions (loan_out) error:', capTxError)
      alert(`Pinjaman berhasil dibuat, TAPI pencatatan kas gagal: ${capTxError.message}\n\nDashboard Kas Modal Siap Pakai/Modal Dipinjamkan tidak akan akurat sampai ini dibenerin.`)
    }

    resetLoanForm()
    setIsLoanModalOpen(false)
    fetchData()
  }

  function resetLoanForm() {
    setName(''); setPhone(''); setPrincipal(''); setMargin(''); setDueDate(''); setCollateral('')
    setEditingLoanId(null)
    setHasRepaymentsForEdit(false)
  }

  function openNewLoan() {
    resetLoanForm()
    setIsLoanModalOpen(true)
  }

  function openEditLoan(loan: any) {
    setEditingLoanId(loan.id)
    setName(loan.borrowers?.name || '')
    setPhone(loan.borrowers?.phone_number || '')
    setPrincipal(String(loan.principal_amount))
    setMargin(String(loan.margin_amount))
    setDueDate(loan.due_date || '')
    setCollateral(loan.collaterals?.[0]?.item_name || '')
    setHasRepaymentsForEdit((loan.repayments || []).length > 0)
    setIsLoanModalOpen(true)
  }

  // 1b. Update Pinjaman (edit)
  async function handleUpdateLoan(e: React.FormEvent) {
    e.preventDefault()
    if (!editingLoanId) return

    const target = loans.find(l => l.id === editingLoanId)
    if (!target) return

    if (target.borrower_id) {
      const { error: bError } = await supabase
        .from('borrowers')
        .update({ name, phone_number: phone })
        .eq('id', target.borrower_id)
      if (bError) { console.error('Update borrower error:', bError); return alert(`Gagal update peminjam: ${bError.message}`) }
    }

    const loanUpdatePayload: Record<string, any> = { due_date: dueDate }

    // Pokok & margin HANYA boleh diubah kalau belum ada cicilan sama sekali.
    if (!hasRepaymentsForEdit) {
      const principalNum = parseRawNumber(principal)
      const marginNum = parseRawNumber(margin)
      loanUpdatePayload.principal_amount = principalNum
      loanUpdatePayload.margin_amount = marginNum
      loanUpdatePayload.total_amount = principalNum + marginNum
    }

    const { error: lError } = await supabase.from('loans').update(loanUpdatePayload).eq('id', editingLoanId)
    if (lError) { console.error('Update loan error:', lError); return alert(`Gagal update pinjaman: ${lError.message}`) }

    // Sinkronkan nominal di capital_transactions 'loan_out' kalau pokok ikut berubah
    if (!hasRepaymentsForEdit) {
      const principalNum = parseRawNumber(principal)
      const { error: syncError } = await supabase
        .from('capital_transactions')
        .update({ amount: principalNum, description: `Pinjaman Keluar (${name})` })
        .eq('loan_id', editingLoanId)
        .eq('type', 'loan_out')
      if (syncError) console.error('Sync capital_transactions error:', syncError)
    }

    // Update / buat baru / hapus data agunan sesuai input
    const existingCollateral = target.collaterals?.[0]
    if (collateral) {
      if (existingCollateral) {
        const { error } = await supabase.from('collaterals').update({ item_name: collateral }).eq('id', existingCollateral.id)
        if (error) console.error('Update collateral error:', error)
      } else {
        const { error } = await supabase.from('collaterals').insert([{ loan_id: editingLoanId, item_name: collateral, status: 'held' }])
        if (error) console.error('Insert collateral error:', error)
      }
    } else if (existingCollateral) {
      const { error } = await supabase.from('collaterals').delete().eq('id', existingCollateral.id)
      if (error) console.error('Delete collateral error:', error)
    }

    resetLoanForm()
    setIsLoanModalOpen(false)
    fetchData()
  }

  // 1c. Hapus Pinjaman
  async function handleDeleteLoan(loan: any) {
    if ((loan.repayments || []).length > 0) {
      alert('Pinjaman ini sudah punya riwayat cicilan, jadi tidak bisa dihapus langsung — nanti data Kas Modal/Profit jadi tidak konsisten. Edit data pendukungnya saja (nama/WA/jatuh tempo/agunan), atau hubungi admin database kalau memang harus dihapus total.')
      return
    }

    if (!confirm(`Yakin mau hapus pinjaman a.n. ${loan.borrowers?.name}? Aksi ini tidak bisa dibatalkan.`)) return

    const { error: collError } = await supabase.from('collaterals').delete().eq('loan_id', loan.id)
    if (collError) console.error('Delete collateral error:', collError)

    const { error: capError } = await supabase.from('capital_transactions').delete().eq('loan_id', loan.id)
    if (capError) console.error('Delete capital_transactions error:', capError)

    const { error: loanError } = await supabase.from('loans').delete().eq('id', loan.id)
    if (loanError) {
      console.error('Delete loan error:', loanError)
      return alert(`Gagal hapus pinjaman: ${loanError.message}`)
    }

    fetchData()
  }

  // 2. Catat Cicilan / Pelunasan
  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLoan) return

    const amountPaid = parseRawNumber(payAmount)
    if (amountPaid <= 0) return alert('Nominal tidak valid')

    const totalLoan = Number(selectedLoan.total_amount)
    const alreadyPaid = (selectedLoan.repayments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount_paid), 0)
    const remainingBefore = totalLoan - alreadyPaid

    // Guard: cegah input cicilan melebihi sisa tagihan (data jadi negatif/aneh kalau lolos)
    if (amountPaid > remainingBefore) {
      return alert(`Nominal melebihi sisa tagihan (Rp ${remainingBefore.toLocaleString('id-ID')})`)
    }

    const principalRatio = Number(selectedLoan.principal_amount) / totalLoan

    // PENTING: bulatkan ke integer (Rupiah tidak punya desimal).
    // profitPaid dihitung dari SISA amountPaid (bukan amountPaid * marginRatio) supaya
    // principalPaid + profitPaid selalu PERSIS sama dengan amountPaid, tanpa drift pembulatan.
    const principalPaid = Math.round(amountPaid * principalRatio)
    const profitPaid = amountPaid - principalPaid

    const { error: repError } = await supabase
      .from('repayments')
      .insert([{
        loan_id: selectedLoan.id,
        amount_paid: amountPaid,
        principal_portion: principalPaid,
        profit_portion: profitPaid
      }])

    if (repError) {
      console.error('Insert repayment error:', repError)
      return alert(`Gagal mencatat cicilan: ${repError.message}`)
    }

    const currentTotalPaid = alreadyPaid + amountPaid
    const isPaidOff = currentTotalPaid >= totalLoan

    if (isPaidOff) {
      const { error: loanUpdateError } = await supabase.from('loans').update({ status: 'paid_off' }).eq('id', selectedLoan.id)
      if (loanUpdateError) console.error('Update loan status error:', loanUpdateError)

      if (selectedLoan.collaterals?.length > 0) {
        const { error: collateralError } = await supabase.from('collaterals').update({ status: 'returned' }).eq('loan_id', selectedLoan.id)
        if (collateralError) console.error('Update collateral error:', collateralError)
      }
    }

    const { error: capTxError } = await supabase.from('capital_transactions').insert([
      { type: 'repayment_principal', amount: principalPaid, description: `Pengembalian Modal (${selectedLoan.borrowers?.name})`, loan_id: selectedLoan.id },
      { type: 'repayment_profit', amount: profitPaid, description: `Profit Margin (${selectedLoan.borrowers?.name})`, loan_id: selectedLoan.id }
    ])
    if (capTxError) console.error('Insert capital_transactions error:', capTxError)

    setPayAmount('')
    setSelectedLoan(null)
    fetchData()
  }

  // 3. Handle Inject Capital / Withdraw Profit (create ATAU update kalau lagi mode edit)
  async function handleCapitalTx(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = parseRawNumber(capAmount)
    if (amountNum <= 0) return alert('Nominal tidak valid')

    const payload = {
      type: capType,
      amount: amountNum,
      description: capDesc || (capType === 'inject_capital' ? 'Suntik Modal Kerja' : 'Tarik Profit Bersih')
    }

    const { error } = editingCapTxId
      ? await supabase.from('capital_transactions').update(payload).eq('id', editingCapTxId)
      : await supabase.from('capital_transactions').insert([payload])

    if (error) {
      console.error('Capital tx error:', error)
      return alert(`Gagal menyimpan transaksi kas: ${error.message}`)
    }

    resetCapitalForm()
    fetchData()
  }

  function resetCapitalForm() {
    setCapAmount('')
    setCapDesc('')
    setCapType('inject_capital')
    setEditingCapTxId(null)
    setIsCapitalModalOpen(false)
  }

  function openNewCapitalTx() {
    setEditingCapTxId(null)
    setCapType('inject_capital')
    setCapAmount('')
    setCapDesc('')
    setIsCapitalModalOpen(true)
  }

  function openEditCapitalTx(tx: any) {
    setEditingCapTxId(tx.id)
    setCapType(tx.type)
    setCapAmount(String(tx.amount))
    setCapDesc(tx.description || '')
    setIsCapitalModalOpen(true)
  }

  // Hapus transaksi kas manual (inject_capital / withdraw_profit saja —
  // tipe otomatis dari sistem seperti loan_out/repayment_* tidak boleh dihapus manual dari sini,
  // karena itu harus lewat delete pinjaman / rekalkulasi cicilan supaya konsisten)
  async function handleDeleteCapitalTx(tx: any) {
    if (tx.type !== 'inject_capital' && tx.type !== 'withdraw_profit') {
      alert('Transaksi ini dibuat otomatis oleh sistem (dari pinjaman/cicilan), tidak bisa dihapus manual dari sini.')
      return
    }

    if (!confirm('Yakin mau hapus transaksi kas ini?')) return

    const { error } = await supabase.from('capital_transactions').delete().eq('id', tx.id)
    if (error) {
      console.error('Delete capital tx error:', error)
      return alert(`Gagal hapus transaksi: ${error.message}`)
    }

    fetchData()
  }

  // --- KALKULASI ARUS KAS ---
  const today = new Date().toISOString().split('T')[0]

  const totalInjected = capitalTxs.filter(t => t.type === 'inject_capital').reduce((acc, t) => acc + Number(t.amount), 0)
  
  const activeLoans = loans.filter(l => l.status !== 'paid_off')
  const totalPrincipalOut = activeLoans.reduce((acc, curr) => {
    const paid = (curr.repayments || []).reduce((pAcc: number, pCurr: any) => pAcc + Number(pCurr.amount_paid), 0)
    const paidRatio = Number(curr.principal_amount) / Number(curr.total_amount)
    const principalPaid = paid * paidRatio
    return acc + (Number(curr.principal_amount) - principalPaid)
  }, 0)

  const totalPrincipalReturned = capitalTxs.filter(t => t.type === 'repayment_principal').reduce((acc, t) => acc + Number(t.amount), 0)
  const totalProfitEarned = capitalTxs.filter(t => t.type === 'repayment_profit').reduce((acc, t) => acc + Number(t.amount), 0)
  const totalProfitWithdrawn = capitalTxs.filter(t => t.type === 'withdraw_profit').reduce((acc, t) => acc + Number(t.amount), 0)

  const liquidCapital = totalInjected - totalPrincipalOut + (totalPrincipalReturned - (capitalTxs.filter(t => t.type === 'loan_out').reduce((acc, t) => acc + Number(t.amount), 0) - totalPrincipalOut))
  const pureProfitBank = totalProfitEarned - totalProfitWithdrawn

  // Transaksi kas yang diinput manual (bisa diedit/dihapus) — beda sama loan_out/repayment_* yang otomatis dari sistem
  const manualCapTxs = capitalTxs.filter(t => t.type === 'inject_capital' || t.type === 'withdraw_profit')

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dompet Kredit</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button 
              onClick={openNewCapitalTx}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 sm:py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4 shrink-0" /> Kelola Kas Modal/Profit
            </button>
            <button 
              onClick={openNewLoan}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              <Plus className="w-4 h-4 shrink-0" /> Pinjaman Baru
            </button>
          </div>
        </div>

        {/* PEMISAH KAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Kas Modal Siap Pakai</span>
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Rp {Math.max(0, liquidCapital).toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400">Modal mengendap yang siap dipinjamkan</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Modal Dipinjamkan</span>
              <ArrowUpRight className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-amber-600">
              Rp {totalPrincipalOut.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400">Pokok uang modal yang lagi dibawa peminjam</p>
          </div>

          <div className="bg-emerald-900 text-white p-5 rounded-xl border border-emerald-800 shadow-md space-y-1">
            <div className="flex justify-between items-center text-emerald-300">
              <span className="text-xs font-semibold uppercase tracking-wider">Kantong Profit Murni</span>
              <PiggyBank className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-300">
              Rp {pureProfitBank.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-emerald-200/70">Keuntungan bersih (Bisa ditarik/dipakai bebas)</p>
          </div>
        </div>

        {/* TABEL UTAMA PINJAMAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Daftar Pinjaman & Agunan</h3>
            <span className="text-xs text-slate-400">Total: {loans.length} Transaksi</span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-slate-400">Memuat data...</div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Belum ada catatan pinjaman.</div>
          ) : (
            <>
              {/* Versi TABEL — layar >=640px (tablet/desktop) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Peminjam</th>
                      <th className="p-4">Pokok + Margin</th>
                      <th className="p-4">Agunan / Jaminan</th>
                      <th className="p-4">Sisa Tagihan</th>
                      <th className="p-4">Jatuh Tempo</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loans.map((item) => {
                      const totalPaid = (item.repayments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount_paid), 0)
                      const remaining = Number(item.total_amount) - totalPaid
                      const isOverdue = item.status !== 'paid_off' && item.due_date < today
                      const collateralItem = item.collaterals?.[0]

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{item.borrowers?.name}</div>
                            <div className="text-xs text-slate-400">{item.borrowers?.phone_number}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">Rp {Number(item.total_amount).toLocaleString('id-ID')}</div>
                            <div className="text-xs text-emerald-600">Margin: +Rp {Number(item.margin_amount).toLocaleString('id-ID')}</div>
                          </td>
                          <td className="p-4">
                            {collateralItem ? (
                              <div className="flex items-center gap-1.5">
                                <Box className="w-3.5 h-3.5 text-slate-400" />
                                <div>
                                  <div className="text-xs font-medium text-slate-700">{collateralItem.item_name}</div>
                                  <span className={`text-[10px] font-semibold ${collateralItem.status === 'returned' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {collateralItem.status === 'returned' ? 'Dikembalikan' : 'Disimpan'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            Rp {remaining > 0 ? remaining.toLocaleString('id-ID') : 0}
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {item.due_date}
                          </td>
                          <td className="p-4">
                            {item.status === 'paid_off' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                <CheckCircle className="w-3 h-3" /> Lunas
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                <ShieldAlert className="w-3 h-3" /> Overdue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                <Clock className="w-3 h-3" /> Aktif
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status !== 'paid_off' && (
                                <button
                                  onClick={() => setSelectedLoan(item)}
                                  className="inline-flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md font-medium transition"
                                >
                                  <HandCoins className="w-3.5 h-3.5" /> Cicil / Bayar
                                </button>
                              )}
                              <button
                                onClick={() => openEditLoan(item)}
                                title="Edit pinjaman"
                                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLoan(item)}
                                title="Hapus pinjaman"
                                className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Versi KARTU — layar <640px (iPhone 11 & HP lain), nggak perlu scroll horizontal */}
              <div className="sm:hidden divide-y divide-slate-100">
                {loans.map((item) => {
                  const totalPaid = (item.repayments || []).reduce((acc: number, curr: any) => acc + Number(curr.amount_paid), 0)
                  const remaining = Number(item.total_amount) - totalPaid
                  const isOverdue = item.status !== 'paid_off' && item.due_date < today
                  const collateralItem = item.collaterals?.[0]

                  return (
                    <div key={item.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-slate-900">{item.borrowers?.name}</div>
                          <div className="text-xs text-slate-400">{item.borrowers?.phone_number}</div>
                        </div>
                        {item.status === 'paid_off' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 shrink-0">
                            <CheckCircle className="w-3 h-3" /> Lunas
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 shrink-0">
                            <ShieldAlert className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 shrink-0">
                            <Clock className="w-3 h-3" /> Aktif
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div>
                          <div className="text-slate-400">Pokok + Margin</div>
                          <div className="font-medium text-slate-900">Rp {Number(item.total_amount).toLocaleString('id-ID')}</div>
                          <div className="text-emerald-600">+Rp {Number(item.margin_amount).toLocaleString('id-ID')}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Sisa Tagihan</div>
                          <div className="font-bold text-slate-900">Rp {remaining > 0 ? remaining.toLocaleString('id-ID') : 0}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Jatuh Tempo</div>
                          <div className="text-slate-600">{item.due_date}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Agunan</div>
                          {collateralItem ? (
                            <div className="flex items-center gap-1">
                              <Box className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-slate-700">{collateralItem.item_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        {item.status !== 'paid_off' && (
                          <button
                            onClick={() => setSelectedLoan(item)}
                            className="flex-1 inline-flex items-center justify-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-md font-medium transition"
                          >
                            <HandCoins className="w-3.5 h-3.5" /> Cicil / Bayar
                          </button>
                        )}
                        <button
                          onClick={() => openEditLoan(item)}
                          title="Edit pinjaman"
                          className="p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLoan(item)}
                          title="Hapus pinjaman"
                          className="p-2 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* RIWAYAT KAS MODAL/PROFIT (hanya transaksi manual: inject_capital & withdraw_profit) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Riwayat Kas Modal/Profit</h3>
            <span className="text-xs text-slate-400">Inject & Withdraw manual</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Memuat data...</div>
          ) : manualCapTxs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Belum ada transaksi kas manual.</div>
          ) : (
            <>
              {/* Versi TABEL — layar >=640px */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4">Tanggal</th>
                      <th className="p-4">Jenis</th>
                      <th className="p-4">Keterangan</th>
                      <th className="p-4">Nominal</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {manualCapTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 text-xs text-slate-500">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-semibold ${tx.type === 'inject_capital' ? 'text-blue-600' : 'text-rose-600'}`}>
                            {tx.type === 'inject_capital' ? 'Inject Modal' : 'Withdraw Profit'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">{tx.description}</td>
                        <td className="p-4 font-medium">Rp {Number(tx.amount).toLocaleString('id-ID')}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditCapitalTx(tx)}
                              title="Edit transaksi"
                              className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCapitalTx(tx)}
                              title="Hapus transaksi"
                              className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Versi KARTU — layar <640px (iPhone 11 & HP lain) */}
              <div className="sm:hidden divide-y divide-slate-100">
                {manualCapTxs.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={`text-xs font-semibold ${tx.type === 'inject_capital' ? 'text-blue-600' : 'text-rose-600'}`}>
                        {tx.type === 'inject_capital' ? 'Inject Modal' : 'Withdraw Profit'}
                      </span>
                      <div className="text-sm font-medium text-slate-900 mt-0.5">Rp {Number(tx.amount).toLocaleString('id-ID')}</div>
                      <div className="text-xs text-slate-500 truncate">{tx.description}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditCapitalTx(tx)}
                        title="Edit transaksi"
                        className="p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCapitalTx(tx)}
                        title="Hapus transaksi"
                        className="p-2 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* MODAL 1: PINJAMAN BARU */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingLoanId ? 'Edit Pinjaman' : 'Buat Pinjaman Baru'}
            </h3>
            <form onSubmit={editingLoanId ? handleUpdateLoan : handleSubmitLoan} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nama Peminjam *</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: Budi" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">No. WhatsApp *</label>
                <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="08123456789" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Nominal Pokok (Rp) *</label>
                  <input 
                    required 
                    type="text" 
                    disabled={editingLoanId !== null && hasRepaymentsForEdit}
                    value={formatRupiah(principal)} 
                    onChange={e => setPrincipal(e.target.value)} 
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" 
                    placeholder="1.000.000" 
                  />
                  {!(editingLoanId !== null && hasRepaymentsForEdit) && (
                    <QuickChips onSelect={amt => setPrincipal(amt.toString())} />
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Flat Margin (Rp) *</label>
                  <input 
                    required 
                    type="text" 
                    disabled={editingLoanId !== null && hasRepaymentsForEdit}
                    value={formatRupiah(margin)} 
                    onChange={e => setMargin(e.target.value)} 
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" 
                    placeholder="200.000" 
                  />
                </div>
              </div>
              {editingLoanId !== null && hasRepaymentsForEdit && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                  Pokok & margin dikunci karena pinjaman ini sudah punya riwayat cicilan — mengubahnya bisa bikin perhitungan profit yang sudah tercatat jadi salah.
                </p>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600">Tanggal Jatuh Tempo *</label>
                <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Jaminan / Agunan (Opsional)</label>
                <input type="text" value={collateral} onChange={e => setCollateral(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: STNK Vario 2020 / KTP Asli" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { resetLoanForm(); setIsLoanModalOpen(false) }} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  {editingLoanId ? 'Update Pinjaman' : 'Simpan Pinjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CICIL / BAYAR */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Catat Pembayaran</h3>
              <p className="text-xs text-slate-500 mt-0.5">Peminjam: <span className="font-semibold text-slate-700">{selectedLoan.borrowers?.name}</span></p>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nominal Pembayaran (Rp)</label>
                <input 
                  autoFocus 
                  required 
                  type="text" 
                  value={formatRupiah(payAmount)} 
                  onChange={e => setPayAmount(e.target.value)} 
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Masukkan nominal" 
                />
                <QuickChips onSelect={amt => setPayAmount(amt.toString())} />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedLoan(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Simpan Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INJECT CAPITAL / WITHDRAW PROFIT */}
      {isCapitalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">
              {editingCapTxId ? 'Edit Transaksi Kas' : 'Kelola Arus Kas'}
            </h3>
            <form onSubmit={handleCapitalTx} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Jenis Transaksi</label>
                <select 
                  value={capType} 
                  onChange={(e: any) => setCapType(e.target.value)}
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="inject_capital">➕ Inject Modal Kerja Baru</option>
                  <option value="withdraw_profit">💸 Tarik Profit Murni (Gajian)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Nominal (Rp) *</label>
                <input 
                  required 
                  type="text" 
                  value={formatRupiah(capAmount)} 
                  onChange={e => setCapAmount(e.target.value)} 
                  className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="500.000" 
                />
                <QuickChips onSelect={amt => setCapAmount(amt.toString())} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Keterangan / Catatan</label>
                <input type="text" value={capDesc} onChange={e => setCapDesc(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Misal: Suntikan modal tambahan" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetCapitalForm} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="flex-1 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800">
                  {editingCapTxId ? 'Update Transaksi' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}