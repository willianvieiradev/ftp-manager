import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, fromPath, toPath } = body;

    await withFtpClient(credentials, async (client) => {
      await client.rename(fromPath, toPath);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Rename error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to rename" }, { status: 500 });
  }
}
