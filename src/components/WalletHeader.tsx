import React, { useState } from 'react';
import type { WalletInfo } from '../types/index';
import { formatUSD, shortenAddress } from '../lib/utils';
import ChainBadge from './ChainBadge';

interface WalletHeaderProps {
  wallet: WalletInfo;
}

export default function WalletHeader({ wallet }: WalletHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Kolom Info Alamat & Chain */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-xl flex-shrink-0">
            {wallet.chain === 'ethereum' ? '⟠' : wallet.chain === 'bsc' ? '⬡' : wallet.chain === 'base' ? '🔷' : wallet.chain === 'arbitrum' ? '🔵' : '◎'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-slate-400">Alamat Dompet</span>
              <ChainBadge chain={wallet.chain} size="md" />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-slate-100 tracking-tight">
                {shortenAddress(wallet.address, 6)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition text-xs font-mono flex items-center gap-1"
                title="Salin alamat lengkap"
              >
                {copied ? (
                  <span className="text-emerald-400">✓ Tersalin</span>
                ) : (
                  <span>Salin</span>
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-1 truncate max-w-xs sm:max-w-md">
              {wallet.address}
            </p>
          </div>
        </div>

        {/* Kolom Saldo Native Coin */}
        <div className="grid grid-cols-2 gap-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-xs font-mono text-slate-400">
              Saldo {wallet.nativeSymbol}
            </span>
            <div className="text-2xl font-extrabold text-slate-100 font-mono mt-0.5">
              {wallet.solBalance.toFixed(4)} <span className="text-sm font-normal text-emerald-400">{wallet.nativeSymbol}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ {formatUSD(wallet.solBalanceUSD)}
            </div>
          </div>

          <div>
            <span className="text-xs font-mono text-slate-400">
              Harga {wallet.nativeSymbol}
            </span>
            <div className="text-lg font-bold text-slate-200 font-mono mt-1">
              {formatUSD(wallet.solPriceUSD)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Aktivitas: {wallet.transactionCount} tx
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}