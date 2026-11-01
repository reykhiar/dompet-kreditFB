// --- HELPER FORMAT RUPIAH ---
export const formatRupiah = (val: string | number) => {
  if (!val) return ''
  const raw = val.toString().replace(/\D/g, '')
  return new Intl.NumberFormat('id-ID').format(Number(raw))
}

export const parseRawNumber = (val: string) => {
  return Number(val.replace(/\D/g, '')) || 0
}
