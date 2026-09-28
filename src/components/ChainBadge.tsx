import React from 'react';
import type { ChainId } from '../types/index';
import { CHAINS_CONFIG } from '../lib/chains/index';

interface ChainBadgeProps {
  chain: ChainId;
  size?: 'sm' | 'md';
}

/**
 * Badge visual untuk identifikasi blockchain (Solana, Ethereum, BSC)
 */
export default function ChainBadge({ chain, size = 'sm' }: ChainBadgeProps) {
  const config = CHAINS_CONFIG[chain] || CHAINS_CONFIG.solana;

  const chainColors: Record<ChainId, { color: string; bg: string; border: string }> = {
    solana: { color: '#14F195', bg: 'rgba(20, 241, 149, 0.1)', border: 'rgba(20, 241, 149, 0.25)' },
    ethereum: { color: '#8fa2e0', bg: 'rgba(143, 162, 224, 0.1)', border: 'rgba(143, 162, 224, 0.25)' },
    bsc: { color: '#d9b25a', bg: 'rgba(217, 178, 90, 0.1)', border: 'rgba(217, 178, 90, 0.25)' },
    base: { color: '#6b93e8', bg: 'rgba(107, 147, 232, 0.1)', border: 'rgba(107, 147, 232, 0.25)' },
    arbitrum: { color: '#6aaed8', bg: 'rgba(106, 174, 216, 0.1)', border: 'rgba(106, 174, 216, 0.25)' },
  };

  const scheme = chainColors[chain] || chainColors.solana;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-semibold ${padding}`}
      style={{
        color: scheme.color,
        backgroundColor: scheme.bg,
        borderColor: scheme.border,
      }}
      title={`Jaringan ${config.name}`}
    >
      <span>{config.logoChar}</span>
      <span>{config.shortName}</span>
    </span>
  );
}
