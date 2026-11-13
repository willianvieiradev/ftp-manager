import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, path = "/" } = body;

    const rawList = await withFtpClient(credentials, async (client) => {
      await client.cd(path);
      return await client.list();
    });

    // Extract the getter 'isDirectory' into a plain boolean so JSON.stringify preserves it
    const plainList = rawList.map(file => ({
      name: file.name,
      type: file.type,
      isDirectory: file.isDirectory,
      size: file.size,
      modifiedAt: file.modifiedAt
    }));

    // Sort: directories first, then files
    const sortedList = plainList.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ success: true, list: sortedList });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list directory" },
      { status: 500 }
    );
  }
}
