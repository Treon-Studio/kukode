import type { StorageAdapter } from '../types';

export class LocalStorageAdapter implements StorageAdapter {
  async uploadFile(file: File, folder: string = 'uploads'): Promise<{ url: string; key: string }> {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const extension = file.name.split('.').pop() || 'bin';
    const filename = `${crypto.randomUUID()}.${extension}`;
    const publicDir = path.resolve('public/uploads');
    const targetDir = path.join(publicDir, folder);

    // Ensure upload directory exists
    await fs.mkdir(targetDir, { recursive: true });

    // Write file buffer to public path
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(path.join(targetDir, filename), buffer);

    const key = `${folder}/${filename}`;
    const url = `/uploads/${key}`;
    return { url, key };
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const publicDir = path.resolve('public/uploads');
      await fs.unlink(path.join(publicDir, key));
    } catch {}
  }
}
