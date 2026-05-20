import { Effect } from 'effect';
import { CloudflareR2StorageAdapterLive } from './adapters/r2';
import { LocalStorageAdapterLive } from './adapters/local';
import { MemoryStorageAdapterLive } from './adapters/memory';
import { StorageAdapter } from './types';

export * from './types';

/**
 * Dynamically resolves the configured StorageAdapter Layer based on runtime environment.
 */
export function getStorageLayer(locals: any) {
  const r2Bucket = locals?.runtime?.env?.R2_BUCKET || locals?.runtime?.env?.BUCKET;
  const publicUrl = locals?.runtime?.env?.STORAGE_PUBLIC_URL || import.meta.env.STORAGE_PUBLIC_URL || '';

  if (r2Bucket) {
    return CloudflareR2StorageAdapterLive(r2Bucket, publicUrl);
  }

  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    return LocalStorageAdapterLive;
  }

  return MemoryStorageAdapterLive;
}

/**
 * Helper to run a storage effect utilizing the dynamic storage layer.
 */
export function runStorageEffect<A, E>(
  effect: Effect.Effect<A, E, StorageAdapter>,
  locals: any
): Promise<A> {
  const layer = getStorageLayer(locals);
  const runnable = Effect.provide(effect, layer);
  return Effect.runPromise(runnable);
}
