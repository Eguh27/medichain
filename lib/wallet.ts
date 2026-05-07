import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { WalletData, Transaction } from '@/types';
import medcoin from './medcoin';
import { getAllWallets, saveWallet } from './db';

const NEW_WALLET_INITIAL_BALANCE = 1000;

class WalletManager {
  private wallets: Map<string, WalletData>;

  constructor() {
    this.wallets = new Map();
    const savedWallets = getAllWallets();

    savedWallets.forEach((wallet) => {
      this.wallets.set(wallet.address, wallet);
      medcoin.addAddress(wallet.address, wallet.balance);
    });

    // Pre-create wallet default
    this.createWallet('Hospital Admin', 'HOSPITAL');
    this.createWallet('Dr. Smith', 'DOCTOR_001');
    this.createWallet('Patient Fund', 'PATIENT_FUND');
  }

  generateAddress(name: string): string {
    const hash = CryptoJS.SHA256(name + uuidv4()).toString().slice(0, 8);
    return `MED-${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`;
  }

  createWallet(owner: string, customAddress?: string): WalletData {
    const address = customAddress ?? this.generateAddress(owner);
    const existingWallet = this.wallets.get(address);

    if (existingWallet) {
      const wallet = {
        ...existingWallet,
        owner,
        balance: medcoin.getBalance(address),
      };
      this.wallets.set(address, wallet);
      saveWallet(wallet);
      return this.getWallet(address) ?? wallet;
    }

    // Wallet HOSPITAL adalah sumber dana awal sistem.
    if (customAddress === 'HOSPITAL') {
      medcoin.addAddress(address, 100000);
    } else {
      medcoin.addAddress(address, 0);

      const funding = medcoin.transfer('HOSPITAL', address, NEW_WALLET_INITIAL_BALANCE);
      if (!funding.success) {
        throw new Error(funding.error ?? 'Gagal memberi saldo awal wallet baru');
      }
    }

    const wallet: WalletData = {
      address,
      owner,
      balance: medcoin.getBalance(address),
      transactions: [],
    };

    this.wallets.set(address, wallet);
    saveWallet(wallet);
    return wallet;
  }

  getWallet(address: string): WalletData | null {
    const wallet = this.wallets.get(address);
    if (!wallet) return null;

    // Selalu ambil balance terbaru dari MEDCoin
    return {
      ...wallet,
      balance: medcoin.getBalance(address),
      transactions: medcoin.getTransactionsByAddress(address),
    };
  }

  getAllWallets(): WalletData[] {
    return Array.from(this.wallets.keys()).map(address => ({
      ...this.wallets.get(address)!,
      balance: medcoin.getBalance(address),
      transactions: medcoin.getTransactionsByAddress(address),
    }));
  }

  transfer(fromAddress: string, toAddress: string, amount: number): {
    success: boolean;
    tx?: Transaction;
    error?: string;
  } {
    // Validasi wallet exist
    if (!this.wallets.has(fromAddress)) {
      return { success: false, error: 'Wallet pengirim tidak ditemukan' };
    }
    if (!this.wallets.has(toAddress)) {
      return { success: false, error: 'Wallet penerima tidak ditemukan' };
    }

    return medcoin.transfer(fromAddress, toAddress, amount);
  }

  isAddressExists(address: string): boolean {
    return this.wallets.has(address);
  }

  getTotalWallets(): number {
    return this.wallets.size;
  }
}

// Singleton instance
const walletManager = new WalletManager();
export default walletManager;
