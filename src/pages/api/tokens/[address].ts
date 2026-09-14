/**
 * src/pages/api/tokens/[address].ts
 * Backend endpoint untuk mengambil daftar kepemilikan token SPL & valuasi nilainya.
 * Endpoint: GET /api/tokens/:address
 */
import type { APIRoute } from 'astro';
import { getWalletTokens, isValidSolanaAddress } from '../../../lib/solana';

export const prerender = false; // SSR on-demand

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
    const data = await getWalletTokens(address);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30', // Cache 30 detik
      },
    });
  } catch (error: any) {
    console.error('Error pada GET /api/tokens/[address]:', error);
    return new Response(
      JSON.stringify({
        error: 'Gagal mengambil data token',
        message: error?.message || 'Terjadi kesalahan saat memproses token SPL',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};