import React, { useState } from 'react';
import type { ChainId } from '../types/index';
import { detectChain, CHAINS_CONFIG } from '../lib/chains/index';
import ChainBadge from './ChainBadge';

type ChainFilter = 'auto' | ChainId;

export default function SearchBar() {
  const [address, setAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState<ChainFilter>('auto');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const detectedChain = detectChain(address);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddress = address.trim();

    if (!cleanAddress) {
      setError('Silakan masukkan alamat wallet');
      return;
    }

    const finalChain = selectedChain !== 'auto' ? selectedChain : detectedChain;

    if (finalChain === 'unknown') {
      setError('Alamat tidak valid. Masukkan alamat Solana atau EVM (0x...)');
      return;
    }

    // Validasi kompatibilitas format alamat jika user memilih chain tertentu
    if (selectedChain === 'solana' && cleanAddress.startsWith('0x')) {
      setError('Alamat EVM (0x...) tidak kompatibel dengan jaringan Solana.');
      return;
    }
    if (selectedChain !== 'auto' && selectedChain !== 'solana' && !cleanAddress.startsWith('0x')) {
      setError(`Alamat Solana tidak kompatibel dengan jaringan ${CHAINS_CONFIG[selectedChain]?.name || selectedChain}.`);
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Navigasi ke rute wallet profil dengan parameter chain jika dipilih secara eksplisit
    let targetUrl = `/wallet/${cleanAddress}`;
    if (selectedChain !== 'auto') {
      targetUrl += `?chain=${selectedChain}`;
    }
    window.location.href = targetUrl;
  };

  const chainButtons: { id: ChainFilter; label: string; icon: string; activeClass: string }[] = [
    { id: 'auto', label: 'Auto Detect', icon: '⚡', activeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' },
    { id: 'solana', label: 'SOL', icon: '◎', activeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm' },
    { id: 'ethereum', label: 'ETH', icon: '⟠', activeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm' },
    { id: 'bsc', label: 'BNB', icon: '⬡', activeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm' },
    { id: 'base', label: 'BASE', icon: '🔷', activeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40 shadow-sm' },
    { id: 'arbitrum', label: 'ARB', icon: '🔵', activeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-sm' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Chain Selector Pills */}
      <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
        {chainButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => {
              setSelectedChain(btn.id);
              if (error) setError('');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 border ${
              selectedChain === btn.id
                ? btn.activeClass
                : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="relative flex items-center">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              selectedChain === 'solana'
                ? "Masukkan alamat wallet Solana (Base58)..."
                : selectedChain !== 'auto'
                ? `Masukkan alamat wallet ${CHAINS_CONFIG[selectedChain]?.name} (0x...)...`
                : "Masukkan alamat wallet SOL, ETH, BNB, BASE, ARB (0x...)..."
            }
            className="w-full pl-11 pr-32 py-3.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition shadow-lg"
          />

          {/* Ikon Pencarian Kiri */}
          <div className="absolute left-4 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Badge Deteksi Jaringan Live & Tombol Submit */}
          <div className="absolute right-2 flex items-center gap-2">
            {(selectedChain !== 'auto' || detectedChain !== 'unknown') && (
              <div className="hidden sm:flex items-center animate-fade-in">
                <ChainBadge chain={selectedChain !== 'auto' ? selectedChain : (detectedChain as ChainId)} />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Scan</span>
                  <span className="hidden sm:inline">→</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pesan Error */}
        {error && (
          <p className="absolute -bottom-6 left-2 text-xs text-rose-400 font-mono">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}