import { CloudflareR2StorageAdapter } from './adapters/r2';
import { LocalStorageAdapter } from './adapters/local';
import { MemoryStorageAdapter } from './adapters/memory';
import type { StorageAdapter } from './types';

export * from './types';

/**
 * Dynamically resolves and returns the configured StorageAdapter.
 * - If running in Production/Staging on Cloudflare and the R2 bucket is bound, returns CloudflareR2StorageAdapter.
 * - If running in Local development under Node, returns LocalStorageAdapter (writes to public/uploads).
 * - Otherwise falls back to MemoryStorageAdapter.
 */
export function getStorageAdapter(locals: any): StorageAdapter {
  // Check for Cloudflare R2 bucket in runtime env bindings
  const r2Bucket = locals?.runtime?.env?.R2_BUCKET || locals?.runtime?.env?.BUCKET;
  const publicUrl = locals?.runtime?.env?.STORAGE_PUBLIC_URL || import.meta.env.STORAGE_PUBLIC_URL || '';

  if (r2Bucket) {
    return new CloudflareR2StorageAdapter(r2Bucket, publicUrl);
  }

  // If in local Node environment, return LocalStorageAdapter
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    return new LocalStorageAdapter();
  }

  // Fallback storage
  return new MemoryStorageAdapter();
}
