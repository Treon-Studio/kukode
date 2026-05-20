export interface StorageAdapter {
  /**
   * Uploads a File to the designated storage provider.
   * @param file The file to upload.
   * @param folder Optional directory or prefix for organization (e.g. 'avatars', 'sites').
   * @returns An object containing the public URL and the storage file key.
   */
  uploadFile(file: File, folder?: string): Promise<{ url: string; key: string }>;

  /**
   * Deletes a file from the storage provider by its key.
   * @param key The file identifier key.
   */
  deleteFile(key: string): Promise<void>;
}
