import type { APIRoute } from 'astro';
import type { MemeCoin, ChainId } from '../../../types/index';

/**
 * GET /api/radar/search?q={query}&chain={chainId}
 * Mencari koin spesifik secara live di DexScreener berdasarkan nama, simbol, atau alamat kontrak (CA)
 */
export const GET: APIRoute = async ({ url }) => {
  const query = (url.searchParams.get('q') || '').trim();
  const chainParam = (url.searchParams.get('chain') || 'solana').toLowerCase() as ChainId;
  const allowedChains: ChainId[] = ['solana', 'ethereum', 'bsc', 'base', 'arbitrum'];
  const chain: ChainId = allowedChains.includes(chainParam) ? chainParam : 'solana';

  if (!query || query.length < 2) {
    return new Response(
      JSON.stringify({ error: 'Parameter query pencarian minimal 2 karakter', coins: [], total: 0 }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const dexSearchRes = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!dexSearchRes.ok) {
      return new Response(
        JSON.stringify({ query, chain, coins: [], total: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const dexData = await dexSearchRes.json();
    const pairs = Array.isArray(dexData?.pairs) ? dexData.pairs : [];

    // Filter pair berdasarkan chain target yang sedang dipilih
    const filteredPairs = pairs.filter((p: any) => {
      if (!p?.baseToken?.address) return false;
      return p.chainId === chain;
    });

    // Deduplikasi berdasarkan alamat kontrak token (ambil pair dengan volume terbesar per token)
    const tokenMap = new Map<string, any>();
    for (const pair of filteredPairs) {
      const addr = pair.baseToken.address.toLowerCase();
      const existing = tokenMap.get(addr);
      const pairVol = Number(pair.volume?.h24 || 0);
      if (!existing || pairVol > Number(existing.volume?.h24 || 0)) {
        tokenMap.set(addr, pair);
      }
    }

    const bestPairs = Array.from(tokenMap.values())
      .sort((a, b) => Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0))
      .slice(0, 10);

    const coins: MemeCoin[] = bestPairs.map((pair): MemeCoin => {
      const mint = pair.baseToken.address;
      const liquidityUSD = Number(pair.liquidity?.usd || 0);
      const volume24hUSD = Number(pair.volume?.h24 || 0);

      // Hitung Confidence Score secara instan dan deterministik (0ms) berdasarkan data likuiditas & aktivitas nyata
      let confidenceScore = 5;
      let confidenceLabel: 'safe' | 'caution' | 'danger' = 'caution';

      if (liquidityUSD >= 50000 && volume24hUSD >= 50000) {
        confidenceScore = 9;
        confidenceLabel = 'safe';
      } else if (liquidityUSD >= 20000 || volume24hUSD >= 25000) {
        confidenceScore = 7;
        confidenceLabel = 'caution';
      } else if (liquidityUSD < 3000) {
        confidenceScore = 3;
        confidenceLabel = 'danger';
      } else {
        confidenceScore = 5;
        confidenceLabel = 'caution';
      }

      return {
        mint,
        chain,
        name: pair.baseToken?.name || mint.slice(0, 8),
        symbol: pair.baseToken?.symbol || 'UNKNOWN',
        logoURI: pair.info?.imageUrl || undefined,
        priceUSD: Number(pair.priceUsd || 0),
        priceChange24h: Number(pair.priceChange?.h24 || 0),
        volume24hUSD,
        liquidityUSD,
        marketCapUSD: Number(pair.fdv || pair.marketCap || 0),
        confidenceScore,
        confidenceLabel,
        pairAddress: pair.pairAddress,
      };
    });

    return new Response(
      JSON.stringify({
        query,
        chain,
        coins,
        total: coins.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error: any) {
    console.error(`Error pada /api/radar/search (${query} - ${chain}):`, error);
    return new Response(
      JSON.stringify({
        query,
        chain,
        coins: [],
        total: 0,
        error: error?.message || 'Gagal mencari koin di DexScreener',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
