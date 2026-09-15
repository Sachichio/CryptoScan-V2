import React, { useState } from 'react';
import type { Token, ChainId } from '../types/index';
import { formatUSD, formatCryptoAmount, shortenAddress } from '../lib/utils';
import { CHAINS_CONFIG } from '../lib/chains/index';

interface TokenListProps {
  tokens?: Token[];
  totalValueUSD?: number;
  chain?: ChainId;
  address?: string;
}

export default function TokenList({
  tokens = [],
  totalValueUSD = 0,
  chain = 'solana',
}: TokenListProps) {
  const [filter, setFilter] = useState<string>('');

  const config = CHAINS_CONFIG[chain] || CHAINS_CONFIG.solana;

  // Konfigurasi dinamis teks dan link per jaringan
  const chainMeta = {
    solana: {
      title: 'Portofolio Token SPL',
      desc: 'Daftar token dan meme coin di jaringan Solana beserta estimasi valuasi USD.',
      emptyText: 'Tidak ada token SPL dengan saldo aktif di wallet ini.',
      explorerTokenUrl: 'https://solscan.io/token/',
      badgeColor: 'text-emerald-400',
    },
    ethereum: {
      title: 'Portofolio Token ERC-20',
      desc: 'Daftar token dan aset kripto ERC-20 di jaringan Ethereum beserta estimasi valuasi USD.',
      emptyText: 'Tidak ada token ERC-20 dengan saldo aktif di wallet ini.',
      explorerTokenUrl: 'https://etherscan.io/token/',
      badgeColor: 'text-cyan-400',
    },
    bsc: {
      title: 'Portofolio Token BEP-20',
      desc: 'Daftar token dan aset kripto BEP-20 di jaringan BNB Smart Chain beserta estimasi valuasi USD.',
      emptyText: 'Tidak ada token BEP-20 dengan saldo aktif di wallet ini.',
      explorerTokenUrl: 'https://bscscan.com/token/',
      badgeColor: 'text-amber-400',
    },
    base: {
      title: 'Portofolio Token ERC-20 (Base)',
      desc: 'Daftar token dan aset kripto di jaringan Base (L2 Ethereum by Coinbase) beserta estimasi valuasi USD.',
      emptyText: 'Tidak ada token dengan saldo aktif di Base wallet ini.',
      explorerTokenUrl: 'https://basescan.org/token/',
      badgeColor: 'text-indigo-400',
    },
    arbitrum: {
      title: 'Portofolio Token ERC-20 (Arbitrum)',
      desc: 'Daftar token dan aset kripto di jaringan Arbitrum One (L2 Ethereum by Offchain Labs) beserta estimasi valuasi USD.',
      emptyText: 'Tidak ada token dengan saldo aktif di Arbitrum wallet ini.',
      explorerTokenUrl: 'https://arbiscan.io/token/',
      badgeColor: 'text-blue-400',
    },
  }[chain] || {
    title: 'Portofolio Token',
    desc: 'Daftar token dan aset di dompet ini.',
    emptyText: 'Tidak ada token dengan saldo aktif.',
    explorerTokenUrl: `${config.explorerUrl}/token/`,
    badgeColor: 'text-slate-400',
  };

  const filteredTokens = tokens.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    t.symbol.toLowerCase().includes(filter.toLowerCase()) ||
    t.mint.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <svg className={`w-5 h-5 ${chainMeta.badgeColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>{chainMeta.title}</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {tokens.length} Token
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {chainMeta.desc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari token / mint / kontrak..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Valuasi Token:</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {formatUSD(totalValueUSD)}
            </span>
          </div>
        </div>
      </div>

      {tokens.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl">
          <p>{chainMeta.emptyText}</p>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
          <p>Tidak ada token yang cocok dengan filter "{filter}".</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Aset / Token</th>
                <th className="py-3 px-4">Kontrak / Mint</th>
                <th className="py-3 px-4 text-right">Jumlah Saldo</th>
                <th className="py-3 px-4 text-right">Harga USD</th>
                <th className="py-3 px-4 text-right">Total Nilai (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filteredTokens.map((token) => (
                <tr key={token.mint} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-emerald-400 font-mono overflow-hidden flex-shrink-0">
                      {token.logoURI ? (
                        <img
                          src={token.logoURI}
                          alt={token.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        token.symbol.slice(0, 3)
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{token.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{token.symbol}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                    <a
                      href={`${chainMeta.explorerTokenUrl}${token.mint}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-emerald-400 underline decoration-slate-700 underline-offset-2 transition"
                      title={token.mint}
                    >
                      {shortenAddress(token.mint, 5)}
                    </a>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                    {formatCryptoAmount(token.balance, 4)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 text-xs">
                    {token.priceUSD > 0 ? formatUSD(token.priceUSD) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                    {token.valueUSD > 0 ? formatUSD(token.valueUSD) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}