'use client'

import { useEffect, useRef, useState } from 'react'
import { getSocket } from '@/lib/realtime-client'
import type { Socket } from 'socket.io-client'

/**
 * Subscribe to realtime socket events.
 * Returns the socket instance plus a connection flag.
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const s = getSocket()
    socketRef.current = s
    setIsConnected(s.connected)
    const onConn = () => setIsConnected(true)
    const onDisc = () => setIsConnected(false)
    s.on('connect', onConn)
    s.on('disconnect', onDisc)
    return () => {
      s.off('connect', onConn)
      s.off('disconnect', onDisc)
    }
  }, [])

  return { socket: socketRef.current, isConnected }
}

/**
 * Subscribe to a specific realtime event.
 */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const s = getSocket()
    const listener = (payload: T) => handlerRef.current(payload)
    s.on(event, listener)
    return () => {
      s.off(event, listener)
    }
  }, [event])
}
