import React from 'react';
import type { Transaction, ChainId } from '../types/index';
import { formatRelativeTime, shortenAddress } from '../lib/utils';
import { CHAINS_CONFIG } from '../lib/chains/index';

interface TransactionListProps {
  transactions: Transaction[];
  address: string;
  chain?: ChainId;
  nativeSymbol?: string;
}

export default function TransactionList({
  transactions,
  address,
  chain = 'solana',
  nativeSymbol = 'SOL',
}: TransactionListProps) {
  const chainMeta = CHAINS_CONFIG[chain] || CHAINS_CONFIG.solana;
  const explorerBase = chainMeta.explorerUrl || 'https://solscan.io';
  const explorerDomain = explorerBase.replace(/^https?:\/\//, '');

  const accountUrl =
    chain === 'solana'
      ? `${explorerBase}/account/${address}#transfers`
      : `${explorerBase}/address/${address}`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Riwayat Transaksi Terkini</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            10 aktivitas transaksi terakhir yang dikonfirmasi di blockchain {chainMeta.name}.
          </p>
        </div>

        <a
          href={accountUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-teal-400 hover:text-teal-300 transition flex items-center gap-1 font-mono"
        >
          <span>Lihat di {explorerDomain}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl">
          <p>Belum ada riwayat transaksi yang ditemukan untuk wallet ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-3 px-4">Signature / Hash Transaksi</th>
                <th className="py-3 px-4">Jenis Aktivitas</th>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Biaya Gas ({nativeSymbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm font-mono">
              {transactions.map((tx) => (
                <tr key={tx.signature} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-xs text-slate-300">
                    <a
                      href={`${explorerBase}/tx/${tx.signature}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-400 hover:underline decoration-teal-500/50 flex items-center gap-1.5"
                      title={tx.signature}
                    >
                      <span>{shortenAddress(tx.signature, 8)}</span>
                      <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-slate-300">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 font-sans">
                    {formatRelativeTime(tx.blockTime)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {tx.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" />
                        Sukses
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <span className="w-1 h-1 rounded-full bg-rose-400" />
                        Gagal
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-slate-400">
                    {tx.fee} {nativeSymbol}
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