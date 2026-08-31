export function toast(message: string, type: 'success' | 'error' = 'success') {
  const el = document.createElement('div')
  el.className =
    'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ' +
    (type === 'success' ? 'bg-emerald-600' : 'bg-red-600')
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

export function confirmAction(message: string): boolean {
  return window.confirm(message)
}
