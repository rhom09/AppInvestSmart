export const isMercadoAberto = () => {
    const agora = new Date()
    const dia = agora.getDay() // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hora = agora.getHours()
    const minuto = agora.getMinutes()

    // Segunda a Sexta (1 a 5)
    if (dia >= 1 && dia <= 5) {
        // 10h às 18h
        if (hora > 10 && hora < 18) return true
        if (hora === 10 && minuto >= 0) return true
        if (hora === 18 && minuto === 0) return true
    }

    return false
}
