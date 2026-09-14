import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  label?: 'safe' | 'caution' | 'danger';
}

/**
 * Komponen Badge untuk menampilkan Confidence Score (1-10) dengan visualisasi warna
 * 8-10: Hijau (Aman)
 * 5-7: Kuning (Hati-hati)
 * 1-4: Merah (Berbahaya/Risiko Tinggi)
 */
export default function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  // Tentukan warna berdasarkan skor
  let bgClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  let dotClass = 'bg-amber-400';
  let textLabel = 'Hati-hati';

  if (score >= 8 || label === 'safe') {
    bgClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotClass = 'bg-emerald-400';
    textLabel = 'Aman';
  } else if (score <= 4 || label === 'danger') {
    bgClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    dotClass = 'bg-rose-400';
    textLabel = 'Bahaya';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold ${bgClass} transition`}
      title={`Confidence Score: ${score}/10 (${textLabel})`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
      <span>{score}/10</span>
      <span className="hidden sm:inline font-sans text-[11px] font-normal opacity-90">
        • {textLabel}
      </span>
    </div>
  );
}
