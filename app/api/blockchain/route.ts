import { NextRequest, NextResponse } from "next/server";
import blockchain from '@/lib/blockchain';
import { executeContracts } from '@/lib/smartContract';
import { PatientRecord } from '@/types';

export async function GET() {
  return NextResponse.json({
    chain: blockchain.getChain(),
    length: blockchain.getChainLength(),
    isValid: blockchain.isChainValid(),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data, minerAddress, revisionOf, revisionReason } = body as {
    data: PatientRecord;
    minerAddress: string;
    revisionOf?: number;
    revisionReason?: string;
  };

  const revisionSource = revisionOf !== undefined ? blockchain.getBlockByIndex(revisionOf) : undefined;
  if (revisionOf !== undefined && !revisionSource) {
    return NextResponse.json({ success: false, error: 'Block asal revisi tidak ditemukan' }, { status: 404 });
  }

  const blockData = revisionSource
    ? { ...data, patientId: revisionSource.data.patientId }
    : data;

  const newBlock = blockchain.addBlock(blockData, minerAddress ?? 'HOSPITAL', {
    revisionOf,
    revisionReason,
  });
  const contractResults = executeContracts(newBlock);

  return NextResponse.json({ success: true, block: newBlock, contractResults });
}
