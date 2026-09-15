import type { ChainConfig, ChainId } from '../../types/index';

/**
 * Helper untuk akses env vars dengan aman baik di Node (SSR) maupun Browser (Vite Client).
 * Mencegah crash "process is not defined" saat komponen React dimuat di client-side.
 */
function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return undefined;
}

/**
 * Konfigurasi untuk setiap blockchain yang didukung
 */
export const CHAINS_CONFIG: Record<ChainId, ChainConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana',
    shortName: 'SOL',
    nativeSymbol: 'SOL',
    color: 'emerald',
    logoChar: '◎',
    explorerUrl: 'https://solscan.io',
    rpcUrl: getEnv('HELIUS_RPC_URL') || 'https://mainnet.helius-rpc.com/?api-key=f7305b2a-724a-4eed-aac2-e724ef8eb721',
    dexscreenerChain: 'solana',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    shortName: 'ETH',
    nativeSymbol: 'ETH',
    color: 'cyan',
    logoChar: '⟠',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: getEnv('ETH_RPC_URL') || 'https://ethereum-rpc.publicnode.com',
    goplusChainId: '1',
    dexscreenerChain: 'ethereum',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    nativeSymbol: 'BNB',
    color: 'amber',
    logoChar: '⬡',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: getEnv('BSC_RPC_URL') || 'https://bsc-rpc.publicnode.com',
    goplusChainId: '56',
    dexscreenerChain: 'bsc',
  },
  base: {
    id: 'base',
    name: 'Base',
    shortName: 'BASE',
    nativeSymbol: 'ETH',
    color: 'indigo',
    logoChar: '🔷',
    explorerUrl: 'https://basescan.org',
    rpcUrl: getEnv('BASE_RPC_URL') || 'https://base-rpc.publicnode.com',
    goplusChainId: '8453',
    dexscreenerChain: 'base',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    shortName: 'ARB',
    nativeSymbol: 'ETH',
    color: 'blue',
    logoChar: '🔵',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: getEnv('ARB_RPC_URL') || 'https://arbitrum-one-rpc.publicnode.com',
    goplusChainId: '42161',
    dexscreenerChain: 'arbitrum',
  },
};

/**
 * Deteksi jaringan (ChainId) secara otomatis dari format alamat dompet:
 * - Dimulai dengan "0x" dan panjang 42 karakter -> EVM (Ethereum / BSC)
 * - Base58 panjang 32-44 karakter -> Solana
 */
export function detectChain(address: string): ChainId | 'unknown' {
  if (!address || typeof address !== 'string') return 'unknown';

  const clean = address.trim();

  // Pola alamat EVM (Ethereum / BSC)
  if (/^0x[a-fA-F0-9]{40}$/.test(clean)) {
    return 'ethereum'; // Default EVM ke Ethereum, pengguna dapat beralih ke BSC
  }

  // Pola alamat Solana (Base58 32 - 44 karakter, tidak diawali 0x)
  if (!clean.startsWith('0x') && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) {
    return 'solana';
  }

  return 'unknown';
}
