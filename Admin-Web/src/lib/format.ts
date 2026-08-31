export const formatPeso = (value: number | string | undefined | null): string => {
  const n = Number(value ?? 0)
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const formatDate = (value: string | Date | undefined | null): string => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatDateTime = (value: string | Date | undefined | null): string => {
  if (!value) return '—'
  const d = new Date(value)
  return (
    d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  )
}

export const formatTime = (value: string | Date | undefined | null): string => {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}
