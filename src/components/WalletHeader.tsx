import React, { useState } from 'react';
import type { WalletInfo } from '../types/index';
import { shortenAddress, formatUSD, formatCryptoAmount } from '../lib/utils';

interface WalletHeaderProps {
  wallet: WalletInfo;
}

export default function WalletHeader({ wallet }: WalletHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Side: Address & Network Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Solana Mainnet
            </span>
            <span className="text-xs text-slate-400">
              via Helius RPC
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-mono font-bold text-slate-100 tracking-tight">
              {shortenAddress(wallet.address, 6)}
            </h1>
            <button
              onClick={copyToClipboard}
              title="Salin Alamat Lengkap"
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400 font-medium">Tersalin!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Salin</span>
                </>
              )}
            </button>
            <a
              href={`https://solscan.io/account/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-700/60 transition flex items-center gap-1"
            >
              <span>Solscan</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1 break-all select-all opacity-70 hidden sm:block">
            {wallet.address}
          </p>
        </div>

        {/* Right Side: Total Balance Cards */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-5 py-3.5 min-w-[170px]">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Saldo Asli SOL
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatCryptoAmount(wallet.solBalance, 4)} <span className="text-sm text-slate-300 font-sans">SOL</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ≈ {formatUSD(wallet.solBalanceUSD)}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-5 py-3.5 min-w-[150px]">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Harga SOL / USD
            </span>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {formatUSD(wallet.solPriceUSD)}
            </div>
            <div className="text-xs text-emerald-400/90 font-mono mt-0.5">
              Real-time Market
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}