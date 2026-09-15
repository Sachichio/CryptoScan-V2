import { createPublicClient, http, formatEther, isAddress } from 'viem';
import { mainnet } from 'viem/chains';
import type { WalletInfo, Transaction, Token, WalletTokens } from '../../types/index';
import { getETHPriceUSD } from '../price';
import { CHAINS_CONFIG } from './index';

// Client RPC Ethereum publik via Ankr
const client = createPublicClient({
  chain: mainnet,
  transport: http(CHAINS_CONFIG.ethereum.rpcUrl),
});

export function isValidEVMAddress(address: string): boolean {
  return isAddress(address);
}

export async function getEthereumWalletInfo(address: string): Promise<WalletInfo> {
  if (!isValidEVMAddress(address)) {
    throw new Error('Alamat wallet Ethereum tidak valid');
  }

  const [balanceWei, ethPriceUSD, txCount] = await Promise.all([
    client.getBalance({ address: address as `0x${string}` }),
    getETHPriceUSD(),
    client.getTransactionCount({ address: address as `0x${string}` }).catch(() => 0),
  ]);

  const ethBalance = parseFloat(formatEther(balanceWei));
  const ethBalanceUSD = ethBalance * ethPriceUSD;

  // Transaksi on-chain detail membutuhkan indexer, kita berikan array kosong jujur agar diarahkan ke Etherscan
  const recentTransactions: Transaction[] = [];

  return {
    address,
    chain: 'ethereum',
    nativeSymbol: 'ETH',
    solBalance: ethBalance,
    solBalanceUSD: ethBalanceUSD,
    solPriceUSD: ethPriceUSD,
    transactionCount: txCount,
    recentTransactions,
  };
}

import { scanRealEVMTokens, type KnownTokenConfig } from './evm-tokens';

const ETH_KNOWN_TOKENS: KnownTokenConfig[] = [
  { mint: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether USD', symbol: 'USDT', decimals: 6, chain: 'ethereum' },
  { mint: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', symbol: 'USDC', decimals: 6, chain: 'ethereum' },
  { mint: '0x6982508145454ce325ddbe47a25d4ec3d2311933', name: 'Pepe', symbol: 'PEPE', decimals: 18, chain: 'ethereum' },
  { mint: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', name: 'Shiba Inu', symbol: 'SHIB', decimals: 18, chain: 'ethereum' },
  { mint: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', name: 'Wrapped Ether', symbol: 'WETH', decimals: 18, chain: 'ethereum' },
  { mint: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', name: 'Wrapped BTC', symbol: 'WBTC', decimals: 8, chain: 'ethereum' },
  { mint: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'Dai Stablecoin', symbol: 'DAI', decimals: 18, chain: 'ethereum' },
  { mint: '0x111111111117dc0aa78b770fa6a738034120c302', name: '1inch', symbol: '1INCH', decimals: 18, chain: 'ethereum' },
];

export async function getEthereumWalletTokens(address: string): Promise<WalletTokens> {
  if (!isValidEVMAddress(address)) {
    throw new Error('Alamat wallet Ethereum tidak valid');
  }

  // Pindai saldo on-chain nyata. Hanya token dengan saldo > 0 yang akan dikembalikan.
  const tokens = await scanRealEVMTokens(CHAINS_CONFIG.ethereum.rpcUrl, address, ETH_KNOWN_TOKENS);
  const totalValueUSD = tokens.reduce((acc, t) => acc + t.valueUSD, 0);

  return {
    address,
    chain: 'ethereum',
    tokens,
    totalValueUSD,
  };
}

