import type { Token, ChainId } from '../../types/index';
import { getDexTokenDetails } from '../dexscreener';

export interface KnownTokenConfig {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  chain: ChainId;
}

/**
 * Membaca saldo token ERC-20 asli di on-chain menggunakan eth_call standar
 */
export async function getERC20Balance(
  rpcUrl: string,
  tokenAddress: string,
  walletAddress: string,
  decimals: number
): Promise<number> {
  try {
    const cleanAddr = walletAddress.toLowerCase().replace(/^0x/, '');
    const addrPadded = cleanAddr.padStart(64, '0');
    // Function selector untuk balanceOf(address) adalah 0x70a08231
    const data = `0x70a08231${addrPadded}`;

    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: tokenAddress, data }, 'latest'],
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) return 0;
    const json = await res.json();
    if (!json.result || json.result === '0x' || json.error) return 0;

    const rawBigInt = BigInt(json.result);
    if (rawBigInt === 0n) return 0;

    return Number(rawBigInt) / (10 ** decimals);
  } catch {
    return 0;
  }
}

/**
 * Memeriksa daftar token untuk wallet tertentu dan HANYA mengembalikan token yang saldonya > 0 di blockchain.
 * Tidak ada data palsu atau dummy!
 */
export async function scanRealEVMTokens(
  rpcUrl: string,
  walletAddress: string,
  tokenConfigs: KnownTokenConfig[]
): Promise<Token[]> {
  const tokenPromises = tokenConfigs.map(async (cfg): Promise<Token | null> => {
    try {
      const balance = await getERC20Balance(rpcUrl, cfg.mint, walletAddress, cfg.decimals);
      if (balance <= 0) return null;

      // Ambil harga real-time dari DexScreener
      let priceUSD = 0;
      try {
        const pair = await getDexTokenDetails(cfg.mint);
        priceUSD = Number(pair?.priceUsd || 0);
      } catch {}

      // Fallback harga untuk stablecoin jika dex pricing null
      if (priceUSD === 0) {
        if (cfg.symbol === 'USDT' || cfg.symbol === 'USDC' || cfg.symbol === 'BUSD') {
          priceUSD = 1.0;
        }
      }

      const valueUSD = balance * priceUSD;

      return {
        mint: cfg.mint,
        name: cfg.name,
        symbol: cfg.symbol,
        balance,
        decimals: cfg.decimals,
        priceUSD,
        valueUSD,
        chain: cfg.chain,
      };
    } catch {
      return null;
    }
  });

  const results = await Promise.all(tokenPromises);
  return results.filter((t): t is Token => t !== null);
}
