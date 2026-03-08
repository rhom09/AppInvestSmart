import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') })

const BRAPI_BASE = 'https://brapi.dev/api'
const token = process.env.BRAPI_TOKEN

async function check() {
    try {
        console.log("Fetching PETR4 with 6mo and 1d...")
        const { data } = await axios.get(`${BRAPI_BASE}/quote/PETR4`, {
            params: { token, range: '6mo', interval: '1d', history: true }
        })
        const hist = data.results?.[0]?.historicalDataPrice ?? []
        console.log("Points returned:", hist.length)
        if (hist.length > 2) {
            console.log("First:", hist[0].date, hist[0].close)
            console.log("Second:", hist[1].date, hist[1].close)

            // Check delta in days
            const d1 = new Date(hist[0].date * 1000)
            const d2 = new Date(hist[1].date * 1000)
            const diffTime = Math.abs(d2.getTime() - d1.getTime())
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            console.log("Days between first two points:", diffDays)
        }
    } catch (e: any) {
        console.error("Error:", e.message)
    }
}
check()
