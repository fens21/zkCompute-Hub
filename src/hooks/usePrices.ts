import { useState, useEffect } from 'react'

const PRICE_CACHE_KEY = 'zkcompute_ltc_price'

export function usePrices() {
  const [ltcPrice, setLtcPrice] = useState<number | null>(() => {
    // Load dari cache dulu supaya tidak null di awal
    try {
      const cached = localStorage.getItem(PRICE_CACHE_KEY)
      if (cached) return parseFloat(cached)
    } catch {}
    return null
  })

  useEffect(() => {
    let cancelled = false

    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd')
        const data = await res.json() as { litecoin?: { usd?: number } }
        if (!cancelled && data.litecoin?.usd) {
          setLtcPrice(data.litecoin.usd)
          localStorage.setItem(PRICE_CACHE_KEY, String(data.litecoin.usd))
        }
      } catch (e) {
        console.error('Failed to fetch LTC price:', e)
      }
    }

    fetchPrice()
    // Update setiap 5 menit
    const interval = setInterval(fetchPrice, 5 * 60 * 1000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return { ltcPrice }
}
