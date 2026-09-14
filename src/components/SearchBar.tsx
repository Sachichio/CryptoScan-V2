import React, { useState } from 'react';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
}

export default function SearchBar({ initialValue = '', placeholder = 'Masukkan alamat wallet Solana (contoh: 5Q544f...)' }: SearchBarProps) {
  const [address, setAddress] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddress = address.trim();

    if (!cleanAddress) {
      setError('Silakan masukkan alamat wallet Solana terlebih dahulu.');
      return;
    }

    // Validasi panjang standar public key Solana (biasanya 32 - 44 karakter base58)
    if (cleanAddress.length < 32 || cleanAddress.length > 44) {
      setError('Alamat wallet Solana biasanya memiliki panjang antara 32-44 karakter.');
      return;
    }

    setError('');
    // Navigasikan langsung ke halaman detail profil wallet
    window.location.href = `/wallet/${cleanAddress}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            className="w-full px-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500/70 shadow-inner font-mono text-sm transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Cari Wallet</span>
        </button>
      </form>
      {error && (
        <p className="mt-2.5 text-rose-400 text-xs sm:text-sm flex items-center gap-1.5 animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}