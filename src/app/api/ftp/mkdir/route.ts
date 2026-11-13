import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, path } = body;

    await withFtpClient(credentials, async (client) => {
      await client.ensureDir(path);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mkdir error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create directory" }, { status: 500 });
  }
}
