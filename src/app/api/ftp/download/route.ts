import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';
import { Writable } from 'stream';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, path, encoding } = body;

    const content = await withFtpClient(credentials, async (client) => {
      const chunks: Buffer[] = [];
      const writableStream = new Writable({
        write(chunk, enc, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        }
      });
      await client.downloadTo(writableStream, path);
      const buffer = Buffer.concat(chunks);
      
      if (encoding === 'base64') {
        return buffer.toString('base64');
      } else {
        return buffer.toString('utf-8');
      }
    });

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to download" }, { status: 500 });
  }
}
