import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials, path, permissions } = body;

    if (!path || !permissions) {
      return NextResponse.json({ success: false, error: 'Caminho e permissões são obrigatórios' }, { status: 400 });
    }

    await withFtpClient(credentials, async (client) => {
      // basic-ftp .send("SITE CHMOD 755 /path")
      const command = `SITE CHMOD ${permissions} ${path}`;
      await client.send(command);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("CHMOD error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to change permissions" }, { status: 500 });
  }
}
