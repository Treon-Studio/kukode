import { Effect, Layer } from 'effect';
import { StorageAdapter } from '../types';

export const MemoryStorageAdapterLive = Layer.succeed(
  StorageAdapter,
  StorageAdapter.of({
    uploadFile: (file, folder = 'uploads') =>
      Effect.tryPromise({
        try: async () => {
          const extension = file.name.split('.').pop() || 'bin';
          const key = `${folder}/${crypto.randomUUID()}.${extension}`;
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const url = `data:${file.type};base64,${base64}`;
          return { url, key };
        },
        catch: (error) => ({
          _tag: 'StorageError' as const,
          message: 'Failed to upload file to memory storage',
          error,
        }),
      }),

    deleteFile: () => Effect.void,
  })
);
