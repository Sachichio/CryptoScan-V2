/**
 * src/pages/api/wallet/[address].ts
 * Backend endpoint untuk mengambil profil informasi wallet Solana.
 * Endpoint: GET /api/wallet/:address
 */
import type { APIRoute } from 'astro';
import { getWalletInfo, isValidSolanaAddress } from '../../../lib/solana';

export const prerender = false; // Memastikan endpoint ini dieksekusi on-demand (SSR)

export const GET: APIRoute = async ({ params }) => {
  const address = params.address;

  if (!address || !isValidSolanaAddress(address)) {
    return new Response(
      JSON.stringify({ error: 'Alamat wallet Solana tidak valid atau kosong' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const data = await getWalletInfo(address);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15', // Cache singkat 15 detik
      },
    });
  } catch (error: any) {
    console.error('Error pada GET /api/wallet/[address]:', error);
    return new Response(
      JSON.stringify({
        error: 'Gagal mengambil data wallet',
        message: error?.message || 'Terjadi kesalahan saat menghubungi RPC Solana',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};