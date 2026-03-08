import { useRef, useCallback } from 'react'

interface UseLongPressOptions {
    threshold?: number
}

export function useLongPress(callback: () => void, { threshold = 400 }: UseLongPressOptions = {}) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const cancel = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const start = useCallback(() => {
        cancel()
        timerRef.current = setTimeout(() => {
            callback()
            timerRef.current = null
        }, threshold)
    }, [callback, threshold, cancel])

    return {
        onPointerDown: start,
        onPointerUp: cancel,
        onPointerLeave: cancel,
        onContextMenu: (e: React.MouseEvent) => {
            // Prevent context menu on mobile long press
            if ('ontouchstart' in window) e.preventDefault()
        },
    }
}
