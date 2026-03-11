import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
    const token = process.env.BRAPI_TOKEN
    const ticker = 'PETR4'
    console.log(`🔍 Checking Brapi for ${ticker} with token ${token?.substring(0, 4)}...`)
    
    try {
        const response = await axios.get(`https://brapi.dev/api/quote/${ticker}`, {
            params: { token, fundamental: true }
        })
        console.log(`[BRAPI ${ticker}] SUCCESS!`)
        console.log(JSON.stringify(response.data?.results?.[0], null, 2))
    } catch (error: any) {
        console.error(`❌ [BRAPI ${ticker}] FAILED: ${error.message}`)
        if (error.response) {
            console.error('Response status:', error.response.status)
            console.error('Response data:', JSON.stringify(error.response.data, null, 2))
        }
    }
}

main().catch(console.error)
