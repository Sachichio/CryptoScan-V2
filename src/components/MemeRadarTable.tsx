import React, { useState } from 'react';
import type { MemeCoin } from '../types/index';
import { formatUSD } from '../lib/utils';
import ConfidenceBadge from './ConfidenceBadge';
import TopTradersModal from './TopTradersModal';

interface MemeRadarTableProps {
  initialCoins: MemeCoin[];
}

/**
 * Tabel utama Meme Radar
 * Menampilkan daftar koin meme trending, perubahan harga 24h, volume, likuiditas, confidence score, dan tombol whale stalker
 */
export default function MemeRadarTable({ initialCoins }: MemeRadarTableProps) {
  const [coins, setCoins] = useState<MemeCoin[]>(initialCoins);
  const [loading, setLoading] = useState(false);
  const [filterScore, setFilterScore] = useState<'all' | 'safe' | 'caution'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State untuk Top Traders
  const [selectedCoin, setSelectedCoin] = useState<{
    mint: string;
    name: string;
    symbol: string;
  } | null>(null);

  // Refresh data secara client-side
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/radar/trending');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coins)) {
          setCoins(data.coins);
        }
      }
    } catch (e) {
      console.error('Gagal refresh meme radar:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter koin berdasarkan status score dan input search
  const filteredCoins = coins.filter((coin) => {
    const matchesSearch =
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.mint.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterScore === 'safe') return coin.confidenceScore >= 8;
    if (filterScore === 'caution') return coin.confidenceScore >= 5;
    return true;
  });

  return (
    <div>
      {/* Baris Kontrol: Search, Filter Score, & Refresh Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari token atau mint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-mono">
            <button
              onClick={() => setFilterScore('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterScore === 'all'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({coins.length})
            </button>
            <button
              onClick={() => setFilterScore('safe')}
              className={`px-3 py-1 rounded-lg transition ${
                filterScore === 'safe'
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Aman (8-10)
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition disabled:opacity-50"
            title="Muat ulang data live"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabel Utama Meme Radar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 pl-4 sm:pl-6"># Token</th>
                <th className="py-3.5 text-right">Harga</th>
                <th className="py-3.5 text-right">24h Δ</th>
                <th className="py-3.5 text-right hidden md:table-cell">Volume 24h</th>
                <th className="py-3.5 text-right hidden sm:table-cell">Likuiditas</th>
                <th className="py-3.5 text-center">Confidence Score</th>
                <th className="py-3.5 pr-4 sm:pr-6 text-right">Whale Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs font-mono">
              {filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada token yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin, index) => (
                  <tr
                    key={coin.mint}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* Kolom Nama & Token Info */}
                    <td className="py-4 pl-4 sm:pl-6">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px] w-5 text-right">
                          {index + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {coin.logoURI ? (
                            <img
                              src={coin.logoURI}
                              alt={coin.symbol}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {coin.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition flex items-center gap-1.5">
                            <span>{coin.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                              {coin.symbol}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate max-w-[120px] sm:max-w-[180px]">
                            {coin.mint}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Harga USD */}
                    <td className="py-4 text-right font-semibold text-slate-200">
                      ${coin.priceUSD < 0.01 ? coin.priceUSD.toFixed(7) : coin.priceUSD.toFixed(4)}
                    </td>

                    {/* % Perubahan 24 Jam */}
                    <td className="py-4 text-right">
                      <span
                        className={`inline-flex items-center font-bold ${
                          coin.priceChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {coin.priceChange24h >= 0 ? '+' : ''}
                        {coin.priceChange24h.toFixed(1)}%
                      </span>
                    </td>

                    {/* Volume 24h */}
                    <td className="py-4 text-right hidden md:table-cell text-slate-300">
                      {formatUSD(coin.volume24hUSD)}
                    </td>

                    {/* Likuiditas */}
                    <td className="py-4 text-right hidden sm:table-cell text-slate-400">
                      {formatUSD(coin.liquidityUSD)}
                    </td>

                    {/* Confidence Score Badge */}
                    <td className="py-4 text-center">
                      <ConfidenceBadge
                        score={coin.confidenceScore}
                        label={coin.confidenceLabel}
                      />
                    </td>

                    {/* Tombol Lihat Whale */}
                    <td className="py-4 pr-4 sm:pr-6 text-right">
                      <button
                        onClick={() =>
                          setSelectedCoin({
                            mint: coin.mint,
                            name: coin.name,
                            symbol: coin.symbol,
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-xs font-semibold"
                      >
                        <span>🐋 Whales</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup Top Traders / Smart Money */}
      {selectedCoin && (
        <TopTradersModal
          mint={selectedCoin.mint}
          tokenName={selectedCoin.name}
          tokenSymbol={selectedCoin.symbol}
          isOpen={true}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </div>
  );
}
