import CryptoJS from 'crypto-js';
import { Block, PatientRecord, Transaction } from '@/types';
import fs from 'fs';
import path from 'path';
import { getAllBlocks, saveBlock } from './db';
import medcoin from './medcoin';
import { parseCSV } from './csvParser';

type AddBlockOptions = {
  revisionOf?: number;
  revisionReason?: string;
};

class Blockchain {
  private chain: Block[];
  private difficulty: number;
  private pendingTransactions: Transaction[];
  private miningReward: number;

  constructor() {
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 10;
    this.chain = [];
    this.loadChainFromDB();

    if (this.chain.length === 0) {
      const genesisBlock = this.createGenesisBlock();
      this.chain = [genesisBlock];
      saveBlock(genesisBlock);
    }

    this.seedFromCSVIfNeeded();
  }

  private createGenesisBlock(): Block {
    const genesisData: PatientRecord = {
      patientId: 'GENESIS',
      age: 0,
      gender: '-',
      condition: 'Genesis Block',
      procedure: '-',
      cost: 0,
      lengthOfStay: 0,
      readmission: '-',
      outcome: '-',
      satisfaction: 0,
    };
    const block: Block = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: genesisData,
      transactions: [],
      previousHash: '0000000000000000',
      hash: '',
      nonce: 0,
    };
    block.hash = this.calculateHash(block);
    return block;
  }

  calculateHash(block: Block): string {
    return CryptoJS.SHA256(
      block.index +
      block.timestamp +
      JSON.stringify(block.data) +
      JSON.stringify(block.transactions) +
      block.previousHash +
      block.nonce +
      (block.revisionOf ?? '') +
      (block.revisionReason ?? '')
    ).toString();
  }

  mineBlock(block: Block): Block {
    while (!block.hash.startsWith('0'.repeat(this.difficulty))) {
      block.nonce++;
      block.hash = this.calculateHash(block);
    }
    return block;
  }

  addBlock(data: PatientRecord, minerAddress: string = 'HOSPITAL', options: AddBlockOptions = {}): Block {
    const previousBlock = this.chain[this.chain.length - 1];
    const blockIndex = this.chain.length;

    // Coinbase transaction — reward untuk miner
    const coinbaseTx = medcoin.processCoinbaseReward(minerAddress, this.miningReward, blockIndex);

    const newBlock: Block = {
      index: blockIndex,
      timestamp: new Date().toISOString(),
      data,
      transactions: [coinbaseTx, ...this.pendingTransactions],
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
      minedBy: minerAddress,
      revisionOf: options.revisionOf,
      revisionReason: options.revisionReason,
    };

    newBlock.hash = this.calculateHash(newBlock);
    const minedBlock = this.mineBlock(newBlock);

    this.chain.push(minedBlock);
    saveBlock(minedBlock);
    this.pendingTransactions = [];

    return minedBlock;
  }

  addPendingTransaction(tx: Transaction): void {
    this.pendingTransactions.push(tx);
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      const recalculated = this.calculateHash(current);
      if (current.hash !== recalculated) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }

  getChain(): Block[] {
    return this.chain;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  getBlockByIndex(index: number): Block | undefined {
    return this.chain[index];
  }

  getChainLength(): number {
    return this.chain.length;
  }

  loadChainFromDB(): void {
    this.chain = getAllBlocks();
  }

  private seedFromCSVIfNeeded(): void {
    const hasPatientBlocks = this.chain.some((block) => block.index > 0);
    if (hasPatientBlocks) return;

    const csvPath = path.join(process.cwd(), 'public', 'data', 'patients.csv');
    if (!fs.existsSync(csvPath)) return;

    const csvText = fs.readFileSync(csvPath, 'utf8');
    const records = parseCSV(csvText).slice(0, 50);
    records.forEach((record) => {
      this.addBlock(record, 'HOSPITAL');
    });
  }
}

// Singleton instance
const blockchain = new Blockchain();
export default blockchain;
