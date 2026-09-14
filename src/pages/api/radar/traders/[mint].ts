import type { APIRoute } from 'astro';
import { getTopTraders } from '../../../../lib/dexscreener';

/**
 * GET /api/radar/traders/[mint]
 * Mengambil daftar Top Traders / Whale untuk sebuah mint koin tertentu
 */
export const GET: APIRoute = async ({ params }) => {
  const { mint } = params;

  if (!mint || typeof mint !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Parameter mint address wajib disertakan' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const traders = await getTopTraders(mint);

    return new Response(
      JSON.stringify({
        mint,
        traders,
        count: traders.length,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120', // Cache 2 menit
        },
      }
    );
  } catch (error: any) {
    console.error(`Error mengambil top traders untuk ${mint}:`, error);
    return new Response(
      JSON.stringify({
        error: 'Gagal mengambil data Top Traders',
        message: error?.message || 'Server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
