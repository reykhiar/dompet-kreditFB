import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { parseRawNumber } from '@/lib/format'
import type { Loan } from '@/lib/types'

// Form + aksi pinjaman: tambah, edit, hapus
export function useLoanForm(loans: Loan[], refetch: () => void | Promise<void>) {
  const [isOpen, setIsOpen] = useState(false)

  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [principal, setPrincipal] = useState('')
  const [margin, setMargin] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [collateral, setCollateral] = useState('')
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null)
  // true kalau pinjaman yang sedang diedit sudah punya riwayat cicilan
  // -> pokok/margin dikunci supaya tidak merusak principal_portion/profit_portion yang sudah tercatat
  const [hasRepaymentsForEdit, setHasRepaymentsForEdit] = useState(false)

  const principalLocked = editingLoanId !== null && hasRepaymentsForEdit

  function reset() {
    setName(''); setNotes(''); setPrincipal(''); setMargin(''); setDueDate(''); setCollateral('')
    setEditingLoanId(null)
    setHasRepaymentsForEdit(false)
  }

  function close() {
    reset()
    setIsOpen(false)
  }

  function openNew() {
    reset()
    setIsOpen(true)
  }

  function openEdit(loan: Loan) {
    setEditingLoanId(loan.id)
    setName(loan.borrowers?.name || '')
    setNotes(loan.borrowers?.notes || '')
    setPrincipal(String(loan.principal_amount))
    setMargin(String(loan.margin_amount))
    setDueDate(loan.due_date || '')
    setCollateral(loan.collaterals?.[0]?.item_name || '')
    setHasRepaymentsForEdit((loan.repayments || []).length > 0)
    setIsOpen(true)
  }

  // 1. Tambah Pinjaman Baru
  async function create(e: FormEvent) {
    e.preventDefault()

    const { data: borrower, error: bError } = await supabase
      .from('borrowers')
      .insert([{ name, notes: notes.trim() || null }])
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
      // Jangan tinggalkan peminjam yatim kalau pinjamannya gagal dibuat
      await supabase.from('borrowers').delete().eq('id', borrower.id)
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

    close()
    refetch()
  }

  // 1b. Update Pinjaman (edit)
  async function update(e: FormEvent) {
    e.preventDefault()
    if (!editingLoanId) return

    const target = loans.find(l => l.id === editingLoanId)
    if (!target) return

    if (target.borrower_id) {
      const { error: bError } = await supabase
        .from('borrowers')
        .update({ name, notes: notes.trim() || null })
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

    close()
    refetch()
  }

  // Submit form: create atau update tergantung mode
  const submit = (e: FormEvent) => (editingLoanId ? update(e) : create(e))

  // 1c. Hapus Pinjaman
  async function remove(loan: Loan) {
    if ((loan.repayments || []).length > 0) {
      alert('Pinjaman ini sudah punya riwayat cicilan, jadi tidak bisa dihapus langsung — nanti data Kas Modal/Profit jadi tidak konsisten. Edit data pendukungnya saja (nama/catatan/jatuh tempo/agunan), atau hubungi admin database kalau memang harus dihapus total.')
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

    // Hapus juga data peminjamnya kalau dia sudah tidak punya pinjaman lain
    if (loan.borrower_id) {
      const { count, error: countError } = await supabase
        .from('loans')
        .select('id', { count: 'exact', head: true })
        .eq('borrower_id', loan.borrower_id)

      if (countError) {
        console.error('Count borrower loans error:', countError)
      } else if (count === 0) {
        const { error: borrowerError } = await supabase.from('borrowers').delete().eq('id', loan.borrower_id)
        if (borrowerError) console.error('Delete borrower error:', borrowerError)
      }
    }

    refetch()
  }

  return {
    isOpen, editingLoanId, principalLocked,
    name, setName, notes, setNotes,
    principal, setPrincipal, margin, setMargin,
    dueDate, setDueDate, collateral, setCollateral,
    openNew, openEdit, close, submit, remove,
  }
}

export type LoanForm = ReturnType<typeof useLoanForm>
