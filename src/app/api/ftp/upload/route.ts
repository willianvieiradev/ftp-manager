import { NextResponse } from 'next/server';
import { withFtpClient } from '@/lib/ftp';
import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const credentialsStr = formData.get("credentials") as string;
      const uploadPath = formData.get("path") as string;
      const file = formData.get("file") as File;
      
      if (!credentialsStr || !uploadPath || !file) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      const credentials = JSON.parse(credentialsStr);
      const buffer = Buffer.from(await file.arrayBuffer());
      const readableStream = Readable.from(buffer);
      
      const destDir = uploadPath.substring(0, uploadPath.lastIndexOf('/'));
      
      await withFtpClient(credentials, async (client) => {
        if (destDir && destDir !== '') {
          await client.ensureDir(destDir);
        }
        await client.uploadFrom(readableStream, uploadPath);
      });
      
      return NextResponse.json({ success: true });
    } else {
      const body = await req.json();
      const { credentials, path, content } = body;
      
      const readableStream = Readable.from([content]);
      
      await withFtpClient(credentials, async (client) => {
        await client.uploadFrom(readableStream, path);
      });
      
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to upload" }, { status: 500 });
  }
}
