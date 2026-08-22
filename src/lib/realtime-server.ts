import { io, Socket } from 'socket.io-client'

// Server-side socket client used by API routes to publish events
// to the realtime mini-service running on port 3003.
const REALTIME_URL = 'http://localhost:3003'

let socket: Socket | null = null

function getSocket(): Socket {
  if (socket) return socket
  socket = io(REALTIME_URL, {
    path: '/',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
    timeout: 4_000,
  })
  return socket
}

export interface RealtimeEnvelope<T = unknown> {
  type?: string
  restaurantId: string
  payload: T
}

/**
 * Publish an event to all realtime subscribers. Best-effort: failures
 * are logged but never bubble up to the caller (we never want a socket
 * glitch to break an order placement).
 */
export function publishRealtime<T = unknown>(
  event: string,
  envelope: RealtimeEnvelope<T>,
): void {
  try {
    const s = getSocket()
    if (s.connected) {
      s.emit(event, envelope)
      return
    }
    s.once('connect', () => s.emit(event, envelope))
  } catch (err) {
     
    console.warn('[realtime-publish] failed:', (err as Error)?.message)
  }
}
