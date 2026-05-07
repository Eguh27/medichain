'use client';
import { useEffect, useState } from 'react';
import { Block, PatientRecord } from '@/types';

type PatientForm = {
  patientId: string;
  age: string;
  gender: string;
  condition: string;
  procedure: string;
  cost: string;
  lengthOfStay: string;
  readmission: string;
  outcome: string;
  satisfaction: string;
};

type BlockchainResponse = {
  chain: Block[];
  isValid: boolean;
};

const emptyForm: PatientForm = {
  patientId: '',
  age: '',
  gender: '',
  condition: '',
  procedure: '',
  cost: '',
  lengthOfStay: '',
  readmission: '',
  outcome: '',
  satisfaction: '',
};

const blockToForm = (block: Block): PatientForm => ({
  patientId: block.data.patientId,
  age: String(block.data.age),
  gender: block.data.gender,
  condition: block.data.condition,
  procedure: block.data.procedure,
  cost: String(block.data.cost),
  lengthOfStay: String(block.data.lengthOfStay),
  readmission: block.data.readmission,
  outcome: block.data.outcome,
  satisfaction: String(block.data.satisfaction),
});

const formToPatientRecord = (form: PatientForm): PatientRecord => ({
  patientId: form.patientId,
  age: Number(form.age),
  gender: form.gender,
  condition: form.condition,
  procedure: form.procedure,
  cost: Number(form.cost),
  lengthOfStay: Number(form.lengthOfStay),
  readmission: form.readmission,
  outcome: form.outcome,
  satisfaction: Number(form.satisfaction),
});

const revisionLockedFields = new Set<keyof PatientForm>(['patientId']);

const fieldLabels: Record<keyof PatientForm, string> = {
  patientId: 'Patient ID',
  age: 'Age (Tahun)',
  gender: 'Gender',
  condition: 'Condition/Kondisi',
  procedure: 'Procedure/Prosedur',
  cost: 'Cost (MED Coins)',
  lengthOfStay: 'Length of Stay (Hari)',
  readmission: 'Readmission',
  outcome: 'Outcome/Hasil',
  satisfaction: 'Satisfaction (1-10)',
};

const generatePatientId = (): string => {
  return `PAT_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export default function BlockchainPage() {
  const [chain, setChain] = useState<Block[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [revisionForm, setRevisionForm] = useState<PatientForm>(emptyForm);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionBlock, setRevisionBlock] = useState<Block | null>(null);
  const [showRevisionConfirm, setShowRevisionConfirm] = useState(false);
  const [mining, setMining] = useState(false);
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [useExisting, setUseExisting] = useState(false);

  const fetchChain = async () => {
    const res = await fetch('/api/blockchain');
    const data = await res.json() as BlockchainResponse;
    setChain([...data.chain].reverse());
    setIsValid(data.isValid);
    
    // Extract unique patient IDs from blockchain
    const uniqueIds = Array.from(new Set(data.chain.map(b => b.data.patientId).filter(id => id !== 'GENESIS')));
    setPatientIds(uniqueIds);
  };

  const handlePatientSelect = (patientId: string) => {
    const block = chain.find(b => b.data.patientId === patientId);
    if (block) {
      setForm(blockToForm(block));
      setUseExisting(true);
    }
  };

  const handleNewPatient = () => {
    setForm({
      ...emptyForm,
      patientId: generatePatientId(),
    });
    setUseExisting(false);
  };

  const handleAdd = async () => {
    // Generate patient ID if not already set
    const finalForm = form.patientId ? form : { ...form, patientId: generatePatientId() };
    
    setMining(true);
    await fetch('/api/blockchain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: formToPatientRecord(finalForm),
        minerAddress: 'HOSPITAL',
      }),
    });
    setMining(false);
    handleNewPatient();
    fetchChain();
  };

  const openRevisionModal = (block: Block) => {
    setRevisionBlock(block);
    setRevisionForm(blockToForm(block));
    setRevisionReason('');
  };

  const handleRevisionMine = async () => {
    if (!revisionBlock) return;

    const revisionData = {
      ...formToPatientRecord(revisionForm),
      patientId: revisionBlock.data.patientId,
    };

    setMining(true);
    await fetch('/api/blockchain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: revisionData,
        minerAddress: 'HOSPITAL',
        revisionOf: revisionBlock.index,
        revisionReason: revisionReason || `Revision of block #${revisionBlock.index}`,
      }),
    });
    setMining(false);
    setShowRevisionConfirm(false);
    setRevisionBlock(null);
    setRevisionReason('');
    fetchChain();
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchChain();
      // Generate new patient ID on client side only (avoids hydration mismatch)
      setForm(prev => ({
        ...prev,
        patientId: generatePatientId(),
      }));
    };

    loadData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">⛓️ Blockchain Explorer</h1>
          <span className={`px-4 py-1 rounded-full text-sm font-semibold ${isValid ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
            {isValid ? '✅ CHAIN VALID' : '❌ CHAIN INVALID'}
          </span>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 mb-8 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">➕ Tambah / Edit Patient Record</h2>
          
          {/* Patient ID Selection */}
          <div className="mb-6 space-y-3">
            <p className="text-sm text-slate-400 font-semibold">Pilih Tipe Input:</p>
            <div className="flex gap-3">
              <button
                onClick={handleNewPatient}
                className={`px-4 py-2 rounded-lg font-semibold transition ${!useExisting ? 'bg-cyan-600 text-white' : 'bg-slate-700 border border-slate-600 text-slate-300 hover:border-cyan-500'}`}
              >
                ➕ Patient Baru
              </button>
              {patientIds.length > 0 && (
                <button
                  onClick={() => setUseExisting(true)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${useExisting ? 'bg-cyan-600 text-white' : 'bg-slate-700 border border-slate-600 text-slate-300 hover:border-cyan-500'}`}
                >
                  📋 Edit Existing
                </button>
              )}
            </div>
          </div>

          {useExisting && patientIds.length > 0 ? (
            <div className="mb-6">
              <label className="text-xs text-slate-400 mb-2 block">Pilih Patient ID:</label>
              <select
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Pilih Patient --</option>
                {patientIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4 rounded-lg bg-slate-700 border border-slate-600 p-3">
              <p className="text-xs text-slate-400 mb-1">Patient ID (Auto-Generated)</p>
              <p className="font-mono text-sm text-cyan-400">{form.patientId || 'Belum di-generate'}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(form).map((key) => {
              if (key === 'patientId') return null;
              const fieldKey = key as keyof PatientForm;
              return (
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1 block">{fieldLabels[fieldKey]}</label>
                  <input 
                    placeholder={fieldLabels[fieldKey]}
                    value={form[fieldKey]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" 
                  />
                </div>
              );
            })}
          </div>
          <button 
            onClick={handleAdd} 
            disabled={mining || !form.patientId}
            suppressHydrationWarning
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-6 py-2 rounded-lg font-semibold transition"
          >
            {mining ? '⛏️ Mining Block...' : '⛏️ Mine Block'}
          </button>
        </div>

        <div className="space-y-4">
          {chain.map((block) => (
            <div key={block.index} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-cyan-400 font-bold text-lg">Block #{block.index}</span>
                    {block.revisionOf !== undefined && (
                      <span className="rounded-full bg-purple-900 px-2 py-0.5 text-xs font-semibold text-purple-300">
                        Revision of #{block.revisionOf}
                      </span>
                    )}
                  </div>
                  {block.revisionReason && (
                    <p className="mt-1 text-xs text-slate-400">Reason: {block.revisionReason}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-xs font-mono text-slate-400">{new Date(block.timestamp).toLocaleString('id-ID')}</span>
                  {block.index > 0 && (
                    <button
                      onClick={() => openRevisionModal(block)}
                      className="mt-2 rounded-lg border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
                    >
                      Revisi
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                <div><span className="text-slate-400">Patient ID:</span> <span className="text-white">{block.data.patientId}</span></div>
                <div><span className="text-slate-400">Condition:</span> <span className="text-white">{block.data.condition}</span></div>
                <div><span className="text-slate-400">Procedure:</span> <span className="text-white">{block.data.procedure}</span></div>
                <div><span className="text-slate-400">Cost:</span> <span className="text-yellow-400">{block.data.cost} MED</span></div>
                <div><span className="text-slate-400">Outcome:</span> <span className="text-white">{block.data.outcome}</span></div>
                <div><span className="text-slate-400">Nonce:</span> <span className="text-purple-400">{block.nonce}</span></div>
              </div>
              <div className="text-xs font-mono space-y-1">
                <p><span className="text-slate-500">Hash: </span><span className="text-green-400">{block.hash}</span></p>
                <p><span className="text-slate-500">Prev: </span><span className="text-slate-400">{block.previousHash}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {revisionBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-cyan-400">Revisi Block #{revisionBlock.index}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Block lama tidak diubah. Sistem akan menambang block revisi baru.
                </p>
              </div>
              <button
                onClick={() => setRevisionBlock(null)}
                className="rounded-lg border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-semibold transition hover:bg-slate-600"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(revisionForm).map((key) => {
                const field = key as keyof PatientForm;
                const isLocked = revisionLockedFields.has(field);

                return (
                  <div key={key}>
                    <label className="text-xs text-slate-400 mb-1 block">{fieldLabels[field]}</label>
                    <input
                      placeholder={fieldLabels[field]}
                      value={revisionForm[field]}
                      disabled={isLocked}
                      onChange={e => setRevisionForm({ ...revisionForm, [key]: e.target.value })}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 ${isLocked ? 'cursor-not-allowed border-slate-700 bg-slate-900 text-slate-500' : 'border-slate-600 bg-slate-700 text-white'}`}
                    />
                    {isLocked && (
                      <p className="mt-1 text-xs text-slate-500">🔒 Terkunci (tidak dapat diubah)</p>
                    )}
                  </div>
                );
              })}
            </div>

            <textarea
              placeholder="Alasan revisi"
              value={revisionReason}
              onChange={e => setRevisionReason(e.target.value)}
              className="mt-3 min-h-24 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />

            <button
              onClick={() => setShowRevisionConfirm(true)}
              disabled={mining}
              className="mt-4 rounded-lg bg-purple-600 px-6 py-2 font-semibold transition hover:bg-purple-500 disabled:opacity-50"
            >
              Mining Revision Block
            </button>
          </div>
        </div>
      )}

      {showRevisionConfirm && revisionBlock && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-2xl">
            <h2 className="mb-3 text-lg font-semibold text-cyan-400">Konfirmasi Revisi Block</h2>
            <p className="mb-4 text-sm text-slate-300">
              Yakin ingin menambang block revisi baru untuk Block #{revisionBlock.index}? Block lama akan tetap tersimpan sebagai riwayat immutable.
            </p>
            <div className="mb-5 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-300">
              <p>Patient ID: <span className="text-white">{revisionBlock.data.patientId}</span></p>
              <p>Condition baru: <span className="text-white">{revisionForm.condition}</span></p>
              <p>Miner: <span className="text-cyan-300">HOSPITAL</span></p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRevisionConfirm(false)}
                className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-semibold transition hover:bg-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleRevisionMine}
                disabled={mining}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-500 disabled:opacity-50"
              >
                {mining ? 'Mining...' : 'Konfirmasi Mining'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
