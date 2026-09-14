/**
 * src/types/index.ts
 * Definisi tipe data TypeScript untuk seluruh data dompet dan transaksi.
 * Ini membantu editor dan compiler memastikan struktur data konsisten.
 */

// Detail satu transaksi di blockchain Solana
export interface Transaction {
  signature: string;        // ID unik transaksi (hash signature)
  blockTime: number | null; // Waktu blok dalam timestamp unix detik
  type: string;             // Jenis transaksi (misal: TRANSFER, SWAP, atau UNKNOWN)
  fee: number;              // Biaya transaksi dalam SOL
  status: 'success' | 'failed'; // Status keberhasilan transaksi
  slot?: number;            // Nomor slot blockchain
}

// Token SPL (token di ekosistem Solana, termasuk USDC, BONK, meme coin, dll.)
export interface Token {
  mint: string;             // Alamat kontrak / mint token
  name: string;             // Nama token (contoh: USD Coin, Bonk)
  symbol: string;           // Simbol ticker (contoh: USDC, BONK)
  logoURI?: string;         // Link icon gambar token jika ada
  balance: number;          // Jumlah saldo token yang dimiliki user
  decimals: number;         // Desimal token
  priceUSD: number;         // Harga token per koin dalam USD
  valueUSD: number;         // Nilai total token dalam USD (balance * priceUSD)
}

// Struktur respon lengkap saat mengambil data portofolio token
export interface WalletTokens {
  address: string;          // Alamat wallet pemilik
  tokens: Token[];          // Daftar koin yang dimiliki
  totalValueUSD: number;    // Total valuasi portofolio token dalam USD
}

// Struktur respon lengkap saat mengambil profil informasi wallet utama
export interface WalletInfo {
  address: string;                  // Alamat wallet Solana
  solBalance: number;               // Saldo koin asli SOL
  solBalanceUSD: number;            // Nilai saldo SOL dalam USD
  solPriceUSD: number;              // Harga 1 SOL saat ini dalam USD
  transactionCount: number;         // Perkiraan jumlah transaksi
  recentTransactions: Transaction[];// Riwayat transaksi terbaru
  tokensCount?: number;             // Jumlah jenis token yang dimiliki
}

// Format respon standar API jika terjadi error
export interface ApiError {
  error: string;
  message?: string;
}

// ==========================================
// TIPE DATA BARU UNTUK MEME RADAR (V2)
// ==========================================

// Data koin meme yang tampil di Meme Radar
export interface MemeCoin {
  mint: string;            // Contract address / mint address
  name: string;            // Nama koin, contoh: "BONK"
  symbol: string;          // Simbol, contoh: "BONK"
  logoURI?: string;        // URL gambar logo
  priceUSD: number;        // Harga saat ini dalam USD
  priceChange24h: number;  // % perubahan harga 24 jam (bisa negatif)
  volume24hUSD: number;    // Volume trading 24 jam dalam USD
  liquidityUSD: number;    // Total likuiditas dalam USD
  marketCapUSD: number;    // Market cap (FDV) dalam USD
  confidenceScore: number; // Skor kepercayaan 1-10 (dihitung oleh kita)
  confidenceLabel: 'safe' | 'caution' | 'danger'; // Label untuk warna badge
  pairAddress?: string;    // Alamat liquidity pool di DexScreener (opsional)
}

// Data satu wallet yang masuk kategori "Top Trader" untuk sebuah koin
export interface TopTrader {
  wallet: string;           // Alamat wallet publik
  realizedPnlUSD: number;   // Keuntungan yang sudah direalisasi (dalam USD)
  unrealizedPnlUSD: number; // Keuntungan yang belum direalisasi (dalam USD)
  totalBoughtUSD: number;   // Total nilai pembelian
  totalSoldUSD: number;     // Total nilai penjualan
}

// Data keamanan token dari RugCheck
export interface TokenSecurity {
  mint: string;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  lpBurnedPercent: number;
  top10HolderPercent: number;
  rugcheckScore: number; // Skor asli dari RugCheck (0 = perfect, makin tinggi makin berbahaya)
}
