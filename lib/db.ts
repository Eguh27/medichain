import Database from 'better-sqlite3';
import path from 'path';
import { Block, Transaction, WalletData } from '@/types';

type BlockRow = {
  block_index: number;
  timestamp: string;
  patient_id: string;
  age: number;
  gender: string;
  condition: string;
  procedure: string;
  cost: number;
  length_of_stay: number;
  readmission: string;
  outcome: string;
  satisfaction: number;
  previous_hash: string;
  hash: string;
  nonce: number;
  mined_by: string | null;
  revision_of: number | null;
  revision_reason: string | null;
  transactions: string;
};

type TransactionRow = {
  id: string;
  from_address: string;
  to_address: string;
  amount: number;
  type: Transaction['type'];
  timestamp: string;
  block_index: number | null;
};

type WalletRow = {
  address: string;
  owner: string;
  balance: number;
};

let db: Database.Database | null = null;

function getDB() {
  if (!db) {
    db = new Database(path.join(process.cwd(), 'hospital.db'));
    db.pragma('journal_mode = WAL');
    initializeTables(db);
  }

  return db;
}

function initializeTables(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_index INTEGER NOT NULL UNIQUE,
      timestamp TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      condition TEXT NOT NULL,
      procedure TEXT NOT NULL,
      cost REAL NOT NULL,
      length_of_stay INTEGER NOT NULL,
      readmission TEXT NOT NULL,
      outcome TEXT NOT NULL,
      satisfaction REAL NOT NULL,
      previous_hash TEXT NOT NULL,
      hash TEXT NOT NULL,
      nonce INTEGER NOT NULL,
      mined_by TEXT,
      revision_of INTEGER,
      revision_reason TEXT,
      transactions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      address TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      balance REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      block_index INTEGER
    );
  `);

  ensureColumn(database, 'blocks', 'revision_of', 'INTEGER');
  ensureColumn(database, 'blocks', 'revision_reason', 'TEXT');
}

function ensureColumn(database: Database.Database, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  const hasColumn = columns.some((item) => item.name === column);

  if (!hasColumn) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function saveBlock(block: Block) {
  const database = getDB();

  database.prepare(`
    INSERT INTO blocks (
      block_index, timestamp, patient_id, age, gender, condition, procedure, cost,
      length_of_stay, readmission, outcome, satisfaction, previous_hash, hash,
      nonce, mined_by, revision_of, revision_reason, transactions
    ) VALUES (
      @block_index, @timestamp, @patient_id, @age, @gender, @condition, @procedure, @cost,
      @length_of_stay, @readmission, @outcome, @satisfaction, @previous_hash, @hash,
      @nonce, @mined_by, @revision_of, @revision_reason, @transactions
    )
    ON CONFLICT(block_index) DO UPDATE SET
      timestamp = excluded.timestamp,
      patient_id = excluded.patient_id,
      age = excluded.age,
      gender = excluded.gender,
      condition = excluded.condition,
      procedure = excluded.procedure,
      cost = excluded.cost,
      length_of_stay = excluded.length_of_stay,
      readmission = excluded.readmission,
      outcome = excluded.outcome,
      satisfaction = excluded.satisfaction,
      previous_hash = excluded.previous_hash,
      hash = excluded.hash,
      nonce = excluded.nonce,
      mined_by = excluded.mined_by,
      revision_of = excluded.revision_of,
      revision_reason = excluded.revision_reason,
      transactions = excluded.transactions
  `).run({
    block_index: block.index,
    timestamp: block.timestamp,
    patient_id: block.data.patientId,
    age: block.data.age,
    gender: block.data.gender,
    condition: block.data.condition,
    procedure: block.data.procedure,
    cost: block.data.cost,
    length_of_stay: block.data.lengthOfStay,
    readmission: block.data.readmission,
    outcome: block.data.outcome,
    satisfaction: block.data.satisfaction,
    previous_hash: block.previousHash,
    hash: block.hash,
    nonce: block.nonce,
    mined_by: block.minedBy ?? null,
    revision_of: block.revisionOf ?? null,
    revision_reason: block.revisionReason ?? null,
    transactions: JSON.stringify(block.transactions),
  });
}

export function getAllBlocks(): Block[] {
  const rows = getDB()
    .prepare('SELECT * FROM blocks ORDER BY block_index ASC')
    .all() as BlockRow[];

  return rows.map((row) => ({
    index: row.block_index,
    timestamp: row.timestamp,
    data: {
      patientId: row.patient_id,
      age: row.age,
      gender: row.gender,
      condition: row.condition,
      procedure: row.procedure,
      cost: row.cost,
      lengthOfStay: row.length_of_stay,
      readmission: row.readmission,
      outcome: row.outcome,
      satisfaction: row.satisfaction,
    },
    transactions: JSON.parse(row.transactions) as Transaction[],
    previousHash: row.previous_hash,
    hash: row.hash,
    nonce: row.nonce,
    minedBy: row.mined_by ?? undefined,
    revisionOf: row.revision_of ?? undefined,
    revisionReason: row.revision_reason ?? undefined,
  }));
}

export function saveWallet(wallet: Pick<WalletData, 'address' | 'balance'> & Partial<Pick<WalletData, 'owner'>>) {
  const database = getDB();
  const current = database
    .prepare('SELECT owner FROM wallets WHERE address = ?')
    .get(wallet.address) as { owner: string } | undefined;

  database.prepare(`
    INSERT INTO wallets (address, owner, balance)
    VALUES (@address, @owner, @balance)
    ON CONFLICT(address) DO UPDATE SET
      owner = excluded.owner,
      balance = excluded.balance
  `).run({
    address: wallet.address,
    owner: wallet.owner ?? current?.owner ?? wallet.address,
    balance: wallet.balance,
  });
}

export function getAllWallets(): WalletData[] {
  const rows = getDB()
    .prepare('SELECT * FROM wallets ORDER BY rowid ASC')
    .all() as WalletRow[];

  return rows.map((row) => ({
    address: row.address,
    owner: row.owner,
    balance: row.balance,
    transactions: [],
  }));
}

export function saveTransaction(tx: Transaction) {
  getDB().prepare(`
    INSERT INTO transactions (id, from_address, to_address, amount, type, timestamp, block_index)
    VALUES (@id, @from_address, @to_address, @amount, @type, @timestamp, @block_index)
    ON CONFLICT(id) DO UPDATE SET
      from_address = excluded.from_address,
      to_address = excluded.to_address,
      amount = excluded.amount,
      type = excluded.type,
      timestamp = excluded.timestamp,
      block_index = excluded.block_index
  `).run({
    id: tx.id,
    from_address: tx.from,
    to_address: tx.to,
    amount: tx.amount,
    type: tx.type,
    timestamp: tx.timestamp,
    block_index: tx.blockIndex ?? null,
  });
}

export function getTransactionsByAddress(address: string): Transaction[] {
  const rows = getDB()
    .prepare(`
      SELECT * FROM transactions
      WHERE from_address = ? OR to_address = ?
      ORDER BY timestamp DESC
    `)
    .all(address, address) as TransactionRow[];

  return rows.map(rowToTransaction);
}

export function getAllTransactions(): Transaction[] {
  const rows = getDB()
    .prepare('SELECT * FROM transactions ORDER BY timestamp DESC')
    .all() as TransactionRow[];

  return rows.map(rowToTransaction);
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    from: row.from_address,
    to: row.to_address,
    amount: row.amount,
    type: row.type,
    timestamp: row.timestamp,
    blockIndex: row.block_index ?? undefined,
  };
}
