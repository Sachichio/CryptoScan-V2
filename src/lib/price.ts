/**
 * src/lib/price.ts
 * Mengambil harga kripto secara real-time dari API publik gratis (CoinGecko & Jupiter).
 * Tidak memerlukan API key berbayar.
 */

// Cache sederhana di memory agar tidak spam request ke public API
let cachedSolPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 1000; // Cache selama 1 menit

/**
 * Mendapatkan harga 1 SOL dalam USD dari CoinGecko (Free API)
 */
export async function getSolPriceUSD(): Promise<number> {
  const now = Date.now();
  if (cachedSolPrice && now - cachedSolPrice.timestamp < CACHE_DURATION_MS) {
    return cachedSolPrice.price;
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) {
      // Jika CoinGecko kena rate limit, fallback ke Jupiter price API untuk SOL
      return await getSolPriceFromJupiter();
    }
    const data = await res.json();
    const price = Number(data?.solana?.usd) || 150; // Fallback wajar jika parsing kosong
    cachedSolPrice = { price, timestamp: now };
    return price;
  } catch (error) {
    console.warn('CoinGecko fetch failed, trying Jupiter fallback:', error);
    return await getSolPriceFromJupiter();
  }
}

/**
 * Fallback harga SOL via Jupiter Price API (WSOL mint)
 */
async function getSolPriceFromJupiter(): Promise<number> {
  try {
    // So11111111111111111111111111111111111111112 adalah alamat Wrapped SOL
    const res = await fetch(
      'https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112'
    );
    if (!res.ok) return 150.0;
    const data = await res.json();
    const price = data?.data?.So11111111111111111111111111111111111111112?.price;
    return typeof price === 'number' ? price : 150.0;
  } catch {
    return 150.0; // Angka estimasi jika internet offline
  }
}

/**
 * Mendapatkan harga beberapa token SPL sekaligus via Jupiter Price API (Gratis)
 * @param mintAddresses Array daftar contract address / mint token
 */
export async function getTokenPricesUSD(mintAddresses: string[]): Promise<Record<string, number>> {
  if (!mintAddresses.length) return {};

  const prices: Record<string, number> = {};
  // Jupiter mendukung query multi IDs dipisah koma (maks ~50 token per request)
  const chunk = mintAddresses.slice(0, 50).join(',');

  try {
    const res = await fetch(`https://price.jup.ag/v6/price?ids=${chunk}`);
    if (!res.ok) return prices;
    const json = await res.json();
    const data = json?.data || {};

    for (const mint of mintAddresses) {
      if (data[mint]?.price) {
        prices[mint] = Number(data[mint].price);
      }
    }
  } catch (err) {
    console.warn('Jupiter price API fetch error:', err);
  }

  return prices;
}
