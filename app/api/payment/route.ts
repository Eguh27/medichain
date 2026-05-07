import { NextRequest, NextResponse } from 'next/server';
import medcoin from '@/lib/medcoin';
import blockchain from '@/lib/blockchain';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fromAddress, patientId, amount } = body;

  const blockIndex = blockchain.getChainLength();
  const result = medcoin.processPayment(fromAddress, 'HOSPITAL', Number(amount), blockIndex);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, tx: result.tx });
}