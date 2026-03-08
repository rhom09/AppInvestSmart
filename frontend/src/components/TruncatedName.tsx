import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLongPress } from '@/hooks/useLongPress'

interface TooltipPos {
    top: number
    left: number
    width: number
}

interface TruncatedNameProps {
    name: string
    className?: string
}

export const TruncatedName = ({ name, className = '' }: TruncatedNameProps) => {
    const ref = useRef<HTMLParagraphElement>(null)
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState<TooltipPos | null>(null)
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const show = useCallback(() => {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        setPos({
            top: rect.top + window.scrollY - 8, // 8px above element
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 160),
        })
        setVisible(true)

        // Auto-dismiss after 2s
        if (dismissTimer.current) clearTimeout(dismissTimer.current)
        dismissTimer.current = setTimeout(() => setVisible(false), 2000)
    }, [])

    const hide = useCallback(() => {
        setVisible(false)
        if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }, [])

    // Dismiss on any touchstart outside
    useEffect(() => {
        if (!visible) return
        const handler = () => hide()
        document.addEventListener('touchstart', handler, { passive: true })
        return () => document.removeEventListener('touchstart', handler)
    }, [visible, hide])

    useEffect(() => () => {
        if (dismissTimer.current) clearTimeout(dismissTimer.current)
    }, [])

    const longPressHandlers = useLongPress(show, { threshold: 400 })

    const tooltip =
        visible && pos
            ? createPortal(
                <div
                    onTouchStart={e => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        minWidth: pos.width,
                        maxWidth: 280,
                        transform: 'translateY(-100%)',
                        background: '#1e2438',
                        color: '#e8eaf2',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 12,
                        lineHeight: 1.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        wordBreak: 'break-word',
                    }}
                >
                    {name}
                </div>,
                document.body
            )
            : null

    return (
        <>
            <p
                ref={ref}
                title={name}
                className={`truncate select-none ${className}`}
                {...longPressHandlers}
            >
                {name}
            </p>
            {tooltip}
        </>
    )
}
