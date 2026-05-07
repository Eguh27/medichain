'use client';

import { useEffect, useState } from 'react';
import { allContracts, executeContracts, ContractResult } from '@/lib/smartContract';
import { Block } from '@/types';

type BlockchainResponse = {
  chain: Block[];
};

type ExecutionLog = {
  block: Block;
  results: ContractResult[];
};

export default function ContractsPage() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  const fetchContractLogs = async () => {
    const res = await fetch('/api/blockchain');
    const data = await res.json() as BlockchainResponse;
    const executionLogs = data.chain
      .filter((block) => block.index > 0)
      .map((block) => ({
        block,
        results: executeContracts(block).filter((result) => result.triggered),
      }))
      .filter((log) => log.results.length > 0);

    setLogs(executionLogs.reverse());
  };

  useEffect(() => {
    const loadLogs = async () => {
      await fetchContractLogs();
    };

    loadLogs();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">📜 Smart Contracts</h1>

        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {allContracts.map((contract) => (
            <div key={contract.id} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">{contract.name}</h2>
                <span className="rounded-full bg-green-900 px-2.5 py-1 text-xs font-semibold text-green-300">
                  ACTIVE
                </span>
              </div>
              <p className="mb-4 text-sm text-slate-300">{contract.description}</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-slate-400">Trigger:</span>{' '}
                  <span className="font-mono text-cyan-300">{contract.condition}</span>
                </p>
                <p>
                  <span className="text-slate-400">Aksi:</span>{' '}
                  <span className="text-yellow-300">{contract.action}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-200">Contract Execution Log</h2>
          <div className="space-y-3">
            {logs.map(({ block, results }) => (
              <div key={block.index} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{block.data.patientId}</p>
                    <p className="text-xs font-mono text-slate-500">Block #{block.index}</p>
                  </div>
                  <p className="text-sm text-slate-400">{new Date(block.timestamp).toLocaleString('id-ID')}</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {results.map((result) => (
                    <div key={result.contractName} className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <p className="font-semibold text-cyan-300">{result.contractName}</p>
                      <p className="text-sm text-slate-300">{result.action}</p>
                      <p className={`mt-2 text-sm font-semibold ${result.contractName === 'ReadmissionAlert' ? 'text-red-300' : 'text-green-300'}`}>
                        {result.contractName === 'ReadmissionAlert' ? '+' : '-'}
                        {result.value.toLocaleString()} MED
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center text-slate-500">
                Belum ada smart contract yang ter-trigger.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
