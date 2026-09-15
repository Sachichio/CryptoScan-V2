import type { APIRoute } from 'astro';
import { detectChain } from '../../../lib/chains/index';
import { getSolanaWalletTokens } from '../../../lib/chains/solana';
import { getEthereumWalletTokens } from '../../../lib/chains/ethereum';
import { getBSCWalletTokens } from '../../../lib/chains/bsc';
import { getBaseWalletTokens } from '../../../lib/chains/base';
import { getArbitrumWalletTokens } from '../../../lib/chains/arbitrum';

/**
 * GET /api/tokens/[address]
 * Mengembalikan portofolio token (SPL untuk Solana, ERC-20 untuk Ethereum/Base/Arbitrum, BEP-20 untuk BSC)
 */
export const GET: APIRoute = async ({ params, url }) => {
  const { address } = params;
  const forcedChain = url.searchParams.get('chain');

  if (!address || typeof address !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Alamat wallet tidak boleh kosong' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const detected = detectChain(address);
  const targetChain = forcedChain || detected;

  if (targetChain === 'unknown') {
    return new Response(
      JSON.stringify({ error: 'Alamat tidak dikenali' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let tokensData;

    if (targetChain === 'ethereum') {
      tokensData = await getEthereumWalletTokens(address);
    } else if (targetChain === 'bsc') {
      tokensData = await getBSCWalletTokens(address);
    } else if (targetChain === 'base') {
      tokensData = await getBaseWalletTokens(address);
    } else if (targetChain === 'arbitrum') {
      tokensData = await getArbitrumWalletTokens(address);
    } else {
      tokensData = await getSolanaWalletTokens(address);
    }

    return new Response(JSON.stringify(tokensData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (err: any) {
    console.error(`Error pada /api/tokens/${address}:`, err);
    return new Response(
      JSON.stringify({
        error: err?.message || 'Gagal memproses token list',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};