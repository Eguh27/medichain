'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Block, WalletData } from '@/types';

interface Stats {
  totalBlocks: number;
  isValid: boolean;
  circulatingMED: number;
  totalWallets: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);

  const fetchData = async () => {
    const [chainRes, walletRes] = await Promise.all([
      fetch('/api/blockchain'),
      fetch('/api/wallet'),
    ]);
    const chainData = await chainRes.json() as { chain: Block[]; length: number; isValid: boolean };
    const walletData = await walletRes.json() as { wallets: WalletData[] };

    const circulating = walletData.wallets.reduce(
      (sum, w) => sum + w.balance, 0
    );

    setStats({
      totalBlocks: chainData.length,
      isValid: chainData.isValid,
      circulatingMED: circulating,
      totalWallets: walletData.wallets.length,
    });

    setRecentBlocks(chainData.chain.slice(-5).reverse());
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-cyan-400">🏥 MedChain</h1>
          <p className="text-slate-400 mt-1">Hospital Blockchain System — Powered by MED Coin</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Blocks', value: stats.totalBlocks, color: 'text-cyan-400' },
              { label: 'Chain Status', value: stats.isValid ? '✅ VALID' : '❌ INVALID', color: stats.isValid ? 'text-green-400' : 'text-red-400' },
              { label: 'Circulating MED', value: `${stats.circulatingMED.toLocaleString()} MED`, color: 'text-yellow-400' },
              { label: 'Active Wallets', value: stats.totalWallets, color: 'text-purple-400' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-400 text-sm">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Recent Blocks</h2>
          <div className="space-y-2">
            {recentBlocks.map((block) => (
              <div key={block.index} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <span className="text-cyan-400 font-mono font-bold">Block #{block.index}</span>
                  <span className="ml-4 text-slate-300">{block.data.condition}</span>
                  <span className="ml-4 text-slate-500 text-sm">Patient: {block.data.patientId}</span>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs font-mono">{block.hash.slice(0, 16)}...</p>
                  <p className="text-slate-500 text-xs">{new Date(block.timestamp).toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { href: '/blockchain', label: '⛓️ Blockchain', desc: 'Lihat semua blok' },
            { href: '/patients', label: '🏥 Patients', desc: 'Data rekam medis' },
            { href: '/wallet', label: '👛 Wallet', desc: 'MED coin wallet' },
            { href: '/payment', label: '💳 Payment', desc: 'Bayar tagihan' },
            { href: '/contracts', label: '📜 Contracts', desc: 'Smart contract log' },
          ].map((nav) => (
            <Link key={nav.href} href={nav.href}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-5 transition">
              <p className="text-lg font-semibold">{nav.label}</p>
              <p className="text-slate-400 text-sm mt-1">{nav.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
