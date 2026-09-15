import type { APIRoute } from 'astro';
import { detectChain } from '../../../lib/chains/index';
import { getSolanaWalletInfo } from '../../../lib/chains/solana';
import { getEthereumWalletInfo } from '../../../lib/chains/ethereum';
import { getBSCWalletInfo } from '../../../lib/chains/bsc';
import { getBaseWalletInfo } from '../../../lib/chains/base';
import { getArbitrumWalletInfo } from '../../../lib/chains/arbitrum';

/**
 * GET /api/wallet/[address]
 * Auto-route cerdas ke adapter blockchain yang tepat (Solana, Ethereum, BSC, Base, atau Arbitrum)
 */
export const GET: APIRoute = async ({ params, url }) => {
  const { address } = params;
  const forcedChain = url.searchParams.get('chain'); // Opsi paksa chain misal ?chain=bsc

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
      JSON.stringify({
        error: 'Format alamat wallet tidak dikenali. Masukkan alamat Solana valid atau alamat EVM (0x...)',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let walletInfo;

    if (targetChain === 'ethereum') {
      walletInfo = await getEthereumWalletInfo(address);
    } else if (targetChain === 'bsc') {
      walletInfo = await getBSCWalletInfo(address);
    } else if (targetChain === 'base') {
      walletInfo = await getBaseWalletInfo(address);
    } else if (targetChain === 'arbitrum') {
      walletInfo = await getArbitrumWalletInfo(address);
    } else {
      walletInfo = await getSolanaWalletInfo(address);
    }

    return new Response(JSON.stringify(walletInfo), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=15',
      },
    });
  } catch (err: any) {
    console.error(`Error pada /api/wallet/${address}:`, err);
    return new Response(
      JSON.stringify({
        error: err?.message || 'Gagal memproses wallet info',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};