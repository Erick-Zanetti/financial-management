import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || 'http://api-financial-management:3000';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const response = await fetch(`${INTERNAL_API_URL}/ai/process-file`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(120_000),
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
