import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';
import { getAllTransactions, getAllWallets, saveTransaction, saveWallet } from './db';

class MEDCoin {
  private balances: Map<string, number>;
  private transactionHistory: Transaction[];
  readonly totalSupply: number;

  constructor() {
    this.totalSupply = 1_000_000;
    this.transactionHistory = getAllTransactions().reverse();
    this.balances = new Map();

    getAllWallets().forEach((wallet) => {
      this.balances.set(wallet.address, wallet.balance);
    });

    if (!this.balances.has('HOSPITAL')) {
      this.balances.set('HOSPITAL', 100000);
    }
    this.balances.set('COINBASE', this.totalSupply);
  }

  getBalance(address: string): number {
    return this.balances.get(address) ?? 0;
  }

  getCirculatingSupply(): number {
    let total = 0;
    this.balances.forEach((balance, address) => {
      if (address !== 'COINBASE') total += balance;
    });
    return total;
  }

  processCoinbaseReward(minerAddress: string, amount: number, blockIndex: number): Transaction {
    const coinbaseBalance = this.balances.get('COINBASE') ?? 0;
    const minerBalance = this.balances.get(minerAddress) ?? 0;

    this.balances.set('COINBASE', coinbaseBalance - amount);
    this.balances.set(minerAddress, minerBalance + amount);
    this.persistBalance(minerAddress);

    const tx: Transaction = {
      id: uuidv4(),
      from: 'COINBASE',
      to: minerAddress,
      amount,
      type: 'coinbase',
      timestamp: new Date().toISOString(),
      blockIndex,
    };

    this.transactionHistory.push(tx);
    saveTransaction(tx);
    return tx;
  }

  transfer(from: string, to: string, amount: number): { success: boolean; tx?: Transaction; error?: string } {
    const fromBalance = this.balances.get(from) ?? 0;

    if (fromBalance < amount) {
      return { success: false, error: `Saldo tidak cukup. Saldo ${from}: ${fromBalance} MED` };
    }
    if (amount <= 0) {
      return { success: false, error: 'Jumlah transfer harus lebih dari 0' };
    }

    this.balances.set(from, fromBalance - amount);
    const toBalance = this.balances.get(to) ?? 0;
    this.balances.set(to, toBalance + amount);
    this.persistBalance(from);
    this.persistBalance(to);

    const tx: Transaction = {
      id: uuidv4(),
      from,
      to,
      amount,
      type: 'transfer',
      timestamp: new Date().toISOString(),
    };

    this.transactionHistory.push(tx);
    saveTransaction(tx);
    return { success: true, tx };
  }

  processPayment(from: string, to: string, amount: number, blockIndex: number): { success: boolean; tx?: Transaction; error?: string } {
    const fromBalance = this.balances.get(from) ?? 0;

    if (fromBalance < amount) {
      return { success: false, error: `Saldo tidak cukup. Saldo: ${fromBalance} MED` };
    }

    this.balances.set(from, fromBalance - amount);
    const toBalance = this.balances.get(to) ?? 0;
    this.balances.set(to, toBalance + amount);
    this.persistBalance(from);
    this.persistBalance(to);

    const tx: Transaction = {
      id: uuidv4(),
      from,
      to,
      amount,
      type: 'payment',
      timestamp: new Date().toISOString(),
      blockIndex,
    };

    this.transactionHistory.push(tx);
    saveTransaction(tx);
    return { success: true, tx };
  }

  getAllTransactions(): Transaction[] {
    return [...this.transactionHistory].reverse();
  }

  getTransactionsByAddress(address: string): Transaction[] {
    return this.transactionHistory
      .filter(tx => tx.from === address || tx.to === address)
      .reverse();
  }

  getAllBalances(): { address: string; balance: number }[] {
    const result: { address: string; balance: number }[] = [];
    this.balances.forEach((balance, address) => {
      if (address !== 'COINBASE') {
        result.push({ address, balance });
      }
    });
    return result;
  }

  addAddress(address: string, initialBalance: number = 0): void {
    if (!this.balances.has(address)) {
      this.balances.set(address, initialBalance);
    }
  }

  private persistBalance(address: string): void {
    if (address === 'COINBASE') return;

    saveWallet({
      address,
      balance: this.getBalance(address),
    });
  }
}

// Singleton instance
const medcoin = new MEDCoin();
export default medcoin;
