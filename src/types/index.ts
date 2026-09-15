/**
 * src/types/index.ts
 * Definisi tipe data TypeScript untuk multi-chain CryptoScan (Solana, Ethereum, BSC).
 */

// Identitas jaringan yang didukung
export type ChainId = 'solana' | 'ethereum' | 'bsc' | 'base' | 'arbitrum';

// Konfigurasi tiap jaringan
export interface ChainConfig {
  id: ChainId;
  name: string;             // "Solana", "Ethereum", "BNB Smart Chain"
  shortName: string;        // "SOL", "ETH", "BSC"
  nativeSymbol: string;     // "SOL", "ETH", "BNB"
  color: string;            // Warna brand untuk styling
  logoChar: string;         // Karakter/simbol logo: "◎", "⟠", "⬡"
  explorerUrl: string;      // Base URL block explorer
  rpcUrl: string;           // URL RPC
  goplusChainId?: string;   // Chain ID untuk GoPlus API ("1" ETH, "56" BSC)
  dexscreenerChain: string; // ID chain di DexScreener ("solana", "ethereum", "bsc")
}

// Detail satu transaksi blockchain
export interface Transaction {
  signature: string;        // ID / Hash transaksi
  blockTime: number | null; // Timestamp detik
  type: string;             // TRANSFER, SWAP, atau INTERACTION
  fee: number;              // Biaya dalam native coin (SOL/ETH/BNB)
  status: 'success' | 'failed';
  slot?: number;
}

// Token (SPL untuk Solana, ERC-20 untuk ETH, BEP-20 untuk BSC)
export interface Token {
  mint: string;             // Contract / Mint address
  name: string;
  symbol: string;
  logoURI?: string;
  balance: number;
  decimals: number;
  priceUSD: number;
  valueUSD: number;
  chain?: ChainId;
}

// Token ERC-20 / BEP-20
export interface EVMToken extends Token {
  contractAddress?: string;
}

// Portofolio token
export interface WalletTokens {
  address: string;
  chain?: ChainId;
  tokens: Token[];
  totalValueUSD: number;
}

// Profil lengkap wallet
export interface WalletInfo {
  address: string;
  chain: ChainId;                   // Jaringan: solana | ethereum | bsc
  nativeSymbol: string;             // "SOL" | "ETH" | "BNB"
  solBalance: number;               // Saldo native koin (SOL/ETH/BNB)
  solBalanceUSD: number;            // Nilai saldo native dalam USD
  solPriceUSD: number;              // Harga 1 native koin dalam USD
  transactionCount: number;         // Jumlah transaksi
  recentTransactions: Transaction[];// Riwayat transaksi
  tokensCount?: number;
}

// Respon standar error API
export interface ApiError {
  error: string;
  message?: string;
}

// Data koin meme untuk Meme Radar
export interface MemeCoin {
  mint: string;
  name: string;
  symbol: string;
  chain: ChainId;          // Jaringan asal koin meme
  logoURI?: string;
  priceUSD: number;
  priceChange24h: number;
  volume24hUSD: number;
  liquidityUSD: number;
  marketCapUSD: number;
  confidenceScore: number; // 1-10
  confidenceLabel: 'safe' | 'caution' | 'danger';
  pairAddress?: string;
}

// Top Whale Trader
export interface TopTrader {
  wallet: string;
  realizedPnlUSD: number;
  unrealizedPnlUSD: number;
  totalBoughtUSD: number;
  totalSoldUSD: number;
}

// Data Keamanan Token (Solana: RugCheck, EVM: GoPlus)
export interface TokenSecurity {
  mint: string;
  chain: ChainId;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  isHoneypot?: boolean;
  buyTax?: number;
  sellTax?: number;
  lpBurnedPercent: number;
  top10HolderPercent: number;
  score: number;
}
