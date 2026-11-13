export interface ClientProfile {
  id: string;
  name: string;
  host: string;
  user: string;
  password?: string;
  port?: number;
  secure?: boolean;
}

export interface FtpFile {
  name: string;
  type: number; // 1 = file, 2 = dir according to basic-ftp
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
}
