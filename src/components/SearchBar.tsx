import React, { useState } from 'react';
import type { ChainId } from '../types/index';
import { detectChain, CHAINS_CONFIG } from '../lib/chains/index';
import { ArrowRight } from './Icons';

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

    let targetUrl = `/wallet/${cleanAddress}`;
    if (selectedChain !== 'auto') {
      targetUrl += `?chain=${selectedChain}`;
    }
    window.location.href = targetUrl;
  };

  const chainButtons: { id: ChainFilter; label: string; icon: string }[] = [
    { id: 'auto', label: 'Otomatis', icon: '⚡' },
    { id: 'solana', label: 'Solana', icon: '◎' },
    { id: 'ethereum', label: 'Ethereum', icon: '⟠' },
    { id: 'bsc', label: 'BNB Chain', icon: '⬡' },
    { id: 'base', label: 'Base', icon: '🔷' },
    { id: 'arbitrum', label: 'Arbitrum', icon: '🔵' },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface/70 p-2.5 text-left shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
        
        {/* chain selector */}
        <div className="scrollbar-none flex items-center gap-1 overflow-x-auto px-1 pb-2.5 pt-0.5">
          {chainButtons.map((btn) => {
            const active = selectedChain === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setSelectedChain(btn.id);
                  if (error) setError('');
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
                  active
                    ? "bg-surface-3 text-ink font-semibold"
                    : "text-muted hover:bg-white/[0.04] hover:text-ink"
                }`}
              >
                {btn.icon !== '⚡' && (
                  <span
                    className="inline-block shrink-0 rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      background: 
                        btn.id === 'solana' ? '#a58be0' :
                        btn.id === 'ethereum' ? '#8fa2e0' :
                        btn.id === 'bsc' ? '#d9b25a' :
                        btn.id === 'base' ? '#6b93e8' :
                        '#6aaed8'
                    }}
                  />
                )}
                {btn.label}
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSearch}
          className={`group flex items-center gap-2 rounded-2xl border bg-bg/60 p-1.5 pl-4 transition-colors focus-within:border-brand/40 ${
            error ? "border-down/40" : "border-line"
          }`}
        >
          {/* Magnifying Glass Icon */}
          <svg width={18} height={18} fill="none" viewBox="0 0 24 24" className="shrink-0 text-muted transition-colors group-focus-within:text-brand">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35"></path>
          </svg>

          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (error) setError('');
            }}
            placeholder={
              selectedChain === 'solana'
                ? "Tempel alamat wallet Solana (Base58)..."
                : selectedChain !== 'auto'
                ? `Tempel alamat wallet ${CHAINS_CONFIG[selectedChain]?.name} (0x...)`
                : "Tempel alamat wallet SOL atau EVM (0x…)"
            }
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-ink placeholder:text-muted/60 focus:outline-none"
          />

          {address && (
            <>
              {detectedChain !== 'unknown' && (
                <span className="hidden sm:inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: CHAINS_CONFIG[detectedChain].color === 'emerald' ? '#5fb98e' : '#eceef0',
                    background: 'rgba(255,255,255,0.06)'
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: CHAINS_CONFIG[detectedChain].color === 'emerald' ? '#14F195' : '#627EEA' }} />
                  {CHAINS_CONFIG[detectedChain].shortName}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setAddress('');
                  setError('');
                }}
                className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink focus:outline-none"
                aria-label="Hapus"
              >
                <svg width={14} height={14} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 6 6 18M6 6l12 12"></path></svg>
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-[#0b1a13] transition-colors hover:bg-brand-soft active:scale-[0.98] disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b1a13]/25 border-t-[#0b1a13]" />
            ) : (
              <>
                Scan <ArrowRight width={15} height={15} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mx-auto mt-3 h-5 max-w-2xl px-3 text-left text-xs">
        {error ? (
          <span className="text-down">{error}</span>
        ) : (
          <span className="text-muted/70">Hanya membaca data publik — tidak perlu menghubungkan wallet.</span>
        )}
      </div>
    </div>
  );
}