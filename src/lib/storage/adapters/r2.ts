import type { StorageAdapter } from '../types';

export class CloudflareR2StorageAdapter implements StorageAdapter {
  private bucket: any;
  private publicUrl: string;

  constructor(bucket: any, publicUrl: string) {
    this.bucket = bucket;
    this.publicUrl = publicUrl;
  }

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    const extension = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${crypto.randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();

    // Put file into Cloudflare R2 bucket
    await this.bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate public URL
    const baseUrl = this.publicUrl.replace(/\/$/, '');
    const url = baseUrl ? `${baseUrl}/${key}` : `/${key}`;

    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}
