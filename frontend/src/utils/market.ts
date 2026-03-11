/**
 * Determine if B3 market is open (Mon–Fri, 10:00–18:00 Brasília time)
 */
export const isMercadoAberto = (): boolean => {
    const now = new Date()
    // BRT = UTC-3
    const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const day = brt.getDay()   // 0=Sun, 6=Sat
    const h = brt.getHours()
    const m = brt.getMinutes()
    const mins = h * 60 + m
    return day >= 1 && day <= 5 && mins >= 10 * 60 && mins < 18 * 60
}
