'use client';
import { useEffect, useState } from 'react';

type PatientBlock = {
  index: number;
  data: {
    patientId: string;
    condition: string;
    procedure: string;
    lengthOfStay: number;
    outcome: string;
    cost: number;
  };
};

type Wallet = {
  address: string;
  owner: string;
  balance: number;
};

type BlockchainResponse = {
  chain: PatientBlock[];
};

type WalletResponse = {
  wallets: Wallet[];
};

const shortenAddress = (address: string) => {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

export default function PaymentPage() {
  const [chain, setChain] = useState<PatientBlock[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [paid, setPaid] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [pendingBlock, setPendingBlock] = useState<PatientBlock | null>(null);
  const selectedWalletData = wallets.find((w) => w.address === selectedWallet);

  const fetchData = async () => {
    const [chainRes, walletRes] = await Promise.all([fetch('/api/blockchain'), fetch('/api/wallet')]);
    const chainData = await chainRes.json() as BlockchainResponse;
    const walletData = await walletRes.json() as WalletResponse;
    setChain(chainData.chain.filter((b) => b.index > 0));
    setWallets(walletData.wallets);
  };

  const handlePay = async (block: PatientBlock) => {
    if (!selectedWallet) return setMsg('❌ Pilih wallet dulu!');
    setPendingBlock(null);
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromAddress: selectedWallet, patientId: block.data.patientId, amount: block.data.cost }),
    });
    const data = await res.json();
    if (data.success) {
      setPaid([...paid, block.data.patientId]);
      setMsg(`✅ Pembayaran ${block.data.cost} MED untuk ${block.data.patientId} berhasil!`);
    } else {
      setMsg(`❌ ${data.error}`);
    }
    fetchData();
  };

  const requestPaymentConfirmation = (block: PatientBlock) => {
    if (!selectedWallet) return setMsg('❌ Pilih wallet dulu!');
    setPendingBlock(block);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">💳 Payment Center</h1>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-8">
          <h2 className="font-semibold mb-3">Pilih Wallet Pembayar</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((w) => (
              <button
                key={w.address}
                onClick={() => setSelectedWallet(w.address)}
                className={`rounded-xl border p-4 text-left transition ${selectedWallet === w.address ? 'border-cyan-500 bg-slate-700 ring-2 ring-cyan-500/30' : 'border-slate-600 bg-slate-700/70 hover:border-cyan-600 hover:bg-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{w.owner}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{shortenAddress(w.address)}</p>
                  </div>
                  {selectedWallet === w.address && (
                    <span className="rounded-full bg-cyan-900 px-2 py-1 text-xs font-semibold text-cyan-300">Dipilih</span>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-slate-900/70 px-3 py-2">
                  <p className="text-xs text-slate-400">Saldo tersedia</p>
                  <p className="text-lg font-bold text-yellow-400">{w.balance} MED</p>
                </div>
              </button>
            ))}
          </div>
          {msg && <p className="mt-3 text-sm text-slate-300">{msg}</p>}
        </div>

        <div className="space-y-3">
          {chain.map((block) => {
            const isPaid = paid.includes(block.data.patientId);
            return (
              <div key={block.index} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{block.data.patientId}</p>
                  <p className="text-slate-400 text-sm">{block.data.condition} — {block.data.procedure}</p>
                  <p className="text-slate-500 text-xs">Stay: {block.data.lengthOfStay} hari | Outcome: {block.data.outcome}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold text-lg">{block.data.cost} MED</p>
                  {isPaid ? (
                    <span className="px-3 py-1 rounded-full text-xs bg-green-900 text-green-300">✅ PAID</span>
                  ) : (
                    <button onClick={() => requestPaymentConfirmation(block)}
                      className="mt-2 px-4 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold transition">
                      Bayar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pendingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-cyan-400 mb-3">Konfirmasi Pembayaran</h2>
            <p className="text-sm text-slate-300 mb-4">
              Yakin ingin membayar {pendingBlock.data.cost} MED untuk pasien {pendingBlock.data.patientId}?
            </p>
            <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300 mb-5">
              <p>Wallet: <span className="text-white">{selectedWalletData?.owner ?? selectedWallet}</span></p>
              <p>Address: <span className="font-mono text-white">{shortenAddress(selectedWallet)}</span></p>
              <p>Saldo: <span className="text-yellow-400">{selectedWalletData?.balance ?? 0} MED</span></p>
              <p>Procedure: <span className="text-white">{pendingBlock.data.procedure}</span></p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPendingBlock(null)}
                className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 text-sm font-semibold transition"
              >
                Batal
              </button>
              <button
                onClick={() => handlePay(pendingBlock)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm font-semibold transition"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
