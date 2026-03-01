interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    fullScreen?: boolean
}

export const LoadingSpinner = ({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) => {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12', xl: 'w-16 h-16' }
    const borderSizes = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]', xl: 'border-4' }

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div className={`${sizes[size]} ${borderSizes[size]} border-surface-muted border-t-primary rounded-full animate-spin`} />
            {text && <p className="text-text-secondary text-sm animate-pulse">{text}</p>}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-bg-primary/90 backdrop-blur-sm z-50 flex items-center justify-center">
                {spinner}
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center p-8">
            {spinner}
        </div>
    )
}
