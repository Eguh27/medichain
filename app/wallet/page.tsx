'use client';
import { useEffect, useState } from 'react';
import { Transaction, WalletData } from '@/types';

type WalletResponse = {
  wallets: WalletData[];
};

type WalletActionResponse = {
  success: boolean;
  wallet?: WalletData;
  tx?: Transaction;
  error?: string;
};

export default function WalletPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selected, setSelected] = useState<WalletData | null>(null);
  const [form, setForm] = useState({ to: '', amount: '' });
  const [newOwner, setNewOwner] = useState('');
  const [msg, setMsg] = useState('');

  const fetchWallets = async (selectedAddress?: string) => {
    const res = await fetch('/api/wallet');
    const data = await res.json() as WalletResponse;
    setWallets(data.wallets);
    if (selectedAddress) {
      setSelected(data.wallets.find((w) => w.address === selectedAddress) ?? null);
    }
  };

  const handleTransfer = async () => {
    if (!selected) return;
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer', fromAddress: selected.address, toAddress: form.to, amount: form.amount }),
    });
    const data = await res.json() as WalletActionResponse;
    setMsg(data.success ? '✅ Transfer berhasil!' : `❌ ${data.error}`);
    fetchWallets(selected.address);
  };

  const handleCreate = async () => {
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', owner: newOwner }),
    });
    const data = await res.json() as WalletActionResponse;
    setMsg(data.success ? '✅ Wallet berhasil dibuat dan didanai dari Hospital!' : `❌ ${data.error}`);
    if (data.success) setNewOwner('');
    fetchWallets(selected?.address);
  };

  useEffect(() => {
    const loadWallets = async () => {
      await fetchWallets();
    };

    loadWallets();
  }, []);

  const txBadge = (type: string) => {
    if (type === 'coinbase') return 'bg-yellow-900 text-yellow-300';
    if (type === 'transfer') return 'bg-blue-900 text-blue-300';
    return 'bg-green-900 text-green-300';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">👛 MED Coin Wallet</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {wallets.map((w) => (
            <div key={w.address} onClick={() => setSelected(w)}
              className={`cursor-pointer rounded-xl p-5 border transition ${selected?.address === w.address ? 'border-cyan-500 bg-slate-700' : 'border-slate-700 bg-slate-800 hover:bg-slate-700'}`}>
              <p className="font-semibold text-lg">{w.owner}</p>
              <p className="text-xs font-mono text-slate-400 mt-1">{w.address}</p>
              <p className="text-2xl font-bold text-yellow-400 mt-3">{w.balance.toLocaleString()} <span className="text-sm">MED</span></p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selected && (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="font-semibold mb-4">💸 Transfer dari {selected.owner}</h2>
              <input placeholder="Alamat tujuan" value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-cyan-500" />
              <input placeholder="Jumlah MED" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-cyan-500" />
              <button onClick={handleTransfer} className="w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg font-semibold transition">Kirim MED</button>
              {msg && <p className="text-sm mt-3 text-slate-300">{msg}</p>}
            </div>
          )}

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="font-semibold mb-4">➕ Buat Wallet Baru</h2>
            <input placeholder="Nama pemilik" value={newOwner} onChange={e => setNewOwner(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-cyan-500" />
            <button onClick={handleCreate} className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-semibold transition">Buat Wallet</button>
          </div>
        </div>

        {selected && selected.transactions?.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold mb-4">📋 Riwayat Transaksi — {selected.owner}</h2>
            <div className="space-y-2">
              {selected.transactions.map((tx) => (
                <div key={tx.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex justify-between items-center text-sm">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-3 ${txBadge(tx.type)}`}>{tx.type.toUpperCase()}</span>
                    <span className="text-slate-400">{tx.from} → {tx.to}</span>
                  </div>
                  <span className="text-yellow-400 font-semibold">{tx.amount} MED</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
