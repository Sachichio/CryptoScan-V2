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

  const colorStyles: Record<ChainId, string> = {
    solana: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    ethereum: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    bsc: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    base: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    arbitrum: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const style = colorStyles[chain];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-semibold ${style} ${padding}`}
      title={`Jaringan ${config.name}`}
    >
      <span>{config.logoChar}</span>
      <span>{config.shortName}</span>
    </span>
  );
}
