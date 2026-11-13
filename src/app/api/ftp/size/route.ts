import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, path } = body;

    let totalSize = 0;

    await withFtpClient(credentials, async (client) => {
      
      const calculateSize = async (dirPath: string) => {
        const list = await client.list(dirPath);
        for (const item of list) {
          if (item.isDirectory) {
            await calculateSize(`${dirPath}/${item.name}`);
          } else {
            totalSize += item.size;
          }
        }
      };

      await calculateSize(path);
    });

    return NextResponse.json({ success: true, size: totalSize });
  } catch (error: any) {
    console.error("Size calculation error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to calculate size" }, { status: 500 });
  }
}
