import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectHub } from '../lib/signalr'

export function useRealtimeRefresh(keys: string[]) {
  const queryClient = useQueryClient()

  useEffect(() => {
    connectHub((event) => {
      const relevantEvents = ['TransactionCreated', 'TransactionUpdated', 'CollectionSessionStarted', 'CollectionSessionClosed', 'DashboardUpdated']
      if (relevantEvents.includes(event)) {
        keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      }
    })
  }, [queryClient])
}
