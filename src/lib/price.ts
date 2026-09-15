/**
 * src/lib/price.ts
 * Mengambil harga kripto secara real-time dari API publik gratis (CoinGecko & Jupiter).
 * Mendukung Multi-Chain: SOL, ETH, BNB.
 */

// Cache sederhana untuk harga native coin
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION_MS = 60 * 1000; // 1 menit

/**
 * Mendapatkan harga 1 SOL dalam USD
 */
export async function getSolPriceUSD(): Promise<number> {
  return getNativeCoinPrice('solana', 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', 150.0);
}

/**
 * Mendapatkan harga 1 ETH dalam USD
 */
export async function getETHPriceUSD(): Promise<number> {
  return getNativeCoinPrice('ethereum', 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', 2600.0);
}

/**
 * Mendapatkan harga 1 BNB dalam USD
 */
export async function getBNBPriceUSD(): Promise<number> {
  return getNativeCoinPrice('binancecoin', 'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd', 550.0);
}

/**
 * Helper terpusat untuk mengambil harga koin native
 */
async function getNativeCoinPrice(coinId: string, fallbackUrl: string, defaultPrice: number): Promise<number> {
  const now = Date.now();
  const cached = priceCache.get(coinId);
  if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
    return cached.price;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const price = Number(data?.[coinId]?.usd);
      if (price > 0) {
        priceCache.set(coinId, { price, timestamp: now });
        return price;
      }
    }
  } catch (error) {
    console.warn(`CoinGecko fetch failed for ${coinId}:`, error);
  }

  // Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const resFallback = await fetch(fallbackUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resFallback.ok) {
      const data = await resFallback.json();
      const price =
        data?.data?.So11111111111111111111111111111111111111112?.price ||
        data?.[coinId]?.usd;
      if (price > 0) {
        priceCache.set(coinId, { price, timestamp: now });
        return price;
      }
    }
  } catch {
    // Abaikan error fallback
  }

  return defaultPrice;
}

/**
 * Mendapatkan harga beberapa token SPL sekaligus via Jupiter Price API v2 (Gratis)
 * Dilengkapi dengan AbortController timeout 3 detik agar tidak menghambat server
 */
export async function getTokenPricesUSD(mintAddresses: string[]): Promise<Record<string, number>> {
  if (!mintAddresses.length) return {};

  const prices: Record<string, number> = {};
  const chunk = mintAddresses.slice(0, 50).join(',');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://api.jup.ag/price/v2?ids=${chunk}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) return prices;
    const json = await res.json();
    const data = json?.data || {};

    for (const mint of mintAddresses) {
      if (data[mint]?.price) {
        prices[mint] = Number(data[mint].price);
      }
    }
  } catch (err) {
    console.warn('Jupiter price API v2 fetch error:', err);
  }

  return prices;
}
