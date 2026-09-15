import { createPublicClient, http, formatEther, isAddress } from 'viem';
import { bsc } from 'viem/chains';
import type { WalletInfo, Transaction, Token, WalletTokens } from '../../types/index';
import { getBNBPriceUSD } from '../price';
import { CHAINS_CONFIG } from './index';

// Client RPC BNB Smart Chain publik via Ankr
const client = createPublicClient({
  chain: bsc,
  transport: http(CHAINS_CONFIG.bsc.rpcUrl),
});

export function isValidBSCAddress(address: string): boolean {
  return isAddress(address);
}

export async function getBSCWalletInfo(address: string): Promise<WalletInfo> {
  if (!isValidBSCAddress(address)) {
    throw new Error('Alamat wallet BSC tidak valid');
  }

  const [balanceWei, bnbPriceUSD, txCount] = await Promise.all([
    client.getBalance({ address: address as `0x${string}` }),
    getBNBPriceUSD(),
    client.getTransactionCount({ address: address as `0x${string}` }).catch(() => 0),
  ]);

  const bnbBalance = parseFloat(formatEther(balanceWei));
  const bnbBalanceUSD = bnbBalance * bnbPriceUSD;

  // Transaksi on-chain detail membutuhkan indexer, kita berikan array kosong jujur agar diarahkan ke BscScan
  const recentTransactions: Transaction[] = [];

  return {
    address,
    chain: 'bsc',
    nativeSymbol: 'BNB',
    solBalance: bnbBalance,
    solBalanceUSD: bnbBalanceUSD,
    solPriceUSD: bnbPriceUSD,
    transactionCount: txCount,
    recentTransactions,
  };
}

import { scanRealEVMTokens, type KnownTokenConfig } from './evm-tokens';

const BSC_KNOWN_TOKENS: KnownTokenConfig[] = [
  { mint: '0x55d398326f99059ff775485246999027b3197955', name: 'Tether USD', symbol: 'USDT', decimals: 18, chain: 'bsc' },
  { mint: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', name: 'PancakeSwap Token', symbol: 'CAKE', decimals: 18, chain: 'bsc' },
  { mint: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', name: 'Wrapped BNB', symbol: 'WBNB', decimals: 18, chain: 'bsc' },
  { mint: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', name: 'USD Coin', symbol: 'USDC', decimals: 18, chain: 'bsc' },
  { mint: '0xe9e7cea3dedca5984780bafc599bd69add087d56', name: 'BUSD Token', symbol: 'BUSD', decimals: 18, chain: 'bsc' },
  { mint: '0x2170ed0880ac9a755fd29b2688956bd959f933f8', name: 'Ethereum Token', symbol: 'ETH', decimals: 18, chain: 'bsc' },
  { mint: '0xba2ae424d960c26247dd6c32edc70b295c744c43', name: 'Dogecoin', symbol: 'DOGE', decimals: 8, chain: 'bsc' },
  { mint: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', name: 'BTCB Token', symbol: 'BTCB', decimals: 18, chain: 'bsc' },
];

export async function getBSCWalletTokens(address: string): Promise<WalletTokens> {
  if (!isValidBSCAddress(address)) {
    throw new Error('Alamat wallet BSC tidak valid');
  }

  // Pindai saldo on-chain nyata. Hanya token dengan saldo > 0 yang akan dikembalikan.
  const tokens = await scanRealEVMTokens(CHAINS_CONFIG.bsc.rpcUrl, address, BSC_KNOWN_TOKENS);
  const totalValueUSD = tokens.reduce((acc, t) => acc + t.valueUSD, 0);

  return {
    address,
    chain: 'bsc',
    tokens,
    totalValueUSD,
  };
}

