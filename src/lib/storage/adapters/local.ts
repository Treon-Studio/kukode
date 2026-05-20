import { Effect, Layer } from 'effect';
import { StorageAdapter } from '../types';

export const LocalStorageAdapterLive = Layer.succeed(
  StorageAdapter,
  StorageAdapter.of({
    uploadFile: (file, folder = 'uploads') =>
      Effect.tryPromise({
        try: async () => {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');

          const extension = file.name.split('.').pop() || 'bin';
          const filename = `${crypto.randomUUID()}.${extension}`;
          const publicDir = path.resolve('public/uploads');
          const targetDir = path.join(publicDir, folder);

          await fs.mkdir(targetDir, { recursive: true });

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await fs.writeFile(path.join(targetDir, filename), buffer);

          const key = `${folder}/${filename}`;
          const url = `/uploads/${key}`;
          return { url, key };
        },
        catch: (error) => ({
          _tag: 'StorageError' as const,
          message: 'Failed to write file to local storage',
          error,
        }),
      }),

    deleteFile: (key) =>
      Effect.tryPromise({
        try: async () => {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const publicDir = path.resolve('public/uploads');
          await fs.unlink(path.join(publicDir, key));
        },
        catch: (error) => ({
          _tag: 'StorageError' as const,
          message: `Failed to delete file from local storage: ${key}`,
          error,
        }),
      }),
  })
);
