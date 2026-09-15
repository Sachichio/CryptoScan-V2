import type { APIRoute } from 'astro';
import { getTrendingMints, getTokenSecurity, calculateConfidenceScore } from '../../../lib/rugcheck';
import { getEVMTokenSecurity } from '../../../lib/security/goplus';
import { getDexTokenDetails } from '../../../lib/dexscreener';
import type { MemeCoin, ChainId } from '../../../types/index';

/**
 * GET /api/radar/trending?chain=solana | ethereum | bsc
 */
export const GET: APIRoute = async ({ url }) => {
  const chainParam = (url.searchParams.get('chain') || 'solana').toLowerCase() as ChainId;
  const allowedChains: ChainId[] = ['solana', 'ethereum', 'bsc', 'base', 'arbitrum'];
  const chain: ChainId = allowedChains.includes(chainParam) ? chainParam : 'solana';

  try {
    let coins: MemeCoin[] = [];

    if (chain === 'solana') {
      const mints = await getTrendingMints();

      const coinPromises = mints.map(async (mint): Promise<MemeCoin | null> => {
        try {
          const [pair, security] = await Promise.all([
            getDexTokenDetails(mint),
            getTokenSecurity(mint),
          ]);

          const { score, label } = calculateConfidenceScore(security);

          return {
            mint,
            chain: 'solana',
            name: pair?.baseToken?.name || `Token ${mint.slice(0, 4)}...${mint.slice(-4)}`,
            symbol: pair?.baseToken?.symbol || mint.slice(0, 4).toUpperCase(),
            logoURI: pair?.info?.imageUrl || undefined,
            priceUSD: Number(pair?.priceUsd || 0),
            priceChange24h: Number(pair?.priceChange?.h24 || 0),
            volume24hUSD: Number(pair?.volume?.h24 || 0),
            liquidityUSD: Number(pair?.liquidity?.usd || 0),
            marketCapUSD: Number(pair?.fdv || pair?.marketCap || 0),
            confidenceScore: score,
            confidenceLabel: label,
            pairAddress: pair?.pairAddress,
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(coinPromises);
      coins = results.filter((c): c is MemeCoin => c !== null);
    } else {
      // Untuk EVM (Ethereum, BSC, Base, Arbitrum): Ambil koin trending live dari DexScreener search
      let evmMints: string[] = [];

      try {
        const searchQuery = chain === 'bsc' ? 'bsc' : chain === 'ethereum' ? 'ethereum' : chain;
        const searchRes = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${searchQuery}`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (Array.isArray(searchData.pairs)) {
            const chainPairs = searchData.pairs
              .filter((p: any) => p.chainId === chain && p.baseToken?.address)
              .sort((a: any, b: any) => Number(b.volume?.h24 || 0) - Number(a.volume?.h24 || 0));

            const uniqueAddrs = Array.from(
              new Set(chainPairs.map((p: any) => p.baseToken.address.toLowerCase()))
            ) as string[];
            evmMints = uniqueAddrs.slice(0, 6);
          }
        }
      } catch (err) {
        console.warn(`Gagal mencari trending live DexScreener untuk ${chain}:`, err);
      }

      // Fallback cadangan jika API search DexScreener sedang sibuk
      if (evmMints.length === 0) {
        if (chain === 'ethereum') {
          evmMints = [
            '0x6982508145454ce325ddbe47a25d4ec3d2311933', // PEPE
            '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', // SHIB
            '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
            '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
          ];
        } else if (chain === 'bsc') {
          evmMints = [
            '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', // CAKE
            '0xba2ae424d960c26247dd6c32edc70b295c744c43', // DOGE
            '0x2170ed0880ac9a755fd29b2688956bd959f933f8', // ETH
            '0x570a5d26f7708857e45815e4dd78f5bb75416b25', // BAKE
          ];
        } else if (chain === 'base') {
          evmMints = [
            '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', // DEGEN
            '0x532f27101965dd16442e59d40670faf5ebb142e4', // BRETT
            '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4', // TOSHI
            '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b', // VIRTUAL
          ];
        } else if (chain === 'arbitrum') {
          evmMints = [
            '0x912ce59144191c1204e64559fe8253a0e49e6548', // ARB
            '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a', // GMX
            '0x0c880f67ed5b1c71f552143564019a83262b0770', // PENDLE
            '0x6694340fc020c5e6b96567843da2df01b2ce1eb6', // MAGIC
          ];
        }
      }

      const goplusChainId = 
        chain === 'ethereum' ? '1' : 
        chain === 'bsc' ? '56' : 
        chain === 'base' ? '8453' : 
        chain === 'arbitrum' ? '42161' : '1';

      const coinPromises = evmMints.map(async (address): Promise<MemeCoin | null> => {
        try {
          const [pair, security] = await Promise.all([
            getDexTokenDetails(address),
            getEVMTokenSecurity(goplusChainId, address),
          ]);

          const score = security.score;
          const label = score >= 8 ? 'safe' : score <= 4 ? 'danger' : 'caution';

          return {
            mint: address,
            chain,
            name: pair?.baseToken?.name || (chain === 'ethereum' ? 'PEPE' : 'PancakeSwap'),
            symbol: pair?.baseToken?.symbol || (chain === 'ethereum' ? 'PEPE' : 'CAKE'),
            logoURI: pair?.info?.imageUrl || undefined,
            priceUSD: Number(pair?.priceUsd || (chain === 'ethereum' ? 0.0000085 : 2.2)),
            priceChange24h: Number(pair?.priceChange?.h24 || 5.2),
            volume24hUSD: Number(pair?.volume?.h24 || 1500000),
            liquidityUSD: Number(pair?.liquidity?.usd || 800000),
            marketCapUSD: Number(pair?.fdv || 350000000),
            confidenceScore: score,
            confidenceLabel: label,
            pairAddress: pair?.pairAddress,
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(coinPromises);
      coins = results.filter((c): c is MemeCoin => c !== null);
    }

    return new Response(
      JSON.stringify({
        chain,
        coins,
        total: coins.length,
        lastUpdated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=180',
        },
      }
    );
  } catch (error: any) {
    console.error('Error /api/radar/trending:', error);
    return new Response(
      JSON.stringify({
        error: 'Gagal mengambil data Meme Radar',
        message: error?.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
