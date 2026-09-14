/**
 * src/lib/utils.ts
 * Fungsi helper umum untuk formatting teks, angka, alamat wallet, dll.
 */

// Mempersingkat alamat Solana panjang (misal: vines1vzrYbz...NKPTg)
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Format mata uang USD dengan koma dan 2 desimal (contoh: $1,234.56)
export function formatUSD(value: number): string {
  if (isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format jumlah angka crypto secara fleksibel tergantung besarnya angka
export function formatCryptoAmount(amount: number, maxDecimals: number = 4): string {
  if (isNaN(amount)) return '0';
  if (amount === 0) return '0';
  if (amount < 0.0001) {
    return amount.toExponential(2);
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxDecimals,
  }).format(amount);
}

// Format waktu timestamp menjadi format relatif (misal: 5 menit yang lalu)
export function formatRelativeTime(timestampSeconds: number | null): string {
  if (!timestampSeconds) return 'Waktu tidak tersedia';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSeconds;

  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}
