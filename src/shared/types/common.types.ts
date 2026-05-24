export type TId = string & { readonly _brand: "Id" };
export type TUserId = string & { readonly _brand: "UserId" };
export type TTenantId = string & { readonly _brand: "TenantId" };

export type TPaginated<T> = {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};
