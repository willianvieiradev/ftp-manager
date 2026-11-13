import * as ftp from "basic-ftp";

export interface FtpCredentials {
  host: string;
  user: string;
  password?: string;
  port?: number;
  secure?: boolean | "implicit";
}

export async function withFtpClient<T>(
  credentials: FtpCredentials,
  callback: (client: ftp.Client) => Promise<T>
): Promise<T> {
  const client = new ftp.Client();
  try {
    await client.access({
      host: credentials.host,
      user: credentials.user,
      password: credentials.password,
      port: credentials.port || 21,
      secure: credentials.secure || false,
    });
    const result = await callback(client);
    return result;
  } catch (error) {
    console.error("FTP Client Error:", error);
    throw error;
  } finally {
    client.close();
  }
}
