import * as signalR from '@microsoft/signalr'
import { getAccessToken } from './api'

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || '/hubs/ctoms'

let connection: signalR.HubConnection | null = null

export function connectHub(onEvent: (event: string, data: unknown) => void): signalR.HubConnection {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => getAccessToken() || ''
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  const events = [
    'TransactionCreated',
    'TransactionUpdated',
    'CollectionSessionStarted',
    'CollectionSessionClosed',
    'UsherOnline',
    'UsherOffline',
    'DashboardUpdated'
  ]

  events.forEach((evt) => {
    connection!.on(evt, (data: unknown) => onEvent(evt, data))
  })

  connection.start().catch((err) => console.error('SignalR connection failed:', err))
  return connection
}

export function disconnectHub() {
  if (connection) {
    connection.stop()
    connection = null
  }
}
