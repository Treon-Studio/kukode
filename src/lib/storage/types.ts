import { Context, Effect } from 'effect';

export interface StorageError {
  readonly _tag: 'StorageError';
  readonly message: string;
  readonly error: unknown;
}

export interface StorageAdapter {
  readonly uploadFile: (
    file: File,
    folder?: string
  ) => Effect.Effect<{ readonly url: string; readonly key: string }, StorageError>;

  readonly deleteFile: (key: string) => Effect.Effect<void, StorageError>;
}

export const StorageAdapter = Context.GenericTag<StorageAdapter>('@services/StorageAdapter');
