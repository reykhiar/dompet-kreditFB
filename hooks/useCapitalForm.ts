import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { parseRawNumber } from '@/lib/format'
import { CAP_TX_DEFAULT_DESC, MANUAL_CAP_TYPES } from '@/lib/constants'
import type { CapitalTx, CapitalTxType } from '@/lib/types'

// Form transaksi kas manual (inject / withdraw / profit_in) — create ATAU update kalau mode edit
export function useCapitalForm(refetch: () => void | Promise<void>) {
  const [isOpen, setIsOpen] = useState(false)
  const [capType, setCapType] = useState<CapitalTxType>('inject_capital')
  const [capAmount, setCapAmount] = useState('')
  const [capDesc, setCapDesc] = useState('')
  const [editingCapTxId, setEditingCapTxId] = useState<string | null>(null)

  function close() {
    setCapAmount('')
    setCapDesc('')
    setCapType('inject_capital')
    setEditingCapTxId(null)
    setIsOpen(false)
  }

  function openNew() {
    setEditingCapTxId(null)
    setCapType('inject_capital')
    setCapAmount('')
    setCapDesc('')
    setIsOpen(true)
  }

  function openEdit(tx: CapitalTx) {
    setEditingCapTxId(tx.id)
    setCapType(tx.type as CapitalTxType)
    setCapAmount(String(tx.amount))
    setCapDesc(tx.description || '')
    setIsOpen(true)
  }

  // 3. Handle Inject Capital / Withdraw Profit
  async function submit(e: FormEvent) {
    e.preventDefault()
    const amountNum = parseRawNumber(capAmount)
    if (amountNum <= 0) return alert('Nominal tidak valid')

    const payload = {
      type: capType,
      amount: amountNum,
      description: capDesc || CAP_TX_DEFAULT_DESC[capType]
    }

    const { error } = editingCapTxId
      ? await supabase.from('capital_transactions').update(payload).eq('id', editingCapTxId)
      : await supabase.from('capital_transactions').insert([payload])

    if (error) {
      console.error('Capital tx error:', error)
      return alert(`Gagal menyimpan transaksi kas: ${error.message}`)
    }

    close()
    refetch()
  }

  // Hapus transaksi kas manual (inject_capital / withdraw_profit / profit_in saja —
  // tipe otomatis dari sistem seperti loan_out/repayment_* tidak boleh dihapus manual dari sini,
  // karena itu harus lewat delete pinjaman / rekalkulasi cicilan supaya konsisten)
  async function remove(tx: CapitalTx) {
    if (!MANUAL_CAP_TYPES.includes(tx.type)) {
      alert('Transaksi ini dibuat otomatis oleh sistem (dari pinjaman/cicilan), tidak bisa dihapus manual dari sini.')
      return
    }

    if (!confirm('Yakin mau hapus transaksi kas ini?')) return

    const { error } = await supabase.from('capital_transactions').delete().eq('id', tx.id)
    if (error) {
      console.error('Delete capital tx error:', error)
      return alert(`Gagal hapus transaksi: ${error.message}`)
    }

    refetch()
  }

  return {
    isOpen, editingCapTxId,
    capType, setCapType, capAmount, setCapAmount, capDesc, setCapDesc,
    openNew, openEdit, close, submit, remove,
  }
}

export type CapitalForm = ReturnType<typeof useCapitalForm>
