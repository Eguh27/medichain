'use client';
import { useEffect, useState } from 'react';
import { executeContracts } from '@/lib/smartContract';
import { Block } from '@/types';

type BlockchainResponse = {
  chain: Block[];
};

export default function PatientsPage() {
  const [chain, setChain] = useState<Block[]>([]);
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);

  const fetchChain = async () => {
    const res = await fetch('/api/blockchain');
    const data = await res.json() as BlockchainResponse;
    setChain(data.chain.filter((b) => b.index > 0));
  };

  useEffect(() => {
    const loadChain = async () => {
      await fetchChain();
    };

    loadChain();
  }, []);

  const filtered = chain.filter((b) =>
    b.data.patientId.toLowerCase().includes(search.toLowerCase()) ||
    b.data.condition.toLowerCase().includes(search.toLowerCase()) ||
    b.data.outcome.toLowerCase().includes(search.toLowerCase())
  );

  const outcomeBadge = (outcome: string) => {
    const o = outcome?.toLowerCase();
    if (o === 'recovered') return 'bg-green-900 text-green-300';
    if (o === 'deceased') return 'bg-red-900 text-red-300';
    return 'bg-yellow-900 text-yellow-300';
  };

  const selectedContractResults = selectedBlock
    ? executeContracts(selectedBlock).filter((result) => result.triggered)
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">🏥 Patient Records</h1>

        {/* Search */}
        <input
          placeholder="🔍 Cari patient ID, condition, outcome..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm mb-6 focus:outline-none focus:border-cyan-500"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Pasien', value: chain.length },
            { label: 'Recovered', value: chain.filter(b => b.data.outcome?.toLowerCase() === 'recovered').length },
            { label: 'Avg. Cost', value: chain.length ? `${Math.round(chain.reduce((s, b) => s + b.data.cost, 0) / chain.length)} MED` : '0 MED' },
            { label: 'Avg. Stay', value: chain.length ? `${(chain.reduce((s, b) => s + b.data.lengthOfStay, 0) / chain.length).toFixed(1)} hari` : '0 hari' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm">{s.label}</p>
              <p className="text-xl font-bold text-cyan-400 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-700 text-slate-300">
              <tr>
                {['Block', 'Patient ID', 'Age/Gender', 'Condition', 'Procedure', 'Cost', 'Stay', 'Outcome', 'Satisfaction'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((block) => (
                <tr
                  key={block.index}
                  onClick={() => setSelectedBlock(block)}
                  className="cursor-pointer border-t border-slate-700 hover:bg-slate-700/60 transition"
                >
                  <td className="px-4 py-3 text-cyan-400 font-mono">#{block.index}</td>
                  <td className="px-4 py-3 font-medium">{block.data.patientId}</td>
                  <td className="px-4 py-3 text-slate-300">{block.data.age} / {block.data.gender}</td>
                  <td className="px-4 py-3 text-slate-300">{block.data.condition}</td>
                  <td className="px-4 py-3 text-slate-300">{block.data.procedure}</td>
                  <td className="px-4 py-3 text-yellow-400 font-semibold">{block.data.cost} MED</td>
                  <td className="px-4 py-3 text-slate-300">{block.data.lengthOfStay}d</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${outcomeBadge(block.data.outcome)}`}>
                      {block.data.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">⭐ {block.data.satisfaction}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    Belum ada data. Seed data dulu dari dashboard!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBlock && (
        <div className="fixed inset-0 z-50 bg-black/60">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-cyan-400">{selectedBlock.data.patientId}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${outcomeBadge(selectedBlock.data.outcome)}`}>
                    {selectedBlock.data.outcome}
                  </span>
                </div>
                <p className="text-sm text-slate-400">Patient detail from block #{selectedBlock.index}</p>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                { label: 'Age', value: selectedBlock.data.age },
                { label: 'Gender', value: selectedBlock.data.gender },
                { label: 'Stay', value: `${selectedBlock.data.lengthOfStay} hari` },
                { label: 'Readmission', value: selectedBlock.data.readmission },
                { label: 'Satisfaction', value: `⭐ ${selectedBlock.data.satisfaction}` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="mt-1 font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="mb-3 font-semibold text-slate-200">Diagnosis & Treatment</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">Condition</p>
                  <p className="text-white">{selectedBlock.data.condition}</p>
                </div>
                <div>
                  <p className="text-slate-400">Procedure</p>
                  <p className="text-white">{selectedBlock.data.procedure}</p>
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="mb-3 font-semibold text-slate-200">Financial</h3>
              <p className="mb-4 text-2xl font-bold text-yellow-400">{selectedBlock.data.cost.toLocaleString()} MED</p>
              <div className="space-y-2">
                {selectedContractResults.map((result) => (
                  <div key={result.contractName} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm">
                    <p className="font-semibold text-cyan-300">
                      ✅ {result.contractName}: {result.action}
                    </p>
                    <p className={result.contractName === 'ReadmissionAlert' ? 'text-red-300' : 'text-green-300'}>
                      {result.contractName === 'ReadmissionAlert' ? '+' : '-'}
                      {result.value.toLocaleString()} MED
                    </p>
                  </div>
                ))}
                {selectedContractResults.length === 0 && (
                  <p className="text-sm text-slate-500">Tidak ada smart contract yang aktif untuk pasien ini.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <h3 className="mb-3 font-semibold text-slate-200">Blockchain Info</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-slate-400">Block index:</span> <span className="text-cyan-300">#{selectedBlock.index}</span></p>
                <p>
                  <span className="text-slate-400">Hash:</span>{' '}
                  <span className="break-all font-mono text-green-400">{selectedBlock.hash}</span>
                </p>
                <p><span className="text-slate-400">Timestamp:</span> <span className="text-white">{new Date(selectedBlock.timestamp).toLocaleString('id-ID')}</span></p>
                <p><span className="text-slate-400">Nonce:</span> <span className="text-purple-300">{selectedBlock.nonce}</span></p>
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
