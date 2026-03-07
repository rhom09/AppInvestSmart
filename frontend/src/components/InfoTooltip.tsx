interface InfoTooltipProps {
    text: string
}

export const InfoTooltip = ({ text }: InfoTooltipProps) => {
    return (
        <div className="info-tooltip-container">
            <div className="info-tooltip-icon">i</div>
            <div className="info-tooltip-box">
                {text}
            </div>
        </div>
    )
}
