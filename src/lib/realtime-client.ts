import { io as serverIo, Socket } from 'socket.io-client'

// Singleton realtime client used across admin / kitchen / waiter / customer views.
// The gateway expects path="/" + port specified as ?XTransformPort=3003.
const REALTIME_URL = typeof window !== 'undefined' ? '/?XTransformPort=3003' : ''

let socket: Socket | null = null
let socketError: string | null = null

export function getSocket(): Socket {
  // Return existing socket if available
  if (socket) return socket
  
  // Don't try to connect on server side
  if (typeof window === 'undefined') {
    throw new Error('Socket.io is not available on server side')
  }
  
  try {
    socket = serverIo(REALTIME_URL, {
      path: '/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3, // Reduced from Infinity to fail faster
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 5_000, // Reduced timeout
      autoConnect: true,
    })
    
    socket.on('connect_error', (err) => {
      // Non-fatal — realtime is best-effort
      socketError = err?.message || 'Socket connection failed'
      console.warn('[realtime] connect_error:', socketError)
    })
    
    socket.on('connect', () => {
      socketError = null // Clear error on successful connection
    })
    
    return socket
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create socket'
    console.error('[realtime] Failed to initialize socket:', errorMsg)
    throw new Error(errorMsg)
  }
}

export function emitRealtime(event: string, payload: unknown): void {
  try {
    const s = getSocket()
    if (s.connected) {
      s.emit(event, payload)
    } else {
      s.once('connect', () => s.emit(event, payload))
    }
  } catch {
    // ignore - realtime is best-effort
  }
}

export function getSocketError(): string | null {
  return socketError
}
