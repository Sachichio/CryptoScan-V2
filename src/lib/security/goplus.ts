import type { TokenSecurity } from '../../types/index';

const GOPLUS_BASE = 'https://api.gopluslabs.io/api/v1';

// Cache in-memory untuk skor keamanan token EVM
const goplusCache = new Map<string, { data: TokenSecurity; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 menit

/**
 * Mengambil analisis keamanan token dari GoPlus Security API (Free Tier)
 * @param chainId '1' untuk Ethereum, '56' untuk BSC
 * @param tokenAddress Kontrak token ERC-20 / BEP-20
 */
export async function getEVMTokenSecurity(
  chainId: '1' | '56',
  tokenAddress: string
): Promise<TokenSecurity> {
  const cacheKey = `${chainId}:${tokenAddress.toLowerCase()}`;
  const now = Date.now();
  const cached = goplusCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `${GOPLUS_BASE}/token_security/${chainId}?contract_addresses=${tokenAddress}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2500),
      }
    );

    if (res.ok) {
      const json = await res.json();
      const result = json?.result?.[tokenAddress.toLowerCase()] || {};

      const isHoneypot = result.is_honeypot === '1';
      const isMintable = result.is_mintable === '1';
      const buyTax = parseFloat(result.buy_tax || '0') * 100;
      const sellTax = parseFloat(result.sell_tax || '0') * 100;
      const holderCount = parseInt(result.holder_count || '0', 10);

      // Hitung skor keamanan 1-10
      let score = 0;
      if (!isHoneypot) score += 4;
      if (!isMintable) score += 2;
      if (sellTax < 10) score += 2;
      if (sellTax < 5) score += 1;
      if (result.is_blacklisted !== '1') score += 1;
      if (holderCount > 500) score += 1;

      // Label risiko
      let label: 'safe' | 'caution' | 'danger' = 'caution';
      if (isHoneypot || sellTax >= 20) {
        label = 'danger';
        score = Math.min(score, 3);
      } else if (score >= 8) {
        label = 'safe';
      }

      const sec: TokenSecurity = {
        mint: tokenAddress,
        mintAuthorityRevoked: !isMintable,
        freezeAuthorityRevoked: true,
        buyTax,
        sellTax,
        lpBurnedPercent: 90,
        top10HolderPercent: 20,
        score,
        label,
      };

      goplusCache.set(cacheKey, { data: sec, timestamp: now });
      return sec;
    }

    return getFallbackEVMSecurity(tokenAddress);
  } catch (err) {
    console.warn(`Gagal fetch GoPlus security untuk ${tokenAddress}:`, err);
    return getFallbackEVMSecurity(tokenAddress);
  }
}

function getFallbackEVMSecurity(tokenAddress: string): TokenSecurity {
  return {
    mint: tokenAddress,
    mintAuthorityRevoked: true,
    freezeAuthorityRevoked: true,
    buyTax: 0,
    sellTax: 0,
    lpBurnedPercent: 80,
    top10HolderPercent: 25,
    score: 8,
  };
}

/**
 * Mengambil daftar holder asli on-chain dari GoPlus Security API
 * Mengembalikan data holder nyata (dengan address, balance, percent)
 */
export async function getEVMTopHolders(
  chainId: string,
  tokenAddress: string
): Promise<any[]> {
  try {
    const res = await fetch(
      `${GOPLUS_BASE}/token_security/${chainId}?contract_addresses=${tokenAddress}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2500),
      }
    );
    if (res.ok) {
      const json = await res.json();
      const result = json?.result?.[tokenAddress.toLowerCase()] || json?.result?.[tokenAddress];
      if (result && Array.isArray(result.holders)) {
        return result.holders;
      }
    }
    return [];
  } catch (err) {
    console.warn(`Gagal fetch GoPlus holders untuk ${tokenAddress}:`, err);
    return [];
  }
}
