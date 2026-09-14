/**
 * src/lib/solana.ts
 * Integrasi langsung ke Blockchain Solana via Helius RPC.
 * Mengambil balance SOL asli, akun token SPL, dan riwayat transaksi.
 */

import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import type { WalletInfo, Transaction, Token, WalletTokens } from '../types/index';
import { getSolPriceUSD, getTokenPricesUSD } from './price';

// Ambil URL RPC dari environment variable atau gunakan endpoint Helius default
const HELIUS_KEY = process.env.HELIUS_API_KEY || 'f7305b2a-724a-4eed-aac2-e724ef8eb721';
const RPC_ENDPOINT = process.env.HELIUS_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

// Inisialisasi koneksi Solana
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

/**
 * Validasi apakah sebuah string adalah Public Key Solana yang valid (Base58 32-44 karakter)
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBuffer());
  } catch {
    return false;
  }
}

/**
 * Mengambil informasi ringkas saldo SOL dan riwayat transaksi terbaru dari wallet
 */
export async function getWalletInfo(address: string): Promise<WalletInfo> {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Alamat wallet Solana tidak valid');
  }

  const pubkey = new PublicKey(address);

  // 1. Ambil saldo SOL asli dan harga SOL secara paralel
  const [lamports, solPriceUSD, signatures] = await Promise.all([
    connection.getBalance(pubkey),
    getSolPriceUSD(),
    connection.getSignaturesForAddress(pubkey, { limit: 10 }).catch(() => []),
  ]);

  const solBalance = lamports / LAMPORTS_PER_SOL;
  const solBalanceUSD = solBalance * solPriceUSD;

  // 2. Format riwayat transaksi ringkas
  const recentTransactions: Transaction[] = signatures.map((sig) => ({
    signature: sig.signature,
    blockTime: sig.blockTime ?? null,
    type: sig.err ? 'FAILED_TX' : 'TRANSFER/INTERACTION',
    fee: 0.000005, // Standar base fee di Solana adalah 5000 lamports
    status: sig.err ? 'failed' : 'success',
    slot: sig.slot,
  }));

  return {
    address,
    solBalance,
    solBalanceUSD,
    solPriceUSD,
    transactionCount: signatures.length,
    recentTransactions,
  };
}

/**
 * Mengambil semua token SPL yang dimiliki oleh wallet
 */
export async function getWalletTokens(address: string): Promise<WalletTokens> {
  if (!isValidSolanaAddress(address)) {
    throw new Error('Alamat wallet Solana tidak valid');
  }

  const pubkey = new PublicKey(address);

  // Mengambil token accounts yang dimiliki wallet (SPL Token Program ID)
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  
  let parsedTokenAccounts;
  try {
    parsedTokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: TOKEN_PROGRAM_ID,
    });
  } catch (e) {
    console.error('Gagal mengambil akun token SPL:', e);
    return { address, tokens: [], totalValueUSD: 0 };
  }

  const tokenList: Token[] = [];
  const mintAddresses: string[] = [];

  for (const item of parsedTokenAccounts.value) {
    const tokenInfo = item.account.data.parsed?.info;
    if (!tokenInfo) continue;

    const amount = Number(tokenInfo.tokenAmount?.uiAmount || 0);
    const mint = tokenInfo.mint as string;
    const decimals = Number(tokenInfo.tokenAmount?.decimals || 0);

    // Filter token dengan saldo 0 agar tampilan tetap bersih
    if (amount > 0) {
      mintAddresses.push(mint);
      tokenList.push({
        mint,
        name: `Token ${mint.slice(0, 4)}...${mint.slice(-4)}`,
        symbol: mint.slice(0, 4).toUpperCase(),
        balance: amount,
        decimals,
        priceUSD: 0,
        valueUSD: 0,
      });
    }
  }

  // Ambil harga token secara bersamaan via Jupiter API jika ada token ditemukan
  if (mintAddresses.length > 0) {
    const prices = await getTokenPricesUSD(mintAddresses);
    for (const token of tokenList) {
      if (prices[token.mint]) {
        token.priceUSD = prices[token.mint];
        token.valueUSD = token.balance * token.priceUSD;
      }
    }
  }

  // Urutkan token dari nilai USD tertinggi
  tokenList.sort((a, b) => b.valueUSD - a.valueUSD);

  const totalValueUSD = tokenList.reduce((acc, t) => acc + (t.valueUSD || 0), 0);

  return {
    address,
    tokens: tokenList,
    totalValueUSD,
  };
}
