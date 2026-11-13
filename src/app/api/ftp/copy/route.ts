import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';
import { Writable, Readable } from 'stream';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, fromPath, toPath } = body;

    // To copy a file via FTP, we must download it to memory and upload it to the new path.
    // NOTE: This approach is only for individual files. It's too memory intensive for large files.
    await withFtpClient(credentials, async (client) => {
      const bufs: Buffer[] = [];
      const writable = new Writable({
        write(chunk: Buffer, encoding: string, callback: () => void) {
          bufs.push(Buffer.from(chunk));
          callback();
        }
      });
      
      await client.downloadTo(writable, fromPath);
      const fileData = Buffer.concat(bufs);
      
      await client.uploadFrom(Readable.from(fileData), toPath);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Copy error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to copy file" }, { status: 500 });
  }
}
