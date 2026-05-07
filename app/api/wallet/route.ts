import { NextRequest, NextResponse } from 'next/server';
import walletManager from '@/lib/wallet';

export async function GET() {
  return NextResponse.json({ wallets: walletManager.getAllWallets() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, owner, fromAddress, toAddress, amount } = body;

  if (action === 'create') {
    try {
      const wallet = walletManager.createWallet(owner);
      return NextResponse.json({ success: true, wallet });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Gagal membuat wallet' },
        { status: 400 }
      );
    }
  }

  if (action === 'transfer') {
    const result = walletManager.transfer(fromAddress, toAddress, Number(amount));
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Action tidak dikenal' }, { status: 400 });
}
