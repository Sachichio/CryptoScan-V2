import React, { useEffect, useState } from 'react';
import type { TopTrader } from '../types/index';
import { formatUSD, shortenAddress } from '../lib/utils';

interface TopTradersModalProps {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  chain?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal Popup untuk melihat whale dan trader paling cuan pada token tertentu
 * Memungkinkan navigasi langsung ke halaman /wallet/[address]
 */
export default function TopTradersModal({
  mint,
  tokenName,
  tokenSymbol,
  chain = 'solana',
  isOpen,
  onClose,
}: TopTradersModalProps) {
  const [traders, setTraders] = useState<TopTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !mint) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/radar/traders/${mint}?chain=${chain || 'solana'}`)
      .then((res) => {
        if (!res.ok) throw new Error('Gagal mengambil data top traders');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setTraders(data.traders || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Terjadi kesalahan');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, mint]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
              🐋
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2">
                Top Whale Traders
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
                  {tokenSymbol}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Dompet-dompet paling cuan dan memiliki aktivitas besar di {tokenName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto">
          {loading && (
            <div className="py-12 text-center text-slate-400 text-sm font-mono flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Menganalisis transaksi whale on-chain...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono text-center">
              {error}
            </div>
          )}

          {!loading && !error && traders.length === 0 && (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 text-xl">
                ⚠️
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">
                Data Whale Belum Tersedia di On-Chain
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                Sistem tidak dapat menarik daftar pemegang terbesar untuk token ini secara langsung dari blockchain. Kemungkinan likuiditas token masih sangat baru atau indeks data pemegang sedang diperbarui.
              </p>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-300 font-mono">
                Silakan pantau pergerakan transaksi token ini secara langsung di DexScreener atau Block Explorer.
              </div>
            </div>
          )}

          {!loading && !error && traders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Alamat Wallet</th>
                    <th className="pb-3 text-right">Realized Profit</th>
                    <th className="pb-3 text-right">Total Beli</th>
                    <th className="pb-3 pr-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {traders.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-4 text-slate-500">#{idx + 1}</span>
                          <span className="text-slate-200 font-semibold" title={t.wallet}>
                            {shortenAddress(t.wallet, 4)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400">
                        +{formatUSD(t.realizedPnlUSD)}
                      </td>
                      <td className="py-3.5 text-right text-slate-400">
                        {formatUSD(t.totalBoughtUSD)}
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        {(() => {
                          const isEVM = chain && chain !== 'solana';
                          const stalkUrl = `/wallet/${t.wallet}${isEVM ? `?chain=${chain}` : ''}`;
                          return (
                            <a
                              href={stalkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-[11px] font-medium"
                            >
                              <span>Stalk Wallet</span>
                              <span>→</span>
                            </a>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Klik "Stalk Wallet" untuk membongkar portofolio lengkap whale.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
