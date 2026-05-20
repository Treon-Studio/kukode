import type { StorageAdapter } from '../types';

export class MemoryStorageAdapter implements StorageAdapter {
  private files = new Map<string, string>();

  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    const extension = file.name.split('.').pop() || 'bin';
    const key = `${folder}/${crypto.randomUUID()}.${extension}`;

    // Convert file buffer to base64 Data URL to simulate a public URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    this.files.set(key, dataUrl);
    return { url: dataUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    this.files.delete(key);
  }
}
