import { createPublicClient, http, formatEther, isAddress } from 'viem';
import { base } from 'viem/chains';
import type { WalletInfo, Transaction, Token, WalletTokens } from '../../types/index';
import { getETHPriceUSD } from '../price';
import { CHAINS_CONFIG } from './index';

// Client RPC Base publik
const client = createPublicClient({
  chain: base,
  transport: http(CHAINS_CONFIG.base.rpcUrl),
});

export function isValidBaseAddress(address: string): boolean {
  return isAddress(address);
}

export async function getBaseWalletInfo(address: string): Promise<WalletInfo> {
  if (!isValidBaseAddress(address)) {
    throw new Error('Alamat wallet Base tidak valid');
  }

  const [balanceWei, ethPriceUSD, txCount] = await Promise.all([
    client.getBalance({ address: address as `0x${string}` }),
    getETHPriceUSD(),
    client.getTransactionCount({ address: address as `0x${string}` }).catch(() => 0),
  ]);

  const ethBalance = parseFloat(formatEther(balanceWei));
  const ethBalanceUSD = ethBalance * ethPriceUSD;

  // Transaksi on-chain detail membutuhkan indexer, kita berikan array kosong jujur agar diarahkan ke Basescan
  const recentTransactions: Transaction[] = [];

  return {
    address,
    chain: 'base',
    nativeSymbol: 'ETH',
    solBalance: ethBalance,
    solBalanceUSD: ethBalanceUSD,
    solPriceUSD: ethPriceUSD,
    transactionCount: txCount,
    recentTransactions,
  };
}

import { scanRealEVMTokens, type KnownTokenConfig } from './evm-tokens';

const BASE_KNOWN_TOKENS: KnownTokenConfig[] = [
  { mint: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', name: 'USD Coin', symbol: 'USDC', decimals: 6, chain: 'base' },
  { mint: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', name: 'Degen', symbol: 'DEGEN', decimals: 18, chain: 'base' },
  { mint: '0x532f27101965dd16442e59d40670faf5ebb142e4', name: 'Brett', symbol: 'BRETT', decimals: 18, chain: 'base' },
  { mint: '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4', name: 'Toshi', symbol: 'TOSHI', decimals: 18, chain: 'base' },
  { mint: '0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b', name: 'Virtual Protocol', symbol: 'VIRTUAL', decimals: 18, chain: 'base' },
  { mint: '0x4200000000000000000000000000000000000006', name: 'Wrapped Ether', symbol: 'WETH', decimals: 18, chain: 'base' },
];

export async function getBaseWalletTokens(address: string): Promise<WalletTokens> {
  if (!isValidBaseAddress(address)) {
    throw new Error('Alamat wallet Base tidak valid');
  }

  // Pindai saldo on-chain nyata. Hanya token dengan saldo > 0 yang akan dikembalikan.
  const tokens = await scanRealEVMTokens(CHAINS_CONFIG.base.rpcUrl, address, BASE_KNOWN_TOKENS);
  const totalValueUSD = tokens.reduce((acc, t) => acc + t.valueUSD, 0);

  return {
    address,
    chain: 'base',
    tokens,
    totalValueUSD,
  };
}

