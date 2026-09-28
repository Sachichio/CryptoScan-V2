import React, { useState } from 'react';
import type { MemeCoin, ChainId } from '../types/index';
import { formatUSD } from '../lib/utils';
import ConfidenceBadge from './ConfidenceBadge';
import ChainBadge from './ChainBadge';
import TopTradersModal from './TopTradersModal';

interface MemeRadarTableProps {
  initialCoins: MemeCoin[];
}

export default function MemeRadarTable({ initialCoins }: MemeRadarTableProps) {
  const [coins, setCoins] = useState<MemeCoin[]>(initialCoins);
  const [activeChain, setActiveChain] = useState<ChainId>('solana');
  const [loading, setLoading] = useState(false);
  const [filterScore, setFilterScore] = useState<'all' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveSearch, setIsLiveSearch] = useState(false);
  const [searchStatusText, setSearchStatusText] = useState('');

  const [selectedCoin, setSelectedCoin] = useState<{
    mint: string;
    name: string;
    symbol: string;
    chain: string;
  } | null>(null);

  // Ganti filter chain (Solana / Ethereum / BSC / Base / Arbitrum)
  const handleChainChange = async (chain: ChainId) => {
    setActiveChain(chain);
    setLoading(true);
    setIsLiveSearch(false);
    setSearchStatusText('');
    try {
      const res = await fetch(`/api/radar/trending?chain=${chain}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coins)) {
          setCoins(data.coins);
        }
      }
    } catch (err) {
      console.error('Gagal memuat koin trending chain:', err);
    } finally {
      setLoading(false);
    }
  };

  // Eksekusi Pencarian Live ke DexScreener API
  const executeLiveSearch = async () => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    setLoading(true);
    setIsLiveSearch(true);
    setSearchStatusText(`Mencari "${q}" di DexScreener (${activeChain.toUpperCase()})...`);

    try {
      const res = await fetch(`/api/radar/search?q=${encodeURIComponent(q)}&chain=${activeChain}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coins)) {
          setCoins(data.coins);
        } else {
          setCoins([]);
        }
      } else {
        setCoins([]);
      }
    } catch (err) {
      console.error('Error saat pencarian live DexScreener:', err);
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset kembali ke data Trending asli
  const handleResetTrending = async () => {
    setSearchQuery('');
    setIsLiveSearch(false);
    setSearchStatusText('');
    handleChainChange(activeChain);
  };

  const filteredCoins = coins.filter((coin) => {
    if (!isLiveSearch) {
      const matchesSearch =
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.mint.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
    }
    if (filterScore === 'safe') return coin.confidenceScore >= 8;
    return true;
  });

  return (
    <div>
      {/* Kontrol Utama: Pemilih Chain (Multi-Chain Tabs) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Tabs Jaringan */}
        <div className="inline-flex p-1 bg-surface-2 border border-line rounded-2xl">
          {[
            { id: 'solana', name: 'Solana', icon: '◎', color: '#14F195' },
            { id: 'ethereum', name: 'Ethereum', icon: '⟠', color: '#8fa2e0' },
            { id: 'bsc', name: 'BNB Chain', icon: '⬡', color: '#d9b25a' },
            { id: 'base', name: 'Base', icon: '🔷', color: '#6b93e8' },
            { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', color: '#6aaed8' },
          ].map((c) => {
            const active = activeChain === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleChainChange(c.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer ${
                  active
                    ? 'bg-surface-3 text-ink shadow-sm'
                    : 'text-muted hover:bg-white/[0.04] hover:text-ink'
                }`}
                style={
                  active
                    ? {
                        color: c.color,
                        boxShadow: `0 0 12px ${c.color}20`,
                        border: `1px solid ${c.color}35`,
                      }
                    : { border: '1px solid transparent' }
                }
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Input & Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari nama atau kontrak (Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  executeLiveSearch();
                }
              }}
              className="px-3.5 py-2 pr-8 bg-surface-2 border border-line rounded-xl text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand/40 transition w-full sm:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-muted hover:text-ink text-xs"
                title="Hapus ketikan"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={executeLiveSearch}
            disabled={loading || searchQuery.trim().length < 2}
            className="px-3 py-2 rounded-xl bg-brand/15 hover:bg-brand/25 text-brand border border-brand/30 text-xs font-mono font-semibold transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Cari di DexScreener"
          >
            <span>🔍</span>
            <span>Cari</span>
          </button>

          {isLiveSearch && (
            <button
              onClick={handleResetTrending}
              className="px-3 py-2 rounded-xl bg-surface-3 hover:bg-surface text-ink border border-line text-xs font-mono transition flex items-center gap-1 cursor-pointer"
              title="Kembali ke koin Trending"
            >
              <span>✕</span>
              <span>Trending</span>
            </button>
          )}

          <button
            onClick={() => setFilterScore(filterScore === 'all' ? 'safe' : 'all')}
            className={`px-3 py-2 rounded-xl border text-xs font-mono transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
              filterScore === 'safe'
                ? 'bg-brand/15 text-brand border-brand/40 font-semibold'
                : 'bg-surface-2 text-muted border-line hover:text-ink'
            }`}
          >
            <span>🛡️</span>
            <span>Hanya Aman (8-10)</span>
          </button>
        </div>
      </div>

      {/* Indikator Status Pencarian Live */}
      {isLiveSearch && (
        <div className="mb-4 px-4 py-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hasil Pencarian Live DexScreener untuk: <strong>"{searchQuery}"</strong> di jaringan <strong>{activeChain.toUpperCase()}</strong></span>
          </div>
          <button
            onClick={handleResetTrending}
            className="text-slate-400 hover:text-emerald-300 underline text-[11px]"
          >
            Kembali ke Daftar Trending
          </button>
        </div>
      )}

      {/* Tabel Koin Meme */}
      <div className="bg-surface/70 border border-line rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-[11px] font-mono text-muted uppercase tracking-wider">
                <th className="py-3.5 pl-4 sm:pl-6"># Token</th>
                <th className="py-3.5 text-center">Jaringan</th>
                <th className="py-3.5 text-right">Harga</th>
                <th className="py-3.5 text-right">24h Δ</th>
                <th className="py-3.5 text-right hidden md:table-cell">Volume 24h</th>
                <th className="py-3.5 text-center">Confidence Score</th>
                <th className="py-3.5 pr-4 sm:pr-6 text-right">Whale Intel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted">
                    <div className="inline-block w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mb-2"></div>
                    <div>{searchStatusText || `Memindai data Meme Radar (${activeChain.toUpperCase()})...`}</div>
                  </td>
                </tr>
              ) : filteredCoins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted">
                    <div className="w-12 h-12 rounded-full bg-surface-2 border border-line flex items-center justify-center mx-auto mb-3 text-xl">
                      🔍
                    </div>
                    <div className="font-semibold text-ink mb-1">
                      {isLiveSearch
                        ? `Token tidak ditemukan di DexScreener (${activeChain.toUpperCase()})`
                        : `Tidak ada token yang cocok di jaringan ${activeChain.toUpperCase()}`}
                    </div>
                    <p className="text-xs text-muted max-w-md mx-auto mb-4 font-sans">
                      {isLiveSearch
                        ? 'Pastikan nama atau alamat kontrak (CA) yang Anda masukkan sudah benar dan terdaftar pada jaringan ini.'
                        : 'Coba tekan tombol 🔍 Cari untuk mencari langsung ke seluruh database DexScreener.'}
                    </p>
                    {isLiveSearch && (
                      <button
                        onClick={handleResetTrending}
                        className="px-3.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-ink text-xs font-mono transition"
                      >
                        ← Tampilkan Kembali Koin Trending
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCoins.map((coin, index) => (
                  <tr key={`${coin.chain}-${coin.mint}`} className="hover:bg-white/[0.02] transition group">
                    <td className="py-4 pl-4 sm:pl-6">
                      <div className="flex items-center gap-3">
                        <span className="text-muted text-[11px] w-4 text-right">
                          {index + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center overflow-hidden flex-shrink-0">
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
                            <span className="text-xs font-bold text-muted">
                              {coin.symbol.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-ink group-hover:text-brand transition flex items-center gap-1.5">
                            <span>{coin.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 text-muted font-normal border border-line">
                              {coin.symbol}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted truncate max-w-[120px] sm:max-w-[180px]">
                            {coin.mint}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 text-center">
                      <ChainBadge chain={coin.chain || activeChain} />
                    </td>

                    <td className="py-4 text-right font-semibold text-ink">
                      ${coin.priceUSD < 0.01 ? coin.priceUSD.toFixed(7) : coin.priceUSD.toFixed(4)}
                    </td>

                    <td className="py-4 text-right">
                      <span
                        className={`inline-flex items-center font-bold ${
                          coin.priceChange24h >= 0 ? 'text-brand' : 'text-down'
                        }`}
                      >
                        {coin.priceChange24h >= 0 ? '+' : ''}
                        {coin.priceChange24h.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-4 text-right hidden md:table-cell text-muted">
                      {formatUSD(coin.volume24hUSD)}
                    </td>

                    <td className="py-4 text-center">
                      <ConfidenceBadge score={coin.confidenceScore} label={coin.confidenceLabel} />
                    </td>

                    <td className="py-4 pr-4 sm:pr-6 text-right">
                      <button
                        onClick={() =>
                          setSelectedCoin({
                            mint: coin.mint,
                            name: coin.name,
                            symbol: coin.symbol,
                            chain: coin.chain,
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand border border-brand/25 transition text-xs font-semibold cursor-pointer"
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

      {selectedCoin && (
        <TopTradersModal
          mint={selectedCoin.mint}
          tokenName={selectedCoin.name}
          tokenSymbol={selectedCoin.symbol}
          chain={selectedCoin.chain}
          isOpen={true}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </div>
  );
}
