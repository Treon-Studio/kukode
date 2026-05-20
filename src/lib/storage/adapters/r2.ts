import { Effect, Layer } from 'effect';
import { StorageAdapter } from '../types';

export const makeCloudflareR2StorageAdapter = (bucket: any, publicUrl: string) =>
  StorageAdapter.of({
    uploadFile: (file, folder = 'uploads') =>
      Effect.tryPromise({
        try: async () => {
          const extension = file.name.split('.').pop() || 'bin';
          const key = `${folder}/${crypto.randomUUID()}.${extension}`;
          const arrayBuffer = await file.arrayBuffer();

          await bucket.put(key, arrayBuffer, {
            httpMetadata: {
              contentType: file.type,
            },
          });

          const baseUrl = publicUrl.replace(/\/$/, '');
          const url = baseUrl ? `${baseUrl}/${key}` : `/${key}`;

          return { url, key };
        },
        catch: (error) => ({
          _tag: 'StorageError' as const,
          message: 'Failed to upload file to Cloudflare R2 bucket',
          error,
        }),
      }),

    deleteFile: (key) =>
      Effect.tryPromise({
        try: async () => {
          await bucket.delete(key);
        },
        catch: (error) => ({
          _tag: 'StorageError' as const,
          message: `Failed to delete file from Cloudflare R2: ${key}`,
          error,
        }),
      }),
  });

export const CloudflareR2StorageAdapterLive = (bucket: any, publicUrl: string) =>
  Layer.succeed(StorageAdapter, makeCloudflareR2StorageAdapter(bucket, publicUrl));
