export interface PatientRecord {
  patientId: string;
  age: number;
  gender: string;
  condition: string;
  procedure: string;
  cost: number;
  lengthOfStay: number;
  readmission: string;
  outcome: string;
  satisfaction: number;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  type: 'coinbase' | 'transfer' | 'payment';
  timestamp: string;
  blockIndex?: number;
}

export interface Block {
  index: number;
  timestamp: string;
  data: PatientRecord;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  minedBy?: string;
  revisionOf?: number;
  revisionReason?: string;
}

export interface WalletData {
  address: string;
  owner: string;
  balance: number;
  transactions: Transaction[];
}

export interface ContractResult {
  contractName: string;
  triggered: boolean;
  action: string;
  value: number;
}
