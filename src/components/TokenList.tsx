import React, { useState, useEffect } from 'react';
import type { Token } from '../types/index';
import { formatUSD, formatCryptoAmount, shortenAddress } from '../lib/utils';

interface TokenListProps {
  address: string;
}

export default function TokenList({ address }: TokenListProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function fetchTokens() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tokens/${address}`);
        if (!res.ok) {
          throw new Error('Gagal memuat daftar token dari server.');
        }
        const data = await res.json();
        if (isMounted) {
          setTokens(data.tokens || []);
          setTotalValue(data.totalValueUSD || 0);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Terjadi kendala saat memuat portofolio token');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (address) {
      fetchTokens();
    }

    return () => {
      isMounted = false;
    };
  }, [address]);

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
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Portofolio Token SPL</span>
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {tokens.length} Token
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daftar token dan meme coin di jaringan Solana beserta estimasi valuasi USD.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cari token / mint..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/60 border border-slate-700/60 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Valuasi Token:</span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {formatUSD(totalValue)}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-xs font-mono">Memindai akun token SPL via RPC...</span>
        </div>
      ) : error ? (
        <div className="py-6 px-4 bg-rose-950/20 border border-rose-800/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      ) : tokens.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl">
          <p>Tidak ada token SPL dengan saldo aktif di wallet ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Aset / Token</th>
                <th className="py-3 px-4">Kontrak Mint</th>
                <th className="py-3 px-4 text-right">Jumlah Saldo</th>
                <th className="py-3 px-4 text-right">Harga USD</th>
                <th className="py-3 px-4 text-right">Total Nilai (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filteredTokens.map((token) => (
                <tr key={token.mint} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-emerald-400 font-mono">
                      {token.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">{token.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{token.symbol}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                    <a
                      href={`https://solscan.io/token/${token.mint}`}
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