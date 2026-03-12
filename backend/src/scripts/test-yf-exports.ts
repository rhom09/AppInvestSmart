import * as yf from 'yahoo-finance2'
console.log('Keys:', Object.keys(yf))
console.log('Default type:', typeof (yf as any).default)
try {
  const Yahoo = (yf as any).default
  const instance = new Yahoo()
  console.log('Instance created successfully')
} catch (e) {
  console.log('Failed to create instance from default:', e)
}
