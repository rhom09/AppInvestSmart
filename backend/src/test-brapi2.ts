import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') })

const BRAPI_BASE = 'https://brapi.dev/api'
const token = process.env.BRAPI_TOKEN

async function check(ticker: string, range: string) {
    try {
        const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
            params: { token, range, interval: '1d', history: true }
        })
        const hist = data.results?.[0]?.historicalDataPrice ?? []
        console.log(`${ticker} (${range}): ${hist.length} pontos`)
    } catch (e: any) {
        console.error(`${ticker} (${range}) Erro:`, e.message)
    }
}
async function run() {
    await check('MXRF11', '1mo')
    await check('MXRF11', '6mo')
    await check('HGLG11', '6mo')
}
run()
