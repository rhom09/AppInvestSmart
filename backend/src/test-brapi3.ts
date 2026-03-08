import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') })

const BRAPI_BASE = 'https://brapi.dev/api'
const token = process.env.BRAPI_TOKEN

async function check(ticker: string, range: string, interval: string) {
    try {
        const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
            params: { token, range, interval, history: true }
        })
        const hist = data.results?.[0]?.historicalDataPrice ?? []
        console.log(`${ticker} (${range}, ${interval}): ${hist.length} pontos`)
    } catch (e: any) {
        console.log(`${ticker} (${range}, ${interval}) Erro:`, e.response?.data?.message || e.message)
    }
}
async function run() {
    await check('MXRF11', '6mo', '1d')
    await check('MXRF11', '6mo', '5d')
    await check('MXRF11', '6mo', '1wk')
}
run()
