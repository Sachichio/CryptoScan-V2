import type { APIRoute } from 'astro';
import { getTrendingMints, getTokenSecurity, calculateConfidenceScore } from '../../../lib/rugcheck';
import { getDexTokenDetails } from '../../../lib/dexscreener';
import type { MemeCoin } from '../../../types/index';

/**
 * GET /api/radar/trending
 * Mengambil daftar meme coin trending di Solana dan menyertakan data market beserta Confidence Score (1-10)
 */
export const GET: APIRoute = async () => {
  try {
    // 1. Ambil daftar mint address trending
    const mints = await getTrendingMints();

    // 2. Ambil data DexScreener dan RugCheck secara paralel
    const coinPromises = mints.map(async (mint): Promise<MemeCoin | null> => {
      try {
        const [pair, security] = await Promise.all([
          getDexTokenDetails(mint),
          getTokenSecurity(mint),
        ]);

        const { score, label } = calculateConfidenceScore(security);

        // Ekstrak info dasar
        const name = pair?.baseToken?.name || `Token ${mint.slice(0, 4)}...${mint.slice(-4)}`;
        const symbol = pair?.baseToken?.symbol || mint.slice(0, 4).toUpperCase();
        const logoURI = pair?.info?.imageUrl || undefined;
        const priceUSD = Number(pair?.priceUsd || 0);
        const priceChange24h = Number(pair?.priceChange?.h24 || 0);
        const volume24hUSD = Number(pair?.volume?.h24 || 0);
        const liquidityUSD = Number(pair?.liquidity?.usd || 0);
        const marketCapUSD = Number(pair?.fdv || pair?.marketCap || 0);

        return {
          mint,
          name,
          symbol,
          logoURI,
          priceUSD,
          priceChange24h,
          volume24hUSD,
          liquidityUSD,
          marketCapUSD,
          confidenceScore: score,
          confidenceLabel: label,
          pairAddress: pair?.pairAddress,
        };
      } catch (err) {
        console.warn(`Gagal memproses koin ${mint}:`, err);
        return null;
      }
    });

    const results = await Promise.all(coinPromises);
    const coins = results.filter((c): c is MemeCoin => c !== null);

    return new Response(
      JSON.stringify({
        coins,
        total: coins.length,
        lastUpdated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=180', // Cache 3 menit di level browser/proxy
        },
      }
    );
  } catch (error: any) {
    console.error('Error pada /api/radar/trending:', error);
    return new Response(
      JSON.stringify({
        error: 'Gagal mengambil data Meme Radar trending',
        message: error?.message || 'Unknown server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
