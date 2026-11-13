import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, path, isDirectory } = body;

    await withFtpClient(credentials, async (client) => {
      if (isDirectory) {
        await client.removeDir(path);
      } else {
        await client.remove(path);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete" }, { status: 500 });
  }
}
