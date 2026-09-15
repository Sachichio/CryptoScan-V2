import { createPublicClient, http, formatEther, isAddress } from 'viem';
import { arbitrum } from 'viem/chains';
import type { WalletInfo, Transaction, Token, WalletTokens } from '../../types/index';
import { getETHPriceUSD } from '../price';
import { CHAINS_CONFIG } from './index';

// Client RPC Arbitrum One publik
const client = createPublicClient({
  chain: arbitrum,
  transport: http(CHAINS_CONFIG.arbitrum.rpcUrl),
});

export function isValidArbitrumAddress(address: string): boolean {
  return isAddress(address);
}

export async function getArbitrumWalletInfo(address: string): Promise<WalletInfo> {
  if (!isValidArbitrumAddress(address)) {
    throw new Error('Alamat wallet Arbitrum tidak valid');
  }

  const [balanceWei, ethPriceUSD, txCount] = await Promise.all([
    client.getBalance({ address: address as `0x${string}` }),
    getETHPriceUSD(),
    client.getTransactionCount({ address: address as `0x${string}` }).catch(() => 0),
  ]);

  const ethBalance = parseFloat(formatEther(balanceWei));
  const ethBalanceUSD = ethBalance * ethPriceUSD;

  // Transaksi on-chain detail membutuhkan indexer, kita berikan array kosong jujur agar diarahkan ke Arbiscan
  const recentTransactions: Transaction[] = [];

  return {
    address,
    chain: 'arbitrum',
    nativeSymbol: 'ETH',
    solBalance: ethBalance,
    solBalanceUSD: ethBalanceUSD,
    solPriceUSD: ethPriceUSD,
    transactionCount: txCount,
    recentTransactions,
  };
}

import { scanRealEVMTokens, type KnownTokenConfig } from './evm-tokens';

const ARB_KNOWN_TOKENS: KnownTokenConfig[] = [
  { mint: '0x912ce59144191c1204e64559fe8253a0e49e6548', name: 'Arbitrum', symbol: 'ARB', decimals: 18, chain: 'arbitrum' },
  { mint: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', name: 'USD Coin', symbol: 'USDC', decimals: 6, chain: 'arbitrum' },
  { mint: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', name: 'Tether USD', symbol: 'USDT', decimals: 6, chain: 'arbitrum' },
  { mint: '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a', name: 'GMX', symbol: 'GMX', decimals: 18, chain: 'arbitrum' },
  { mint: '0x0c880f67ed5b1c71f552143564019a83262b0770', name: 'Pendle', symbol: 'PENDLE', decimals: 18, chain: 'arbitrum' },
  { mint: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', name: 'Wrapped Ether', symbol: 'WETH', decimals: 18, chain: 'arbitrum' },
];

export async function getArbitrumWalletTokens(address: string): Promise<WalletTokens> {
  if (!isValidArbitrumAddress(address)) {
    throw new Error('Alamat wallet Arbitrum tidak valid');
  }

  // Pindai saldo on-chain nyata. Hanya token dengan saldo > 0 yang akan dikembalikan.
  const tokens = await scanRealEVMTokens(CHAINS_CONFIG.arbitrum.rpcUrl, address, ARB_KNOWN_TOKENS);
  const totalValueUSD = tokens.reduce((acc, t) => acc + t.valueUSD, 0);

  return {
    address,
    chain: 'arbitrum',
    tokens,
    totalValueUSD,
  };
}

