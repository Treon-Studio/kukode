# Engineering Standards & Rules
**Version**: 2.0.0
**Maintained by**: TREON Studio — Engineering
**Applies to**: Semua project TypeScript fullstack (Astro · Next.js · Hono · Node.js)
**Paradigm**: Pure Functional Programming · Vertical Slice Architecture · Effect-TS

---

> Dokumen ini adalah **law**, bukan guideline.
> Setiap rule berlaku di semua project. Exception harus tercatat di `EXCEPTIONS.md` per-project dengan alasan eksplisit.

---

## Daftar Isi

1. [Paradigma & Prinsip Dasar](#1-paradigma--prinsip-dasar)
2. [Struktur Folder — Vertical Slice](#2-struktur-folder--vertical-slice)
3. [Naming Conventions](#3-naming-conventions)
4. [Dependency Rules — No Cycles](#4-dependency-rules--no-cycles)
5. [Pure Functional Programming Rules](#5-pure-functional-programming-rules)
6. [Effect-TS Rules](#6-effect-ts-rules)
7. [TypeScript Rules](#7-typescript-rules)
8. [Domain Layer Rules](#8-domain-layer-rules)
9. [Infrastructure & Adapter Rules](#9-infrastructure--adapter-rules)
10. [Presentation Layer Rules](#10-presentation-layer-rules)
11. [Component Rules](#11-component-rules)
12. [Testing Rules](#12-testing-rules)
13. [Tooling Rules](#13-tooling-rules)
14. [Git & CI Rules](#14-git--ci-rules)
15. [Violation Severity & Enforcement](#15-violation-severity--enforcement)

---

## 1. Paradigma & Prinsip Dasar

### 1.1 Pure Functional Programming

| # | Rule | Rationale |
|---|---|---|
| R-FP-01 | **Tidak ada `class`** untuk domain logic | Class mencampur data dan behaviour, menciptakan implicit state via `this` |
| R-FP-02 | **Tidak ada `this`** — semua function menerima dependency sebagai argument eksplisit | `this` adalah hidden parameter yang menyembunyikan dependency |
| R-FP-03 | **Tidak ada mutation** — semua transformation menghasilkan value baru | Mutation menciptakan temporal coupling dan bug yang sulit di-reproduce |
| R-FP-04 | **Tidak ada `new ConcreteClass()`** di luar Layer implementation | `new` menciptakan tight coupling ke implementasi konkret, tidak bisa di-swap |
| R-FP-05 | **Data dan behaviour dipisah** — type di `*.types.ts`, function di `*.module.ts` | Explicit separation of concerns, mudah di-test secara terpisah |
| R-FP-06 | Semua type field wajib `readonly` | Mencegah accidental mutation di compile time |

```typescript
// ❌ OOP — data dan behaviour tercampur, implicit state via this
class UserService {
  private users: TUser[] = []                  // mutable state
  addUser(user: TUser) {
    this.users.push(user)                       // mutation via this
  }
  getCount() { return this.users.length }       // behaviour terikat ke instance
}

// ✅ Pure FP — data terpisah dari behaviour, semua immutable
type TUserStore = { readonly users: readonly TUser[] }

const addUser  = (store: TUserStore, user: TUser): TUserStore =>
  ({ ...store, users: [...store.users, user] })  // return new value

const getCount = (store: TUserStore): number => store.users.length
```

### 1.2 Catatan Penting: `class` Syntax di Effect-TS

**`Data.TaggedError` dan `Context.Tag` menggunakan syntax `class` — ini bukan OOP.**

Effect-TS membutuhkan `class` sebagai **nominal type token** untuk dua tujuan:
- `Data.TaggedError` — ADT (Algebraic Data Type) untuk typed errors. Tidak ada method, tidak ada `this`, hanya data container dengan tag unik.
- `Context.Tag` — Type-level identifier untuk dependency injection. Tidak ada method, tidak ada state, hanya compile-time token.

Keduanya adalah FP constructs yang kebetulan menggunakan syntax `class` karena keterbatasan TypeScript. Ini bukan pelanggaran FP — ini alat FP yang tersedia.

```typescript
// ✅ Data.TaggedError — ini ADT bukan class OOP
// Tidak ada method, tidak ada this, tidak ada mutable state
// Hanya: tag unik + readonly data payload
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly id: string   // ← readonly, immutable
}>() {}

// Cara pakai: functional — bukan new UserNotFoundError().doSomething()
const result = pipe(
  repo.findById(id),
  Effect.flatMap((user) =>
    user
      ? Effect.succeed(user)
      : Effect.fail(new UserNotFoundError({ id })),  // data constructor, bukan OOP
  ),
)

// ✅ Context.Tag — ini type-level DI token bukan class OOP
// Tidak ada method, tidak ada state — hanya identifier di type system
export class IUserRepository extends Context.Tag("IUserRepository")<
  IUserRepository,
  {
    // Semua method adalah pure function signatures — bukan OOP methods
    readonly findById: (id: TUserId) => Effect.Effect<TUser | null, DatabaseError>
    readonly save:     (user: TUser)  => Effect.Effect<void, DatabaseError>
  }
>() {}

// Cara pakai: functional injection — bukan new IUserRepository()
const program = Effect.gen(function* () {
  const repo = yield* IUserRepository  // ← inject via Layer, bukan instantiate
  return yield* repo.findById(id)
})
```

**Rule praktis:** Ketika melihat `class` di codebase ini, cek apakah:
- Extends `Data.TaggedError` → ✅ ADT, boleh
- Extends `Context.Tag` → ✅ DI token, boleh
- Selain itu → ❌ harus diubah ke module pattern

### 1.3 Vertical Slice Architecture

| # | Rule | Rationale |
|---|---|---|
| R-VSA-01 | Semua file yang berkaitan dengan satu domain ada di **satu folder** | Locality — satu tempat untuk cari, ubah, hapus |
| R-VSA-02 | Tidak ada pemisahan horizontal `domain/` `application/` `infrastructure/` yang menyebar | Horizontal slicing mempersulit navigasi dan refactor |
| R-VSA-03 | Setiap domain **wajib punya `index.ts`** sebagai public barrel | Encapsulation — caller tidak boleh tahu internal domain |
| R-VSA-04 | Import antar domain **hanya dari `index.ts`**, tidak pernah deep import | Deep import menciptakan coupling ke implementation detail |
| R-VSA-05 | Internal file domain (selain `index.ts`) adalah **domain-private** | Hanya `index.ts` yang boleh di-import domain lain |

```typescript
// ❌ Deep import — coupling ke implementation detail
import { UserModule }      from "@/domain/user/user.module"
import { UserNotFoundError } from "@/domain/user/user.errors"

// ✅ Via barrel — domain encapsulation terjaga
import { UserModule, UserNotFoundError } from "@/domain/user/index"
```

---

## 2. Struktur Folder — Vertical Slice

### 2.1 Template Folder Project

```
src/
├── domain/                    # Semua domain — vertical slice
│   └── {domain}/
│       ├── {domain}.types.ts          # R: Readonly data shapes
│       ├── {domain}.errors.ts         # R: TaggedError ADTs
│       ├── {domain}.module.ts         # R: Pure functions — behaviour
│       ├── {domain}.repository.ts     # R: IRepository — Context.Tag DI token
│       ├── {domain}.repository.live.ts# R: RepositoryLive — Layer implementation
│       ├── {domain}.service.ts        # O: IService — Context.Tag DI token
│       ├── {domain}.service.live.ts   # O: ServiceLive — Layer implementation
│       ├── {domain}.schemas.ts        # O: effect/Schema untuk input validation
│       ├── {domain}.dto.ts            # O: Output type + pure mapper function
│       ├── {domain}.programs.ts       # R: Effect.gen use cases
│       ├── {domain}.constants.ts      # O: Domain-specific constants
│       ├── components/                # O: React islands domain-specific
│       │   └── {Component}/
│       │       ├── {Component}.tsx
│       │       ├── {Component}.module.css
│       │       └── use{Component}.ts
│       ├── {domain}.test.ts           # R: Unit + integration tests
│       └── index.ts                   # R: Public barrel
│
├── infra/                     # Cross-cutting infrastructure
│   ├── db/
│   │   ├── drizzle.client.ts          # R: DrizzleClient Context.Tag + Live Layer
│   │   └── drizzle.schema.ts          # R: Semua table definitions
│   ├── cache/
│   │   ├── cache.adapter.ts           # R: ICacheAdapter Context.Tag
│   │   └── cache.adapter.live.ts      # R: Implementation (Upstash/Redis/Memcached)
│   ├── mail/
│   │   ├── mailer.service.ts          # R: IMailerService Context.Tag
│   │   └── mailer.service.live.ts     # R: Implementation (Resend/SendGrid/Postmark)
│   ├── http/
│   │   ├── http.adapter.ts            # R: IHttpAdapter Context.Tag
│   │   └── http.adapter.live.ts       # R: Implementation (fetch/axios/ky)
│   ├── realtime/
│   │   ├── realtime.service.ts        # O: IRealtimeService Context.Tag
│   │   └── realtime.service.live.ts   # O: Implementation (SSE/Pusher/Socket.io)
│   └── runtime/
│       └── app.runtime.ts             # R: ManagedRuntime + AppLayer — composition root
│
├── shared/                    # Shared kernel — TIDAK boleh import dari domain
│   ├── constants/
│   │   ├── api.constants.ts           # HTTP_STATUS, ROUTES, API_BASE
│   │   └── error.constants.ts         # ERROR_TAG strings
│   ├── env/
│   │   └── app.config.ts             # R: AppConfig via Effect Config
│   ├── types/
│   │   └── common.types.ts           # R: TId, TTenantId, TUserId, TUserRole,
│   │                                 #    TSessionUser, TPaginated, TApiResponse
│   ├── errors/
│   │   ├── infrastructure.errors.ts   # R: DatabaseError, CacheError, HttpError, dll
│   │   └── application.errors.ts      # R: UnauthorizedError, ValidationError, dll
│   └── utils/
│       └── rate-limit.ts              # O: Reusable Effect utilities
│
├── ui/                        # Design system — domain-agnostic primitives
│   └── {Component}/
│       ├── {Component}.tsx
│       └── {Component}.module.css
│
├── pages/                     # Presentation layer
│   ├── api/v1/
│   │   └── {domain}/
│   │       └── {route}.ts             # R: Parse → Validate → runApp → Response
│   └── (layouts)/
│
├── middleware/
│   ├── auth.ts
│   ├── tenant.ts
│   └── index.ts
│
└── styles/
    ├── tokens.css
    ├── reset.css
    ├── typography.css
    └── utilities.css
```

**Keterangan:** `R` = Required, `O` = Optional

### 2.2 File Naming Rules

| # | Rule |
|---|---|
| R-FILE-01 | Format: `{domain}.{concern}.ts` — lowercase, pisah dengan titik |
| R-FILE-02 | CSS Module: `{Component}.module.css` — satu file per component |
| R-FILE-03 | Test: `{domain}.test.ts` di root folder domain |
| R-FILE-04 | Tidak ada `utils.ts` generik — fungsi reusable di `shared/utils/{name}.ts` |

---

## 3. Naming Conventions

### 3.1 Prefixes

| Prefix | Digunakan untuk | Contoh |
|---|---|---|
| `T` | Semua type dan data shape | `TUser`, `TTenant`, `TPaginated<T>` |
| `I` | `Context.Tag` DI token (interface) | `IUserRepository`, `IBillingService` |

### 3.2 Suffixes

| Suffix | Digunakan untuk | Contoh |
|---|---|---|
| `Module` | Object of pure functions — domain behaviour | `UserModule`, `AuthModule` |
| `Live` | Layer implementasi konkret | `UserRepositoryLive`, `StripeBillingServiceLive` |
| `Error` | `Data.TaggedError` ADT | `UserNotFoundError`, `DatabaseError` |
| `Schema` | `effect/Schema` definition | `CreateUserSchema`, `LoginSchema` |
| `Program` | Named `Effect.gen` use case | `registerProgram`, `createCheckoutProgram` |
| `Context` | Request-scoped `Context.Tag` value | `TenantContext`, `UserContext` |

### 3.3 Function Naming

| Pattern | Digunakan untuk | Contoh |
|---|---|---|
| `to{X}Dto` | Pure mapper — domain type → DTO | `toUserDto`, `toSubscriptionDto` |
| `use{X}` | React custom hook | `useRegisterForm`, `useFileUploader` |
| `make{X}` | Pure factory tanpa side effect | `makeChannelKey`, `makePublicUrl` |
| `{verb}{Noun}Program` | Effect.gen use case | `getUserByIdProgram` |

### 3.4 Konstanta

| # | Rule |
|---|---|
| R-CONST-01 | Semua konstanta `SCREAMING_SNAKE_CASE` dan `as const` |
| R-CONST-02 | Tidak ada magic string/number di luar file `constants/` |
| R-CONST-03 | Error tag string hanya di `error.constants.ts` |

```typescript
// ❌ Magic string langsung di kode
const route = "/api/v1/users"
Effect.fail(new DatabaseError({ cause: "row not found" }))

// ✅ Dari constants
const route = ROUTES.USERS
// Error tag berasal dari konstanta — tidak ada string literal hardcode
export class UserNotFoundError extends Data.TaggedError(ERROR_TAG.USER_NOT_FOUND)<{
  readonly id: string
}>() {}
```

---

## 4. Dependency Rules — No Cycles

### 4.1 Dependency Layer Order

Layer hanya boleh depend ke layer di bawahnya. Tidak pernah sebaliknya.

```
Layer 0 — shared/
  ↓
Layer 1 — domain/ foundation: tenant, user
  ↓
Layer 2 — domain/ feature: auth, billing, notification, storage, webhook
  ↓
Layer 3 — infra/runtime/ + pages/api/ + middleware/
```

### 4.2 Import Matrix

| From \ To | shared/ | tenant/ | user/ | auth/ | feature/* | infra/ | pages/ |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **shared/** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **tenant/** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **user/** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **auth/** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **feature/** | ✅ | ✅ | ✅ | ✅ | ✅ self | ❌ | ❌ |
| **infra/** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **pages/** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 4.3 Type Ownership Rules

| # | Rule |
|---|---|
| R-DEP-01 | Type yang dipakai lebih dari satu domain → pindah ke `shared/types/` |
| R-DEP-02 | ID types (`TUserId`, `TTenantId`) selalu di `shared/types/common.types.ts` |
| R-DEP-03 | `TSessionUser`, `TUserRole` di `shared/` — bukan di domain auth/user |
| R-DEP-04 | Vendor type (misal `Stripe.Event`) tidak boleh keluar dari file `*.live.ts` |

```typescript
// ❌ Type ownership di domain yang salah — menyebabkan cycle
// domain/auth/auth.types.ts
import type { TUserRole } from "@/domain/user/index"  // auth depend on user
// domain/user/user.programs.ts
import { TenantContext } from "@/domain/tenant/index"  // user depend on tenant
// domain/tenant/tenant.types.ts
import type { TTenantId } from "@/domain/user/index"   // tenant depend on user → CYCLE

// ✅ Shared types di shared/ — semua domain import dari satu tempat
// shared/types/common.types.ts
export type TUserId    = TId & { readonly _brand: "UserId" }
export type TTenantId  = TId & { readonly _brand: "TenantId" }
export type TUserRole  = "owner" | "admin" | "member" | "viewer"
export type TSessionUser = {
  readonly sessionId: string
  readonly userId:    string
  readonly tenantId:  string
  readonly role:      TUserRole
}
```

### 4.4 Enforcement via `dependency-cruiser`

```bash
pnpm add -D dependency-cruiser
```

```javascript
// .dependency-cruiser.cjs
module.exports = {
  forbidden: [
    {
      name: "shared-no-domain",
      severity: "error",
      from: { path: "^src/shared/" },
      to:   { path: "^src/domain/" },
    },
    {
      name: "no-deep-cross-domain-import",
      severity: "error",
      comment: "Import antar domain wajib via index.ts",
      from: { path: "^src/domain/([a-z]+)/" },
      to: {
        path:    "^src/domain/([a-z]+)/(?!index\\.ts)",
        pathNot: "^src/domain/\\1/",
      },
    },
    {
      name: "domain-no-infra",
      severity: "error",
      comment: "Domain layer dilarang import dari infra/ (kecuali *.live.ts)",
      from: { path: "^src/domain/[a-z]+/(?!.*\\.live\\.ts)" },
      to:   { path: "^src/infra/" },
    },
  ],
  options: { tsConfig: { fileName: "tsconfig.json" } },
}
```

---

## 5. Pure Functional Programming Rules

### 5.1 Data Rules

| # | Rule |
|---|---|
| R-DATA-01 | Semua type field wajib `readonly` |
| R-DATA-02 | Tidak ada mutable array — gunakan `readonly T[]` |
| R-DATA-03 | Tidak ada `let` untuk object/array yang di-mutate |
| R-DATA-04 | Object update via spread: `{ ...obj, field: newValue }` |
| R-DATA-05 | Array update via `map`, `filter`, `reduce` — tidak pernah `push`, `splice`, `sort` in-place |

```typescript
// ❌ Mutable — melanggar R-DATA-02, R-DATA-05
const ids: string[] = []
ids.push("abc")
ids.sort()

// ✅ Immutable — setiap operasi return value baru
const withId    = (ids: readonly string[], id: string): readonly string[] => [...ids, id]
const sorted    = (ids: readonly string[]): readonly string[] => [...ids].sort()
```

### 5.2 Function Rules

| # | Rule |
|---|---|
| R-FN-01 | Semua function adalah pure — output hanya bergantung pada input, tidak ada hidden state |
| R-FN-02 | Side effect (DB, HTTP, email) hanya di Effect pipeline — tidak di luar |
| R-FN-03 | Function dengan side effect return `Effect<A, E, R>` — tidak pernah `void` tanpa Effect |
| R-FN-04 | Tidak ada function dengan lebih dari 4 parameter — gunakan object parameter |
| R-FN-05 | Module object selalu ditutup dengan `as const` untuk treeshaking |

```typescript
// ❌ Tidak pure — output bergantung pada waktu (hidden dependency)
const buildUser = (name: string) => ({
  name,
  createdAt: new Date(),  // hidden side effect — output berbeda tiap panggilan
})

// ✅ Pure — semua input eksplisit
const buildUser = (name: string, now: Date) => ({
  name,
  createdAt: now,  // deterministik — test bisa inject waktu tertentu
})

// ✅ Pure via Effect — side effect dimodelkan secara eksplisit
const buildUserEffect = (name: string): Effect.Effect<TUser, never> =>
  pipe(
    Effect.sync(() => new Date()),
    Effect.map((now) => ({ name, createdAt: now })),
  )
```

### 5.3 Module Pattern Rules

| # | Rule |
|---|---|
| R-MOD-01 | Behaviour domain disimpan dalam `const {Domain}Module = { ... } as const` |
| R-MOD-02 | Semua function dalam Module menerima data sebagai argument pertama |
| R-MOD-03 | Module hanya punya satu `create` factory — tidak ada overloaded constructor |
| R-MOD-04 | Module function yang return `Effect` tidak boleh memanggil `runPromise` |
| R-MOD-05 | Private helper adalah `const` biasa di atas Module — tidak di-export |

```typescript
// src/domain/user/user.module.ts

// ── Private helpers — tidak di-export ───────────────────────
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeEmail = (raw: string): string =>
  raw.toLowerCase().trim()

const validateEmail = (email: string): Effect.Effect<string, InvalidEmailError> =>
  EMAIL_REGEX.test(email)
    ? Effect.succeed(email)
    : Effect.fail(new InvalidEmailError({ email }))

// ── Public module — exported ─────────────────────────────────
export const UserModule = {
  // Factory — returns new TUser, tidak throw
  create: (props: TUserProps): Effect.Effect<TUser, InvalidEmailError> =>
    pipe(
      normalizeEmail(props.email),
      validateEmail,
      Effect.map((email) => ({
        ...props,
        email,
        id:        crypto.randomUUID() as TUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    ),

  // Reconstitute dari DB — skip heavy validation
  reconstitute: (raw: TUser): TUser => ({ ...raw }),

  // Transformation — return new TUser, tidak mutate argument
  suspend: (user: TUser): Effect.Effect<TUser, UserSuspendedError> =>
    user.status === "suspended"
      ? Effect.fail(new UserSuspendedError({ id: user.id }))
      : Effect.succeed({ ...user, status: "suspended", updatedAt: new Date() }),

  changeEmail: (user: TUser, newEmail: string): Effect.Effect<TUser, InvalidEmailError> =>
    pipe(
      normalizeEmail(newEmail),
      validateEmail,
      Effect.map((email) => ({ ...user, email, updatedAt: new Date() })),
    ),

  // Guards — predicate functions, is/can/has prefix
  isActive:         (user: TUser): boolean => user.status === "active",
  canManageBilling: (user: TUser): boolean => user.role === "owner" || user.role === "admin",
} as const
```

### 5.4 Composition Rules

| # | Rule |
|---|---|
| R-COMP-FP-01 | Gunakan `pipe` untuk komposisi linear — tidak ada method chaining |
| R-COMP-FP-02 | Gunakan `Effect.gen` untuk komposisi multi-step dengan dependency |
| R-COMP-FP-03 | Partial application (`fn(config)(data)`) untuk reusable function factories |

```typescript
// ❌ Method chain — OOP style
userService.findById(id).validate().toDto()

// ✅ pipe — FP style, tiap step adalah pure function
pipe(
  repo.findById(id),
  Effect.flatMap((user) => user ? Effect.succeed(user) : Effect.fail(new UserNotFoundError({ id }))),
  Effect.map(toUserDto),
)

// ✅ Partial application — factory function
const withTenantFilter =
  (tenantId: TTenantId) =>
  (query: DBQuery): DBQuery =>
    query.where(eq(users.tenantId, tenantId))

// Reuse untuk query yang berbeda
const filteredUsers    = pipe(baseQuery, withTenantFilter(tenantId))
const filteredSessions = pipe(sessionQuery, withTenantFilter(tenantId))
```

---

## 6. Effect-TS Rules

### 6.1 Effect Pipeline Rules

| # | Rule |
|---|---|
| R-EFF-01 | **Tidak pernah `throw`** — selalu `Effect.fail(new TaggedError(...))` |
| R-EFF-02 | **Tidak pernah `try/catch`** — selalu `Effect.tryPromise` atau `Effect.try` |
| R-EFF-03 | **Tidak pernah `async/await`** di domain dan infra layer |
| R-EFF-04 | `Effect.runPromise` **hanya di** `pages/api/**` dan `infra/runtime/app.runtime.ts` |
| R-EFF-05 | Side effect fire-and-forget selalu lewat `Effect.fork` |

```typescript
// ❌ Semua pattern ini dilarang di domain/infra layer
async function getUser(id: string) {
  try {
    const user = await db.findById(id)          // async/await
    if (!user) throw new Error("not found")     // throw
    return user
  } catch (e) {                                 // try/catch
    throw new DatabaseError(e)
  }
}

// ✅ Semua lewat Effect pipeline
const getUser = (id: TUserId): Effect.Effect<TUser, UserNotFoundError | DatabaseError, IUserRepository> =>
  pipe(
    IUserRepository,
    Effect.flatMap((repo) => repo.findById(id)),
    Effect.flatMap((user) =>
      user
        ? Effect.succeed(user)
        : Effect.fail(new UserNotFoundError({ id })),
    ),
  )
```

### 6.2 `pipe` vs `Effect.gen` — Decision Table

| Gunakan `pipe` ketika | Gunakan `Effect.gen` ketika |
|---|---|
| Transformasi linear, tidak ada branching | Multi-step dengan lebih dari 2 `yield*` |
| Satu atau dua failure point | Perlu inject lebih dari satu dependency |
| Tidak perlu dependency injection | Ada `if/else` conditional logic |
| Wrapper sederhana di atas satu Effect | Lebih dari 3 chained `Effect.flatMap` |

```typescript
// ✅ pipe — linear, satu dependency, satu failure point
const getUserDto = (id: string): Effect.Effect<TUserDto, UserNotFoundError | DatabaseError, IUserRepository> =>
  pipe(
    IUserRepository,
    Effect.flatMap((repo) => repo.findById(id as TUserId)),
    Effect.flatMap((user) =>
      user ? Effect.succeed(toUserDto(user)) : Effect.fail(new UserNotFoundError({ id })),
    ),
  )

// ✅ Effect.gen — multi-step, multi-dependency, ada conditional
const registerProgram = (command: RegisterCommand): Effect.Effect<
  TAuthDto,
  EmailAlreadyRegisteredError | InvalidEmailError | DatabaseError,
  IUserRepository | IAuthService | ITenantRepository
> =>
  Effect.gen(function* () {
    const userRepo   = yield* IUserRepository
    const authSvc    = yield* IAuthService
    const tenantRepo = yield* ITenantRepository

    const tenant  = yield* TenantModule.create({ slug: command.tenantSlug, name: command.name })
    yield* tenantRepo.save(tenant)

    const exists = yield* userRepo.existsByEmail(command.email, tenant.id)
    if (exists) yield* Effect.fail(new EmailAlreadyRegisteredError({ email: command.email }))

    const hashed  = yield* AuthModule.hashPassword(command.password)
    const user    = yield* UserModule.create({ ...command, hashedPassword: hashed, tenantId: tenant.id })
    yield* userRepo.save(user)

    const session = yield* authSvc.createSession(user.id, tenant.id)
    return toAuthDto(session)
  })
```

### 6.3 Error Handling Rules

| # | Rule |
|---|---|
| R-ERR-01 | Setiap domain punya `{domain}.errors.ts` dengan `Data.TaggedError` ADTs |
| R-ERR-02 | Setiap error punya tag string unik di seluruh codebase |
| R-ERR-03 | Tag string dari `error.constants.ts` — tidak ada string literal hardcode |
| R-ERR-04 | `Effect.catchTags` di presentation layer harus exhaustive |
| R-ERR-05 | Infrastructure error tidak bocor ke domain type — wrap di infra layer |
| R-ERR-06 | Return type program wajib menyebut semua error yang mungkin |

```typescript
// ❌ extends Error biasa — tidak typed, tidak composable
class UserNotFoundError extends Error {
  constructor(id: string) { super(`User ${id} not found`) }
}
// Caller tidak tahu error apa yang mungkin terjadi — compiler tidak bisa bantu

// ✅ Data.TaggedError — typed ADT, compiler enforce exhaustive handling
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly id: string  // ← data payload, readonly, tidak ada method
}>() {}

// Return type eksplisit — compiler tahu semua kemungkinan failure
const suspendUser = (id: string): Effect.Effect<
  TUserDto,
  UserNotFoundError | UserSuspendedError | InsufficientPermissionError | DatabaseError,
  //^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^
  // compiler enforce semua ini di-handle di Effect.catchTags
  IUserRepository | IPermissionService
> => Effect.gen(function* () { /* ... */ })
```

### 6.4 Layer & Dependency Injection Rules

| # | Rule |
|---|---|
| R-LAYER-01 | Setiap external service dependency adalah `Context.Tag` dengan prefix `I` |
| R-LAYER-02 | Setiap `Context.Tag` punya minimal satu `*Live` Layer implementasi |
| R-LAYER-03 | Semua Layer di-compose di satu tempat: `infra/runtime/app.runtime.ts` |
| R-LAYER-04 | Test menggunakan `Layer.succeed(IService, { ... })` — tidak pernah `jest.mock` |
| R-LAYER-05 | `ManagedRuntime` dibuat sekali — tidak ada `runPromise` liar |
| R-LAYER-06 | Layer dependency di-provide via `Layer.provide` di `AppLayer` |

```typescript
// ❌ jest.mock — runtime magic, tidak type-safe
jest.mock("@/domain/user/user.repository")
const mockRepo = require("@/domain/user/user.repository")
mockRepo.findById.mockResolvedValue(null)  // tidak ada compile-time check

// ✅ Layer.succeed — fully type-safe, composable, FP-idiomatic
const TestUserRepository = Layer.succeed(IUserRepository, {
  findById:      () => Effect.succeed(null),
  findByEmail:   () => Effect.succeed(null),
  findAll:       () => Effect.succeed({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
  save:          () => Effect.void,
  update:        () => Effect.void,
  delete:        () => Effect.void,
  existsByEmail: () => Effect.succeed(false),
  // ← TypeScript error compile-time jika ada method yang hilang
})

// Compose dan provide ke program — clean functional style
const result = await Effect.runPromise(
  registerProgram(command).pipe(
    Effect.provide(Layer.mergeAll(TestUserRepository, TestAuthService)),
  ),
)
```

### 6.5 Schema & Validation Rules

| # | Rule |
|---|---|
| R-SCHEMA-01 | Semua input validation menggunakan `effect/Schema` — tidak ada Zod |
| R-SCHEMA-02 | Schema hanya di `{domain}.schemas.ts` — tidak ada inline schema di programs |
| R-SCHEMA-03 | `Schema.decodeUnknown` di presentation layer, di-wrap ke `ValidationError` |
| R-SCHEMA-04 | Schema type di-export dengan `Schema.Schema.Type<typeof XxxSchema>` |

```typescript
// src/domain/user/user.schemas.ts

// Schema sebagai pure value — tidak ada class, tidak ada mutation
export const CreateUserSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name:  Schema.String.pipe(Schema.minLength(2), Schema.maxLength(100)),
  role:  Schema.optional(
    Schema.Union(Schema.Literal("admin"), Schema.Literal("member"), Schema.Literal("viewer")),
    { default: () => "member" as const },
  ),
})

// Type di-derive dari schema — single source of truth
export type CreateUserCommand = Schema.Schema.Type<typeof CreateUserSchema>

// Usage di presentation layer — pipe-able, composable
const program = pipe(
  Effect.tryPromise({ try: () => request.json(), catch: () => new ValidationError({ issues: "Invalid JSON" }) }),
  Effect.flatMap((body) =>
    Schema.decodeUnknown(CreateUserSchema)(body).pipe(
      Effect.mapError((e) => new ValidationError({ issues: e.message })),
    ),
  ),
  Effect.flatMap(createUserProgram),
)
```

---

## 7. TypeScript Rules

### 7.1 Strict Mode

```json
// tsconfig.json — wajib di semua project
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 7.2 Type Rules

| # | Rule |
|---|---|
| R-TS-01 | **Tidak ada `any`** — gunakan `unknown` lalu narrow |
| R-TS-02 | **Tidak ada `!` non-null assertion** — gunakan optional chaining atau explicit check |
| R-TS-03 | **Tidak ada `as` type assertion** kecuali branded type: `id as TUserId` |
| R-TS-04 | Branded type wajib untuk semua ID |
| R-TS-05 | Tidak ada `interface` — gunakan `type` (composable dengan `&`) |
| R-TS-06 | Union type untuk state yang mutual exclusive |
| R-TS-07 | Tidak ada `enum` — gunakan `const` object + `typeof` |

```typescript
// ❌ enum — tidak tree-shakeable, tidak composable
enum UserStatus { Active = "active", Inactive = "inactive" }

// ✅ const object — tree-shakeable, type-safe, nilai bisa di-iterate
export const USER_STATUS = {
  ACTIVE:   "active",
  INACTIVE: "inactive",
  SUSPENDED:"suspended",
} as const
export type TUserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]
// TUserStatus = "active" | "inactive" | "suspended"

// ✅ Branded type — mencegah ID tertukar di compile time
export type TUserId   = string & { readonly _brand: "UserId" }
export type TTenantId = string & { readonly _brand: "TenantId" }

// Compiler error jika tertukar:
const findUser = (id: TUserId) => ...
findUser(tenantId)  // ← Type error: TTenantId is not assignable to TUserId
```

### 7.3 Import Rules

| # | Rule |
|---|---|
| R-IMPORT-01 | Selalu gunakan path alias — tidak ada relative path `../../` lebih dari satu level |
| R-IMPORT-02 | Konfigurasi `paths` di `tsconfig.json` wajib ada |
| R-IMPORT-03 | Import type dengan `import type { }` |
| R-IMPORT-04 | Tidak ada `import *` |

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*":       ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@domain/*": ["src/domain/*"],
      "@infra/*":  ["src/infra/*"],
      "@ui/*":     ["src/ui/*"]
    }
  }
}
```

---

## 8. Domain Layer Rules

### 8.1 Types (`{domain}.types.ts`)

| # | Rule |
|---|---|
| R-TYPE-01 | Semua field `readonly` — tidak ada mutable field |
| R-TYPE-02 | Tidak ada function atau method dalam type — hanya data shape |
| R-TYPE-03 | ID type menggunakan branded type dari `shared/types/common.types.ts` |
| R-TYPE-04 | Tidak ada optional field `?` — gunakan `\| null` agar eksplisit |
| R-TYPE-05 | Props type untuk factory: `TXxxProps = Omit<TXxx, "id" \| "createdAt" \| "updatedAt">` |

```typescript
// ❌ Mutable fields, method di type
type TUser = {
  id: string                 // mutable
  name: string               // mutable
  getName(): string          // method — ini OOP, bukan FP data
}

// ✅ Immutable data shape, no behaviour
type TUser = {
  readonly id:        TUserId      // branded — tidak bisa tertukar dengan TTenantId
  readonly tenantId:  TTenantId
  readonly email:     string
  readonly name:      string
  readonly role:      TUserRole
  readonly status:    TUserStatus
  readonly createdAt: Date
  readonly updatedAt: Date
  // behaviour ada di UserModule, bukan di sini
}
```

### 8.2 Errors (`{domain}.errors.ts`)

| # | Rule |
|---|---|
| R-ERR-DOMAIN-01 | Semua error extend `Data.TaggedError` — tidak pernah `extends Error` biasa |
| R-ERR-DOMAIN-02 | Error hanya menyimpan data debugging — tidak ada message hardcode di constructor |
| R-ERR-DOMAIN-03 | Error tag `PascalCase`, diakhiri `Error` |
| R-ERR-DOMAIN-04 | Satu file error per domain |

```typescript
// ❌ extends Error — tidak typed, message hardcode, tidak composable
class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User with id ${id} was not found`)  // message di constructor = hardcode
  }
}
// Caller tidak tahu error apa yang dilempar — runtime surprise

// ✅ Data.TaggedError — ADT, typed, payload terpisah dari presentasi
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  readonly id: string   // data payload, bukan message
}>() {}
// Presentation layer yang format message — separation of concerns
// Effect.catchTag("UserNotFoundError", (err) => `User ${err.id} not found`)
```

### 8.3 Module (`{domain}.module.ts`)

| # | Rule |
|---|---|
| R-MOD-DOMAIN-01 | Factory function wajib: `Module.create(props)` → `Effect<TXxx, XxxError>` |
| R-MOD-DOMAIN-02 | Reconstitute function: `Module.reconstitute(raw)` → `TXxx` |
| R-MOD-DOMAIN-03 | Semua transformation return value baru — tidak mutate argument |
| R-MOD-DOMAIN-04 | Predicate/guard return `boolean` — prefix `is`, `can`, `has` |
| R-MOD-DOMAIN-05 | Tidak ada DB call atau HTTP call di module — pure business logic only |

### 8.4 Repository Interface (`{domain}.repository.ts`)

| # | Rule |
|---|---|
| R-REPO-01 | Interface adalah `Context.Tag` DI token — tidak pernah TypeScript `interface` biasa |
| R-REPO-02 | Method naming: `findById`, `findByEmail`, `findAll`, `save`, `update`, `delete`, `existsBy*` |
| R-REPO-03 | `findAll` menerima `TPaginationInput` dan return `TPaginated<T>` |
| R-REPO-04 | Semua method return `Effect<T, DatabaseError>` |
| R-REPO-05 | Tidak ada business logic di repository — hanya query dan row mapping |

```typescript
// ❌ TypeScript interface biasa — tidak bisa di-inject via Layer
interface IUserRepository {
  findById(id: string): Promise<TUser | null>  // Promise bukan Effect
}

// ✅ Context.Tag — type-safe DI token, injectable via Layer
export class IUserRepository extends Context.Tag("IUserRepository")<
  IUserRepository,
  {
    readonly findById:      (id: TUserId)    => Effect.Effect<TUser | null, DatabaseError>
    readonly findAll:       (tenantId: TTenantId, pagination: TPaginationInput) => Effect.Effect<TPaginated<TUser>, DatabaseError>
    readonly save:          (user: TUser)    => Effect.Effect<void, DatabaseError>
    readonly existsByEmail: (email: string, tenantId: TTenantId) => Effect.Effect<boolean, DatabaseError>
  }
>() {}
```

### 8.5 Programs (`{domain}.programs.ts`)

| # | Rule |
|---|---|
| R-PROG-01 | Setiap program adalah satu use case — single responsibility |
| R-PROG-02 | Program tidak boleh memanggil `runPromise` |
| R-PROG-03 | Return type eksplisit: `Effect<A, E, R>` lengkap |
| R-PROG-04 | Side effect cross-domain dispatch dari presentation layer via signal — bukan dari program |
| R-PROG-05 | Program hanya import dari `shared/` dan barrel `index.ts` domain lain |

### 8.6 DTO (`{domain}.dto.ts`)

| # | Rule |
|---|---|
| R-DTO-01 | DTO adalah output type — flat, serializable, semua `Date` → `string` |
| R-DTO-02 | Mapper `toXxxDto` adalah pure function — tidak ada Effect, tidak ada side effect |
| R-DTO-03 | DTO tidak pernah punya `hashedPassword`, token, atau data sensitif |
| R-DTO-04 | Program selalu return DTO — tidak pernah return domain type ke presentation layer |

```typescript
// Pure mapper — input domain type, output plain serializable object
export const toUserDto = (user: TUser): TUserDto => ({
  id:        user.id,
  email:     user.email,
  name:      user.name,
  role:      user.role,
  status:    user.status,
  createdAt: user.createdAt.toISOString(),  // Date → string
  updatedAt: user.updatedAt.toISOString(),
  // hashedPassword tidak ada di sini ← security
})
```

### 8.7 Public Barrel (`index.ts`)

| # | Rule |
|---|---|
| R-BARREL-01 | `index.ts` hanya export public API domain |
| R-BARREL-02 | Internal detail tidak di-export kecuali butuh di AppLayer (tandai comment) |
| R-BARREL-03 | `index.ts` tidak boleh ada logic — hanya `export` statement |

---

## 9. Infrastructure & Adapter Rules

### 9.1 Adapter Pattern Rules

| # | Rule |
|---|---|
| R-ADAPTER-01 | Setiap external service punya `IXxx` Context.Tag di domain atau `infra/` |
| R-ADAPTER-02 | Vendor type tidak boleh keluar dari file `*.live.ts` |
| R-ADAPTER-03 | Interface harus vendor-netral — tidak ada method yang menyebut nama vendor |
| R-ADAPTER-04 | Swap provider = ganti satu file `*Live.ts` + satu baris di `app.runtime.ts` |

```typescript
// ❌ Vendor type bocor ke interface — coupling ke Stripe
export class IBillingService extends Context.Tag("IBillingService")<
  IBillingService,
  {
    constructWebhookEvent: (p: string, s: string) => Effect.Effect<Stripe.Event, ...>
    //                                                              ^^^^^^^^^^^^ vendor type bocor
  }
>() {}

// ✅ Vendor-netral — interface tidak tahu Stripe ada
export type TBillingWebhookEvent = {
  readonly type:     string                      // vendor-netral
  readonly data:     unknown
  readonly metadata: Record<string, string>
}

export class IBillingService extends Context.Tag("IBillingService")<
  IBillingService,
  {
    constructWebhookEvent: (p: string, s: string) => Effect.Effect<TBillingWebhookEvent, BillingWebhookInvalidError>
  }
>() {}

// Di *.live.ts — translate vendor type ke domain type
const toWebhookEvent = (e: Stripe.Event): TBillingWebhookEvent => ({
  type:     e.type,
  data:     e.data.object,
  metadata: (e.data.object as { metadata?: Record<string, string> }).metadata ?? {},
})
// Stripe.Event tidak pernah keluar dari file ini
```

### 9.2 Database Rules

| # | Rule |
|---|---|
| R-DB-01 | Semua tabel tenant-scoped wajib punya `tenant_id` FK + `onDelete: "cascade"` |
| R-DB-02 | Semua tabel wajib punya `created_at` dan `updated_at` |
| R-DB-03 | Primary key selalu UUID |
| R-DB-04 | Index wajib untuk kolom yang sering di-query |
| R-DB-05 | `updated_at` di-set manual saat update |
| R-DB-06 | Semua tabel definition di satu file: `infra/db/drizzle.schema.ts` |

### 9.3 Environment Rules

| # | Rule |
|---|---|
| R-ENV-01 | **Tidak ada `process.env.XYZ` langsung** — semua lewat `AppConfig` |
| R-ENV-02 | `AppConfig` menggunakan Effect `Config` module — validated at startup |
| R-ENV-03 | Optional env var: `Config.option(Config.string("KEY"))` |
| R-ENV-04 | Secret env var: `Config.redacted(...)` untuk prevent logging |

```typescript
// ❌ Direct — tidak validated, bisa null, bisa leaked
const url = process.env.DATABASE_URL!    // runtime surprise
const key = process.env.STRIPE_KEY       // bisa undefined

// ✅ Via AppConfig — validated, typed, lazy evaluated
export const AppConfig = {
  databaseUrl:  Config.string("DATABASE_URL"),         // wajib ada
  stripeKey:    Config.redacted(Config.string("STRIPE_SECRET_KEY")), // sensitive, tidak di-log
  redisUrl:     Config.option(Config.string("REDIS_URL")),           // optional
  port:         Config.withDefault(Config.integer("PORT"), 4321),    // dengan default
} as const

// Usage di Layer — di-inject via Effect, tidak di akses langsung
const dbUrl = yield* AppConfig.databaseUrl  // Effect.Effect<string, ConfigError>
```

### 9.4 App Runtime Rules

| # | Rule |
|---|---|
| R-RUNTIME-01 | `ManagedRuntime` dibuat **sekali** di `infra/runtime/app.runtime.ts` |
| R-RUNTIME-02 | `AppLayer` adalah satu-satunya tempat semua Layer di-compose |
| R-RUNTIME-03 | `runApp()` adalah satu-satunya helper untuk execute Effect di presentation layer |

```typescript
// infra/runtime/app.runtime.ts — composition root

const AppLayer = Layer.mergeAll(
  UserRepositoryLive.pipe(Layer.provide(DrizzleClientLive)),
  TenantRepositoryLive.pipe(Layer.provide(DrizzleClientLive)),
  LuciaAuthServiceLive.pipe(Layer.provide(DrizzleClientLive)),
  CacheAdapterLive,
  MailerServiceLive,
  HttpAdapterLive,
  S3StorageAdapterLive,
  StripeBillingServiceLive.pipe(Layer.provide(DrizzleClientLive)),
)

export const AppRuntime = ManagedRuntime.make(AppLayer)

// Satu-satunya entry point dari Effect world ke async world
export const runApp = <A, E>(
  effect: Effect.Effect<A, E, Layer.Layer.Success<typeof AppLayer>>,
): Promise<A> => AppRuntime.runPromise(effect as never)
```

---

## 10. Presentation Layer Rules

### 10.1 API Route Rules

| # | Rule |
|---|---|
| R-API-01 | API route hanya: parse → validate → `runApp(program)` → Response |
| R-API-02 | **Tidak ada business logic** di API route |
| R-API-03 | `Effect.catchTags` harus exhaustive — semua error punya handler |
| R-API-04 | Response selalu `TApiResponse<T>` |
| R-API-05 | `requestId` dan `timestamp` selalu ada di response `meta` |
| R-API-06 | Log infra error dengan `console.error` sebelum return 500 |
| R-API-07 | Tidak ada `try/catch` di route — semua via `Effect.catchTags` |

```typescript
// ✅ API Route pattern — pure pipeline, tidak ada business logic
export const POST: APIRoute = async ({ request, locals }) => {
  const meta = { requestId: crypto.randomUUID(), timestamp: new Date().toISOString() }

  const program = pipe(
    // 1. Parse
    Effect.tryPromise({
      try:   () => request.json(),
      catch: () => new ValidationError({ issues: "Invalid JSON" }),
    }),
    // 2. Validate
    Effect.flatMap((body) =>
      Schema.decodeUnknown(CreateUserSchema)(body).pipe(
        Effect.mapError((e) => new ValidationError({ issues: e.message })),
      ),
    ),
    // 3. Execute use case
    Effect.flatMap(createUserProgram),
    // 4. Inject request-scoped context
    Effect.provideService(TenantContext, locals.tenant),
    // 5. Map success response
    Effect.map((data) => ({ __status: HTTP_STATUS.CREATED, body: { success: true, data, meta } })),
    // 6. Handle semua error — exhaustive
    Effect.catchTags({
      ValidationError: (e) =>
        Effect.succeed({ __status: HTTP_STATUS.BAD_REQUEST,
          body: { success: false, error: { _tag: e._tag, message: "Input tidak valid", details: e.issues }, meta } }),
      UserAlreadyExistsError: (e) =>
        Effect.succeed({ __status: HTTP_STATUS.CONFLICT,
          body: { success: false, error: { _tag: e._tag, message: `Email "${e.email}" sudah digunakan` }, meta } }),
      DatabaseError: (e) => {
        console.error("[POST /api/v1/users]", e.cause)
        return Effect.succeed({ __status: HTTP_STATUS.INTERNAL_ERROR,
          body: { success: false, error: { _tag: e._tag, message: "Server error" }, meta } })
      },
    }),
  )

  const { __status, body } = await runApp(program)
  return Response.json(body, { status: __status })
}
```

### 10.2 Middleware Rules

| # | Rule |
|---|---|
| R-MW-01 | Middleware hanya: resolve context → set `locals` → `next()` |
| R-MW-02 | Middleware menggunakan `runApp()` untuk Effect program |
| R-MW-03 | Urutan middleware: tenant → auth |
| R-MW-04 | Public path list sebagai konstanta |

---

## 11. Component Rules

### 11.1 General Rules

| # | Rule |
|---|---|
| R-COMP-01 | **Tidak ada class component** — semua function component |
| R-COMP-02 | **Tidak ada `this`** |
| R-COMP-03 | **Tidak ada inline style** — semua di `.module.css` |
| R-COMP-04 | Props type selalu `readonly` |
| R-COMP-05 | Tidak ada logic fetch langsung di komponen — ekstrak ke custom hook |
| R-COMP-06 | UI primitive (`ui/`) tidak boleh import dari `domain/` |

```tsx
// ❌ Class component + inline style
class UserCard extends React.Component<Props> {
  render() {
    return <div style={{ color: "red" }}>{this.props.name}</div>
  }
}

// ✅ Function component + CSS module
type TUserCardProps = { readonly name: string; readonly role: TUserRole }

export const UserCard = ({ name, role }: TUserCardProps) => (
  <div className={styles.card}>
    <span className={styles.name}>{name}</span>
    <span className={styles.role}>{role}</span>
  </div>
)
```

### 11.2 Custom Hook Rules

| # | Rule |
|---|---|
| R-HOOK-01 | Setiap form atau data-fetching logic di custom hook terpisah |
| R-HOOK-02 | Custom hook return object dengan named fields |
| R-HOOK-03 | Error state selalu `string \| null` — tidak pernah `Error` object |

**Catatan:** React component layer adalah **boundary antara FP world (Effect) dan imperative browser world**. `async/await` diizinkan di custom hook karena ini adalah client-side UI code yang berinteraksi dengan fetch API. `try/catch` digantikan dengan Result pattern agar tetap FP-idiomatic.

```typescript
// ✅ Custom hook — FP-idiomatic dengan Result pattern, tanpa try/catch
import { useState, useCallback } from "react"
import { ROUTES } from "@/shared/constants/api.constants"
import type { TApiResponse } from "@/shared/types/common.types"
import type { TUserDto } from "@/domain/user/index"
import type { CreateUserCommand } from "@/domain/user/index"

// Pure helper — fetch wrapper yang return Result, tidak throw
const postJson = async <T>(url: string, body: unknown): Promise<TApiResponse<T>> => {
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  }).catch(() => null)  // network error → null, tidak throw

  if (!res) return { success: false, error: { _tag: "NetworkError", message: "Gagal menghubungi server" } }
  if (!res.ok) return { success: false, error: { _tag: "HttpError", message: `HTTP ${res.status}` } }

  return res.json().catch(() => ({
    success: false,
    error: { _tag: "ParseError", message: "Response tidak valid" },
  }))
}

// Hook — state machine yang jelas, tidak ada hidden control flow
export const useCreateUser = (onSuccess?: (user: TUserDto) => void) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const submit = useCallback(async (data: CreateUserCommand) => {
    setIsLoading(true)
    setError(null)

    const result = await postJson<TUserDto>(ROUTES.USERS, data)

    // Explicit branching — tidak ada hidden throw
    if (!result.success || !result.data) {
      setError(result.error?.message ?? "Terjadi kesalahan")
    } else {
      onSuccess?.(result.data)
    }

    setIsLoading(false)
  }, [onSuccess])

  return { isLoading, error, submit }
}
```

### 11.3 CSS Module Rules

| # | Rule |
|---|---|
| R-CSS-01 | Satu `.module.css` per komponen |
| R-CSS-02 | Hanya CSS variables dari `styles/tokens.css` |
| R-CSS-03 | Tidak ada `!important` |
| R-CSS-04 | Class name `camelCase` |

---

## 12. Testing Standards

### 12.0 Testing Philosophy

Testing di codebase ini mengikuti **Testing Trophy** — bukan Testing Pyramid klasik. Mayoritas test ada di integration level (program + Layer), bukan unit level, karena Layer pattern membuat integration test sama mudahnya dengan unit test tanpa perlu mock framework.

```
         ▲
        /E2E\          sedikit — critical flows only
       /──────\
      / API    \       sedang — semua endpoint
     /──────────\
    / Integration\     banyak — programs + Layer
   /──────────────\
  / Unit           \   foundation — pure functions
 /──────────────────\
```

| Tipe Test | Tool | Scope | Jumlah | Speed |
|---|---|---|---|---|
| Unit | Vitest | Pure function, Module | Banyak | < 1ms/test |
| Integration | Vitest + Layer | Program + in-memory Layer | Banyak | < 10ms/test |
| Snapshot | Vitest | DTO shape, UI component | Sedang | < 5ms/test |
| API | Vitest + supertest / node:test | API route end-to-end | Sedang | < 100ms/test |
| Regression | Vitest | Bug fix validation | Per bug | Varies |
| E2E | Playwright | Critical user flow | Sedikit | 1-30s/test |
| Performance | Vitest bench | Hot path function | Optional | Varies |

---

### 12.1 General Rules

| # | Rule |
|---|---|
| R-TEST-01 | Test file di folder domain yang sama: `{domain}.test.ts` |
| R-TEST-02 | **Tidak ada `jest.mock`** — semua dependency via `Layer.succeed` |
| R-TEST-03 | Setiap program minimal: 1 happy path + 1 failure case per error type |
| R-TEST-04 | Setiap test isolated — tidak bergantung pada urutan eksekusi atau state global |
| R-TEST-05 | Test name format: `"{subject} — {scenario} — {expected outcome}"` |
| R-TEST-06 | Tidak ada `sleep` atau arbitrary timeout di test — gunakan `fake timers` |
| R-TEST-07 | Test data menggunakan factory function — tidak ada hardcoded fixture file |
| R-TEST-08 | Tidak ada test yang bergantung pada environment variable nyata — gunakan `Layer.succeed` untuk config |

---

### 12.2 Unit Test

**Target:** Pure functions di `*.module.ts` dan `*.dto.ts`

**Karakteristik:**
- Tidak ada async, tidak ada Effect.runPromise — gunakan `Effect.runSync` untuk sync Effect
- Tidak ada external dependency
- Satu assertion per test jika memungkinkan
- Cepat: < 1ms per test

```typescript
// src/domain/user/user.test.ts

import { describe, it, expect } from "vitest"
import { Effect, Exit } from "effect"
import { UserModule } from "./user.module"
import { toUserDto } from "./user.dto"
import type { TUser } from "./user.types"

// ── Test Data Factory — pure function, bukan fixture file ──────────────────
const makeUser = (overrides?: Partial<TUser>): TUser => ({
  id:             "user-1" as TUserId,
  tenantId:       "tenant-1" as TTenantId,
  email:          "test@example.com",
  hashedPassword: "hashed",
  name:           "Test User",
  role:           "member",
  status:         "active",
  avatarUrl:      null,
  createdAt:      new Date("2024-01-01"),
  updatedAt:      new Date("2024-01-01"),
  ...overrides,
})

// ── UserModule.create ──────────────────────────────────────────────────────
describe("UserModule.create", () => {
  it("berhasil membuat user dengan email valid", async () => {
    const result = await Effect.runPromise(
      UserModule.create({
        tenantId:       "tenant-1" as TTenantId,
        email:          "valid@example.com",
        hashedPassword: "hashed",
        name:           "Valid User",
        role:           "member",
        status:         "active",
        avatarUrl:      null,
      }),
    )

    expect(result.email).toBe("valid@example.com")
    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeInstanceOf(Date)
  })

  it("normalisasi email menjadi lowercase", async () => {
    const result = await Effect.runPromise(
      UserModule.create({
        tenantId:       "tenant-1" as TTenantId,
        email:          "UPPER@EXAMPLE.COM",
        hashedPassword: "hashed",
        name:           "Upper User",
        role:           "member",
        status:         "active",
        avatarUrl:      null,
      }),
    )

    expect(result.email).toBe("upper@example.com")
  })

  it("gagal dengan email tidak valid", async () => {
    const exit = await Effect.runPromiseExit(
      UserModule.create({
        tenantId:       "tenant-1" as TTenantId,
        email:          "bukan-email",
        hashedPassword: "hashed",
        name:           "Bad User",
        role:           "member",
        status:         "active",
        avatarUrl:      null,
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const err = exit.cause._tag === "Fail" ? exit.cause.error : null
      expect(err?._tag).toBe("InvalidEmailError")
      expect((err as { email: string }).email).toBe("bukan-email")
    }
  })
})

// ── UserModule.suspend ─────────────────────────────────────────────────────
describe("UserModule.suspend", () => {
  it("berhasil suspend user aktif", async () => {
    const user      = makeUser({ status: "active" })
    const suspended = await Effect.runPromise(UserModule.suspend(user))

    expect(suspended.status).toBe("suspended")
    expect(suspended.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime())
    // Immutability check — user asli tidak berubah
    expect(user.status).toBe("active")
  })

  it("gagal suspend user yang sudah suspended", async () => {
    const user = makeUser({ status: "suspended" })
    const exit = await Effect.runPromiseExit(UserModule.suspend(user))

    expect(Exit.isFailure(exit)).toBe(true)
  })
})

// ── UserModule guards ──────────────────────────────────────────────────────
describe("UserModule guards", () => {
  it("isActive return true untuk user aktif", () => {
    expect(UserModule.isActive(makeUser({ status: "active" }))).toBe(true)
  })

  it("isActive return false untuk user suspended", () => {
    expect(UserModule.isActive(makeUser({ status: "suspended" }))).toBe(false)
  })

  it("canManageBilling return true untuk owner dan admin", () => {
    expect(UserModule.canManageBilling(makeUser({ role: "owner" }))).toBe(true)
    expect(UserModule.canManageBilling(makeUser({ role: "admin" }))).toBe(true)
    expect(UserModule.canManageBilling(makeUser({ role: "member" }))).toBe(false)
    expect(UserModule.canManageBilling(makeUser({ role: "viewer" }))).toBe(false)
  })
})

// ── toUserDto ──────────────────────────────────────────────────────────────
describe("toUserDto", () => {
  it("memetakan TUser ke TUserDto dengan benar", () => {
    const user = makeUser()
    const dto  = toUserDto(user)

    expect(dto.id).toBe(user.id)
    expect(dto.email).toBe(user.email)
    expect(dto.createdAt).toBe(user.createdAt.toISOString())
    // Immutability — tidak ada field sensitif
    expect((dto as Record<string, unknown>).hashedPassword).toBeUndefined()
  })
})
```

---

### 12.3 Integration Test

**Target:** Programs di `*.programs.ts` menggunakan in-memory Layer

**Karakteristik:**
- Gunakan `Layer.succeed` untuk semua dependency
- Factory function untuk test layer yang bisa dikonfigurasi
- Test seluruh use case flow dari input sampai output
- Verifikasi side effects via captured calls

```typescript
// src/domain/auth/auth.test.ts

import { describe, it, expect, vi } from "vitest"
import { Effect, Exit, Layer } from "effect"
import { registerProgram, loginProgram } from "./auth.programs"
import { IUserRepository } from "@/domain/user/index"
import { IAuthService } from "./auth.service"
import { ITenantRepository } from "@/domain/tenant/index"
import { INotificationService } from "@/domain/notification/index"
import { TenantContext } from "@/domain/tenant/index"
import type { TUser } from "@/domain/user/index"
import type { TSession } from "./auth.types"

// ── In-memory store untuk stateful test ───────────────────────────────────
const makeInMemoryStore = () => {
  const users:   TUser[]   = []
  const tenants: TTenant[] = []
  const sessions: TSession[] = []

  return { users, tenants, sessions }
}

// ── Layer factories ────────────────────────────────────────────────────────
const makeUserRepo = (store: ReturnType<typeof makeInMemoryStore>) =>
  Layer.succeed(IUserRepository, {
    findById:      (id) => Effect.succeed(store.users.find((u) => u.id === id) ?? null),
    findByEmail:   (email, tenantId) => Effect.succeed(
      store.users.find((u) => u.email === email && u.tenantId === tenantId) ?? null,
    ),
    findAll:       () => Effect.succeed({ data: store.users, total: store.users.length, page: 1, limit: 20, totalPages: 1 }),
    save:          (user) => Effect.sync(() => { store.users.push(user) }),
    update:        (user) => Effect.sync(() => {
      const idx = store.users.findIndex((u) => u.id === user.id)
      if (idx !== -1) store.users[idx] = user
    }),
    delete:        (id) => Effect.sync(() => {
      const idx = store.users.findIndex((u) => u.id === id)
      if (idx !== -1) store.users.splice(idx, 1)
    }),
    existsByEmail: (email, tenantId) => Effect.succeed(
      store.users.some((u) => u.email === email && u.tenantId === tenantId),
    ),
  })

const makeAuthService = (store: ReturnType<typeof makeInMemoryStore>) =>
  Layer.succeed(IAuthService, {
    validateSession: (sessionId) => {
      const session = store.sessions.find((s) => s.id === sessionId)
      return session
        ? Effect.succeed({ sessionId: session.id, userId: session.userId, tenantId: session.tenantId, role: "member" as const })
        : Effect.fail(new SessionExpiredError({ sessionId }))
    },
    createSession: (userId, tenantId) =>
      Effect.sync(() => {
        const session: TSession = {
          id: `session-${Date.now()}`, userId, tenantId,
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
        }
        store.sessions.push(session)
        return session
      }),
    invalidateSession:     (sessionId) => Effect.sync(() => {
      const idx = store.sessions.findIndex((s) => s.id === sessionId)
      if (idx !== -1) store.sessions.splice(idx, 1)
    }),
    invalidateAllSessions: (userId) => Effect.sync(() => {
      store.sessions.splice(0, store.sessions.length, ...store.sessions.filter((s) => s.userId !== userId))
    }),
  })

const makeTenantRepo = (store: ReturnType<typeof makeInMemoryStore>) =>
  Layer.succeed(ITenantRepository, {
    findBySlug: (slug) => Effect.succeed(store.tenants.find((t) => t.slug === slug) ?? null),
    findById:   (id)   => Effect.succeed(store.tenants.find((t) => t.id === id) ?? null),
    save:       (t)    => Effect.sync(() => { store.tenants.push(t) }),
    update:     (t)    => Effect.sync(() => {
      const idx = store.tenants.findIndex((x) => x.id === t.id)
      if (idx !== -1) store.tenants[idx] = t
    }),
  })

// Notification spy — capture calls untuk verifikasi side effect
const makeNotifSpy = () => {
  const calls: unknown[] = []
  const layer = Layer.succeed(INotificationService, {
    create:      (p) => Effect.sync(() => { calls.push(p) }),
    markRead:    () => Effect.void,
    markAllRead: () => Effect.void,
    findUnread:  () => Effect.succeed([]),
  })
  return { layer, calls }
}

const makeTestLayer = (store: ReturnType<typeof makeInMemoryStore>, notifSpy: ReturnType<typeof makeNotifSpy>) =>
  Layer.mergeAll(
    makeUserRepo(store),
    makeAuthService(store),
    makeTenantRepo(store),
    notifSpy.layer,
  )

// ── registerProgram ────────────────────────────────────────────────────────
describe("registerProgram", () => {
  it("berhasil register — user dan session tersimpan di store", async () => {
    const store    = makeInMemoryStore()
    const notifSpy = makeNotifSpy()

    const result = await Effect.runPromise(
      registerProgram({ email: "new@test.com", password: "password123", name: "New User", tenantSlug: "new-tenant" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    expect(result.sessionId).toBeDefined()
    expect(result.userId).toBeDefined()
    expect(store.users).toHaveLength(1)
    expect(store.users[0]?.email).toBe("new@test.com")
    expect(store.sessions).toHaveLength(1)
    expect(store.tenants).toHaveLength(1)
    // Verifikasi welcome notification dijadwalkan (fire-and-forget)
    // Note: fork = async, verifikasi eventual dengan waitFor jika perlu
  })

  it("gagal jika email sudah terdaftar — store tidak berubah", async () => {
    const store    = makeInMemoryStore()
    const notifSpy = makeNotifSpy()

    // Seed existing user
    await Effect.runPromise(
      registerProgram({ email: "existing@test.com", password: "pass123456", name: "Exist", tenantSlug: "exist-tenant" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )
    const usersBefore = store.users.length

    const exit = await Effect.runPromiseExit(
      registerProgram({ email: "existing@test.com", password: "pass123456", name: "Dup", tenantSlug: "dup-tenant" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const err = exit.cause._tag === "Fail" ? exit.cause.error : null
      expect(err?._tag).toBe("EmailAlreadyRegisteredError")
    }
    // Store tidak berubah
    expect(store.users).toHaveLength(usersBefore)
  })

  it("gagal jika email format tidak valid", async () => {
    const store = makeInMemoryStore()
    const notifSpy = makeNotifSpy()

    const exit = await Effect.runPromiseExit(
      registerProgram({ email: "bukan-email", password: "pass123456", name: "Bad", tenantSlug: "bad-tenant" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    expect(store.users).toHaveLength(0)
  })
})

// ── loginProgram ───────────────────────────────────────────────────────────
describe("loginProgram", () => {
  it("berhasil login dengan credentials valid", async () => {
    const store    = makeInMemoryStore()
    const notifSpy = makeNotifSpy()
    const tenant: TTenant = { id: "t-1" as TTenantId, slug: "test", name: "Test", createdAt: new Date(), updatedAt: new Date() }
    store.tenants.push(tenant)

    // Register dulu
    await Effect.runPromise(
      registerProgram({ email: "login@test.com", password: "password123", name: "Login User", tenantSlug: "test" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    const result = await Effect.runPromise(
      loginProgram({ email: "login@test.com", password: "password123" })
        .pipe(
          Effect.provide(makeTestLayer(store, notifSpy)),
          Effect.provideService(TenantContext, tenant),
        ),
    )

    expect(result.sessionId).toBeDefined()
    expect(store.sessions).toHaveLength(2)  // register + login
  })

  it("gagal login dengan password salah", async () => {
    const store    = makeInMemoryStore()
    const notifSpy = makeNotifSpy()
    const tenant: TTenant = { id: "t-1" as TTenantId, slug: "test", name: "Test", createdAt: new Date(), updatedAt: new Date() }
    store.tenants.push(tenant)

    await Effect.runPromise(
      registerProgram({ email: "login@test.com", password: "correct-pass", name: "User", tenantSlug: "test" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    const exit = await Effect.runPromiseExit(
      loginProgram({ email: "login@test.com", password: "wrong-pass" })
        .pipe(
          Effect.provide(makeTestLayer(store, notifSpy)),
          Effect.provideService(TenantContext, tenant),
        ),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      const err = exit.cause._tag === "Fail" ? exit.cause.error : null
      expect(err?._tag).toBe("InvalidCredentialsError")
    }
  })
})
```

---

### 12.4 Snapshot Test

**Target:** DTO shape, API response structure, React component output

**Karakteristik:**
- Verifikasi bahwa output tidak berubah secara tidak sengaja
- Snapshot disimpan di `__snapshots__/` dalam folder domain
- Update snapshot secara eksplisit: `pnpm test --update-snapshots`
- **Jangan** snapshot seluruh komponen — snapshot bagian yang penting saja

```typescript
// src/domain/user/user.test.ts — tambahkan ke file yang sudah ada

import { expect, it, describe } from "vitest"
import { toUserDto } from "./user.dto"

describe("toUserDto — snapshot", () => {
  it("shape DTO tidak berubah", () => {
    const user = makeUser({
      id:        "usr-snapshot-1" as TUserId,
      email:     "snap@test.com",
      name:      "Snapshot User",
      role:      "admin",
      status:    "active",
      createdAt: new Date("2024-01-15T10:00:00.000Z"),
      updatedAt: new Date("2024-01-15T10:00:00.000Z"),
    })

    expect(toUserDto(user)).toMatchInlineSnapshot(`
      {
        "avatarUrl": null,
        "createdAt": "2024-01-15T10:00:00.000Z",
        "email": "snap@test.com",
        "id": "usr-snapshot-1",
        "name": "Snapshot User",
        "role": "admin",
        "status": "active",
        "updatedAt": "2024-01-15T10:00:00.000Z",
      }
    `)
    // hashedPassword tidak ada di snapshot — security check implicit
  })
})
```

```typescript
// src/domain/billing/billing.test.ts — snapshot API response structure

describe("handleWebhookProgram response shape — snapshot", () => {
  it("event type checkout.session.completed shape", () => {
    const event: TBillingWebhookEvent = {
      type: "checkout.session.completed",
      data: { subscriptionId: "sub-123", customerId: "cus-456" },
      metadata: { tenantId: "t-1", userId: "u-1" },
    }

    // Snapshot event shape — verifikasi field tidak berubah
    expect(event).toMatchInlineSnapshot(`
      {
        "data": {
          "customerId": "cus-456",
          "subscriptionId": "sub-123",
        },
        "metadata": {
          "tenantId": "t-1",
          "userId": "u-1",
        },
        "type": "checkout.session.completed",
      }
    `)
  })
})
```

```tsx
// src/domain/user/components/UserCard/UserCard.test.tsx — component snapshot

import { render } from "@testing-library/react"
import { UserCard } from "./UserCard"

describe("UserCard — snapshot", () => {
  it("render dengan data lengkap", () => {
    const { container } = render(
      <UserCard name="Test User" role="admin" status="active" />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it("render badge role berbeda-beda", () => {
    const roles = ["owner", "admin", "member", "viewer"] as const
    roles.forEach((role) => {
      const { getByText } = render(<UserCard name="User" role={role} status="active" />)
      expect(getByText(role)).toMatchSnapshot()
    })
  })
})
```

**Aturan snapshot:**
- Gunakan `toMatchInlineSnapshot` untuk data kecil (< 20 baris) — lebih mudah di-review di PR
- Gunakan `toMatchSnapshot` (file) untuk komponen besar
- Selalu verifikasi bahwa tidak ada field sensitif di snapshot
- Snapshot harus di-commit — bukan di `.gitignore`

---

### 12.5 API Test

**Target:** API routes di `pages/api/`

**Karakteristik:**
- Test seluruh HTTP lifecycle: request parsing, validation, response format
- Gunakan `fetch` langsung ke test server atau Astro's `testRequest` helper
- Verifikasi HTTP status code, response body shape, dan headers
- Mock Layer untuk isolasi dari database nyata

```typescript
// src/pages/api/v1/users/users.api.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { Effect, Layer } from "effect"

// Helper untuk membuat fake request — FP style
const makeRequest = (opts: {
  method:  string
  url:     string
  body?:   unknown
  headers?: Record<string, string>
  locals?: { tenant?: TTenant; session?: TSessionUser }
}): Request => new Request(`http://localhost${opts.url}`, {
  method:  opts.method,
  headers: { "Content-Type": "application/json", ...opts.headers },
  body:    opts.body ? JSON.stringify(opts.body) : undefined,
})

// ── POST /api/v1/users ─────────────────────────────────────────────────────
describe("POST /api/v1/users", () => {
  const validBody = {
    email: "newuser@test.com",
    name:  "New User",
    role:  "member",
  }

  it("201 — berhasil membuat user baru", async () => {
    const { POST } = await import("./index")

    const req = makeRequest({ method: "POST", url: "/api/v1/users", body: validBody })
    const res = await POST({ request: req, locals: { tenant: mockTenant, session: mockSession } } as never)

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.email).toBe("newuser@test.com")
    expect(body.meta.requestId).toBeDefined()
    expect(body.meta.timestamp).toBeDefined()
    // Pastikan tidak ada field sensitif
    expect(body.data.hashedPassword).toBeUndefined()
  })

  it("400 — body bukan JSON valid", async () => {
    const { POST } = await import("./index")

    const req = new Request("http://localhost/api/v1/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    "ini bukan json{{{",
    })
    const res = await POST({ request: req, locals: { tenant: mockTenant, session: mockSession } } as never)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error._tag).toBeDefined()
  })

  it("400 — email tidak valid", async () => {
    const { POST } = await import("./index")

    const req = makeRequest({ method: "POST", url: "/api/v1/users", body: { ...validBody, email: "bukan-email" } })
    const res = await POST({ request: req, locals: { tenant: mockTenant, session: mockSession } } as never)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.details).toBeDefined()
  })

  it("409 — email sudah digunakan", async () => {
    const { POST } = await import("./index")

    // First request
    const req1 = makeRequest({ method: "POST", url: "/api/v1/users", body: validBody })
    await POST({ request: req1, locals: { tenant: mockTenant, session: mockSession } } as never)

    // Duplicate
    const req2 = makeRequest({ method: "POST", url: "/api/v1/users", body: validBody })
    const res  = await POST({ request: req2, locals: { tenant: mockTenant, session: mockSession } } as never)

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("response selalu punya meta.requestId dan meta.timestamp", async () => {
    const { POST } = await import("./index")

    // Test di semua status — success dan error
    const successReq = makeRequest({ method: "POST", url: "/api/v1/users", body: validBody })
    const successRes = await POST({ request: successReq, locals: { tenant: mockTenant, session: mockSession } } as never)
    const successBody = await successRes.json()

    expect(successBody.meta?.requestId).toBeDefined()
    expect(successBody.meta?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const errorReq = makeRequest({ method: "POST", url: "/api/v1/users", body: { email: "bad" } })
    const errorRes = await POST({ request: errorReq, locals: { tenant: mockTenant, session: mockSession } } as never)
    const errorBody = await errorRes.json()

    expect(errorBody.meta?.requestId).toBeDefined()
  })
})

// ── GET /api/v1/users/:id ──────────────────────────────────────────────────
describe("GET /api/v1/users/[id]", () => {
  it("200 — user ditemukan", async () => {
    const { GET } = await import("./[id]")

    const req = makeRequest({ method: "GET", url: "/api/v1/users/user-1" })
    const res = await GET({
      request: req,
      params:  { id: "user-1" },
      locals:  { tenant: mockTenant, session: mockSession },
    } as never)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe("user-1")
  })

  it("404 — user tidak ditemukan", async () => {
    const { GET } = await import("./[id]")

    const req = makeRequest({ method: "GET", url: "/api/v1/users/nonexistent" })
    const res = await GET({
      request: req,
      params:  { id: "nonexistent" },
      locals:  { tenant: mockTenant, session: mockSession },
    } as never)

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error._tag).toBe("UserNotFoundError")
  })
})
```

---

### 12.6 Regression Test

**Target:** Bug yang sudah pernah terjadi — mencegah regression

**Karakteristik:**
- Satu test per bug yang fix
- Test name mencantumkan nomor issue atau tanggal: `"[BUG-123] ..."`
- Test ditulis **sebelum** fix — membuktikan bug ada, lalu fix, lalu test pass
- Tidak boleh dihapus meski sudah lama — ini dokumentasi hidup dari bug history

```typescript
// src/domain/user/user.test.ts

describe("regression tests", () => {
  it("[BUG-42] email dengan trailing whitespace seharusnya dianggap sama dengan email tanpa whitespace", async () => {
    // Bug: user bisa register dua kali dengan "user@test.com" dan "user@test.com  "
    // Fix: normalisasi email (trim) sebelum simpan dan cek uniqueness
    const store    = makeInMemoryStore()
    const notifSpy = makeNotifSpy()

    await Effect.runPromise(
      registerProgram({ email: "user@test.com", password: "pass123456", name: "User 1", tenantSlug: "t1" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    const exit = await Effect.runPromiseExit(
      registerProgram({ email: "user@test.com  ", password: "pass123456", name: "User 2", tenantSlug: "t2" })
        .pipe(Effect.provide(makeTestLayer(store, notifSpy))),
    )

    // Harus gagal — bukan register dua akun berbeda
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("[BUG-67] suspend user yang sudah inactive seharusnya berhasil (bukan gagal dengan UserSuspendedError)", async () => {
    // Bug: UserModule.suspend hanya check status === "suspended"
    // Fix: check suspended saja — inactive user boleh di-suspend
    const inactiveUser = makeUser({ status: "inactive" })
    const result       = await Effect.runPromise(UserModule.suspend(inactiveUser))

    expect(result.status).toBe("suspended")
  })

  it("[BUG-89] toUserDto seharusnya tidak include hashedPassword di output", () => {
    // Bug: toUserDto sempat meng-spread seluruh TUser object
    const user = makeUser()
    const dto  = toUserDto(user) as Record<string, unknown>

    expect(dto["hashedPassword"]).toBeUndefined()
    expect(dto["password"]).toBeUndefined()
  })
})
```

**Aturan regression test:**
- Selalu buat regression test **saat fix bug** — bukan setelah deploy
- Test harus fail sebelum fix diterapkan
- Comment berisi link ke issue tracker jika ada: `// BUG-42: https://github.com/org/repo/issues/42`

---

### 12.7 E2E Test

**Target:** Critical user flows — register, login, CRUD utama, billing, logout

**Karakteristik:**
- Gunakan Playwright
- Test berjalan di browser nyata — tidak ada mock
- Sedikit test tapi cover critical path
- Setiap test memulai dengan state bersih (fresh user/tenant)
- Paralel execution dengan worker isolation

```typescript
// tests/e2e/auth.spec.ts

import { test, expect } from "@playwright/test"

// Helper — pure function factory untuk test data
const makeEmail = (prefix: string) => `${prefix}-${Date.now()}@test.com`

test.describe("Authentication Flow", () => {
  test("register → login → dashboard → logout", async ({ page }) => {
    const email    = makeEmail("e2e-auth")
    const password = "TestPassword123!"
    const name     = "E2E Test User"
    const slug     = `tenant-${Date.now()}`

    // 1. Register
    await page.goto("/register")
    await page.fill('[name="name"]',       name)
    await page.fill('[name="email"]',      email)
    await page.fill('[name="password"]',   password)
    await page.fill('[name="tenantSlug"]', slug)
    await page.click('[type="submit"]')

    // Verifikasi redirect ke dashboard setelah register
    await expect(page).toHaveURL("/dashboard", { timeout: 5000 })
    await expect(page.locator('[data-testid="user-name"]')).toContainText(name)

    // 2. Logout
    await page.click('[data-testid="logout-button"]')
    await expect(page).toHaveURL("/login")

    // 3. Login kembali
    await page.fill('[name="email"]',    email)
    await page.fill('[name="password"]', password)
    await page.click('[type="submit"]')

    await expect(page).toHaveURL("/dashboard")
    await expect(page.locator('[data-testid="user-name"]')).toContainText(name)
  })

  test("login dengan credentials salah menampilkan pesan error", async ({ page }) => {
    await page.goto("/login")
    await page.fill('[name="email"]',    "nonexistent@test.com")
    await page.fill('[name="password"]', "wrongpassword")
    await page.click('[type="submit"]')

    await expect(page.locator('[role="alert"]')).toBeVisible()
    await expect(page).toHaveURL("/login")  // tidak redirect
  })

  test("halaman protected redirect ke login jika tidak autentikasi", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL("/login")
  })
})
```

```typescript
// tests/e2e/billing.spec.ts

import { test, expect } from "@playwright/test"

test.describe("Billing Flow", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" })  // pre-authenticated

  test("navigasi ke billing settings menampilkan plan saat ini", async ({ page }) => {
    await page.goto("/settings/billing")
    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible()
    await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible()
  })

  test("klik upgrade membuka Stripe checkout", async ({ page, context }) => {
    await page.goto("/settings/billing")

    // Monitor redirect ke Stripe
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.click('[data-testid="upgrade-button"]'),
    ])

    await expect(newPage.url()).toContain("checkout.stripe.com")
  })
})
```

```typescript
// playwright.config.ts

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir:  "./tests/e2e",
  timeout:  30_000,
  retries:  process.env.CI ? 2 : 0,
  workers:  process.env.CI ? 1 : undefined,

  use: {
    baseURL:       "http://localhost:4321",
    trace:         "on-first-retry",
    screenshot:    "only-on-failure",
    video:         "retain-on-failure",
  },

  projects: [
    // Setup — create authenticated user state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name:         "chromium",
      use:          { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "pnpm dev",
    url:     "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
})
```

```typescript
// tests/e2e/auth.setup.ts — create reusable auth state

import { test as setup } from "@playwright/test"
import path from "path"

const authFile = path.join(import.meta.dirname, ".auth/user.json")

setup("authenticate", async ({ page }) => {
  const email    = `setup-${Date.now()}@test.com`
  const password = "SetupPassword123!"

  await page.goto("/register")
  await page.fill('[name="name"]',       "Setup User")
  await page.fill('[name="email"]',      email)
  await page.fill('[name="password"]',   password)
  await page.fill('[name="tenantSlug"]', `setup-${Date.now()}`)
  await page.click('[type="submit"]')
  await page.waitForURL("/dashboard")

  // Simpan auth state — digunakan oleh test yang butuh login
  await page.context().storageState({ path: authFile })
})
```

---

### 12.8 Performance Test

**Target:** Hot path functions — serialization, pagination, heavy computation

**Karakteristik:**
- Gunakan Vitest `bench` API
- Jalankan hanya dengan `pnpm test:bench` — tidak di CI reguler
- Baseline ditetapkan saat pertama kali test ditulis
- Alert jika ada regression > 20% dari baseline

```typescript
// src/domain/user/user.bench.ts

import { bench, describe } from "vitest"
import { Effect } from "effect"
import { UserModule } from "./user.module"
import { toUserDto } from "./user.dto"

const sampleUser = {
  id: "user-1" as TUserId,
  tenantId: "tenant-1" as TTenantId,
  email: "bench@test.com",
  hashedPassword: "hashed",
  name: "Bench User",
  role: "member" as const,
  status: "active" as const,
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const manyUsers = Array.from({ length: 1000 }, (_, i) => ({
  ...sampleUser,
  id: `user-${i}` as TUserId,
  email: `user${i}@test.com`,
}))

describe("toUserDto performance", () => {
  bench("single user dto mapping", () => {
    toUserDto(sampleUser)
  })

  bench("1000 users dto mapping", () => {
    manyUsers.map(toUserDto)
  })
})

describe("UserModule.create performance", () => {
  bench("create user", async () => {
    await Effect.runPromise(
      UserModule.create({
        ...sampleUser,
        email: `bench-${Math.random()}@test.com`,
      }),
    )
  })
})
```

```json
// package.json — tambahkan script
{
  "scripts": {
    "test:bench": "vitest bench",
    "test:bench:compare": "vitest bench --compare"
  }
}
```

---

### 12.9 Test File Structure

Struktur file test di dalam folder domain:

```
src/domain/user/
├── user.types.ts
├── user.module.ts
├── user.repository.ts
├── user.repository.live.ts
├── user.programs.ts
├── user.dto.ts
├── user.test.ts          # Unit + Integration + Snapshot + Regression
├── user.bench.ts         # Performance (optional)
└── index.ts

tests/
├── e2e/
│   ├── auth.setup.ts     # Setup auth state
│   ├── auth.spec.ts      # Auth flow E2E
│   ├── billing.spec.ts   # Billing flow E2E
│   ├── user.spec.ts      # User management E2E
│   └── .auth/
│       └── user.json     # Saved auth state (gitignored)
└── helpers/
    ├── make-request.ts   # Pure factory — build test Request
    └── make-fixture.ts   # Pure factory — build test data
```

---

### 12.10 Test Runner Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals:     true,
    environment: "node",
    include:     ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude:     ["src/**/*.bench.ts", "tests/e2e/**"],
    coverage: {
      provider:    "v8",
      reporter:    ["text", "lcov", "html"],
      include:     ["src/**/*.ts", "src/**/*.tsx"],
      exclude:     ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/index.ts"],
      thresholds: {
        // Per-layer coverage targets dari section 12.11
        lines:      70,
        functions:  70,
        branches:   65,
        statements: 70,
      },
    },
    // Fake timer untuk test yang bergantung pada Date/setTimeout
    fakeTimers: {
      toFake: ["Date"],
    },
  },
})
```

---

### 12.11 Coverage Targets

| Layer | Lines | Functions | Branches | Notes |
|---|---|---|---|---|
| Domain module (`*.module.ts`) | ≥ 90% | ≥ 90% | ≥ 85% | Pure functions — mudah dicoverage |
| Domain errors (`*.errors.ts`) | ≥ 100% | ≥ 100% | — | Semua error harus dipakai |
| Programs (`*.programs.ts`) | ≥ 80% | ≥ 80% | ≥ 75% | Semua branch logis |
| DTO mapper (`*.dto.ts`) | ≥ 95% | ≥ 95% | — | Mapping harus selalu benar |
| Infrastructure Live (`*.live.ts`) | ≥ 60% | ≥ 60% | ≥ 50% | Mostly integration test |
| API Routes (`pages/api/**`) | ≥ 70% | ≥ 70% | ≥ 65% | Semua status code |
| UI Components | ≥ 50% | ≥ 50% | — | Snapshot + render test |
| **Global minimum** | **70%** | **70%** | **65%** | CI fail jika di bawah ini |

---

### 12.12 CI Test Pipeline Order

```yaml
# Urutan test di CI — dari paling cepat ke paling lambat
steps:
  - name: Unit + Integration + Snapshot
    run: pnpm test:run
    # Semua test di src/**/*.test.ts
    # Target: < 30 detik

  - name: Coverage Check
    run: pnpm test:run --coverage
    # Fail jika di bawah threshold

  - name: API Test
    run: pnpm test:api
    # Test terhadap test server
    # Target: < 60 detik

  - name: Build
    run: pnpm build
    # Harus pass sebelum E2E

  - name: E2E Test
    run: pnpm test:e2e
    # Berjalan di CI dengan browser headless
    # Target: < 5 menit
```

---

## 13. Tooling Rules

### 13.1 Biome

Wajib di semua project. Tidak ada ESLint, tidak ada Prettier.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["src/**/*.d.ts", "dist/**", ".astro/**", ".next/**"]
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables":        "error",
        "noUnusedImports":          "error",
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog":  "warn"
      },
      "style": {
        "noNonNullAssertion": "error",
        "useConst":           "error",
        "noVar":              "error"
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      }
    }
  },
  "formatter": {
    "enabled":    true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth":   100,
    "lineEnding":  "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle":       "double",
      "trailingCommas":   "all",
      "semicolons":       "asNeeded",
      "arrowParentheses": "always"
    }
  }
}
```

### 13.2 lefthook

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx}"
      run: pnpm biome check --write {staged_files}
      stage_fixed: true
    typecheck:
      run: pnpm typecheck

pre-push:
  commands:
    test:
      run: pnpm test:run
    deps:
      run: pnpm check:deps
```

### 13.3 `package.json` Standard Scripts

```json
{
  "scripts": {
    "check":       "biome check ./src",
    "check:fix":   "biome check --write ./src",
    "typecheck":   "tsc --noEmit",
    "check:deps":  "depcruise src --config .dependency-cruiser.cjs",
    "ci":          "biome ci ./src && tsc --noEmit && depcruise src --config .dependency-cruiser.cjs",
    "test":        "vitest",
    "test:run":    "vitest run",
    "test:e2e":    "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:push":     "drizzle-kit push",
    "db:studio":   "drizzle-kit studio"
  }
}
```

---

## 14. Git & CI Rules

### 14.1 Commit Convention

Format: `{type}({scope}): {description}`

| Type | Kapan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `refactor` | Perubahan kode tanpa ubah behaviour |
| `test` | Tambah/ubah test |
| `chore` | Tooling, dependency, config |
| `docs` | Dokumentasi |
| `perf` | Performance improvement |

Scope menggunakan nama domain: `feat(auth): add logout endpoint`

### 14.2 Branch Convention

| Branch | Purpose |
|---|---|
| `main` | Production — protected, require PR |
| `dev` | Integration branch |
| `feat/{domain}/{description}` | Feature branch |
| `fix/{domain}/{description}` | Bug fix |
| `chore/{description}` | Tooling/config |

### 14.3 CI Pipeline

Setiap PR wajib pass semua step:

```yaml
steps:
  - run: pnpm install --frozen-lockfile
  - run: pnpm biome ci ./src       # linting + formatting
  - run: pnpm typecheck             # type safety
  - run: pnpm check:deps            # no cycles
  - run: pnpm test:run              # unit + integration
  - run: pnpm build                 # build artifact
```

---

## 15. Violation Severity & Enforcement

### 15.1 Severity Levels

| Level | Arti | Contoh | Action |
|---|---|---|---|
| 🔴 **CRITICAL** | Break production atau security | `process.env` tanpa validation, `any` di auth handler, hardcoded secret | Block merge, fix sekarang |
| 🟠 **ERROR** | Melanggar arsitektur | Cycle dependency, `runPromise` di domain, deep import antar domain, vendor type bocor ke interface | Block merge, fix sebelum PR |
| 🟡 **WARN** | Degradasi maintainability | Missing `readonly`, inline style, magic string, `enum` | Comment di PR, fix di follow-up |
| 🔵 **INFO** | Best practice deviation | Missing `as const`, suboptimal naming | Noted, fix jika ada waktu |

### 15.2 Auto-enforced di CI

- `biome ci` → `any`, non-null assertion, unused imports, `var`, mutation
- `tsc --noEmit` → type error, missing return type
- `dependency-cruiser` → cycle, wrong layer import, deep cross-domain import

### 15.3 PR Reviewer Checklist

Copy checklist ini ke setiap PR description:

```
### Architecture
- [ ] Tidak ada class baru di luar Data.TaggedError dan Context.Tag
- [ ] Tidak ada cross-domain deep import — hanya dari index.ts
- [ ] Tidak ada cycle baru (pnpm check:deps pass)
- [ ] Domain baru punya index.ts yang proper

### Functional Programming
- [ ] Semua transformation return value baru — tidak ada mutation
- [ ] Tidak ada throw atau try/catch di domain/infra layer
- [ ] Semua function pure — output hanya bergantung pada input
- [ ] Module object ditutup dengan as const

### Effect
- [ ] runPromise hanya di pages/api dan app.runtime.ts
- [ ] Error type di program signature lengkap
- [ ] Effect.catchTags di route exhaustive
- [ ] Layer baru terdaftar di AppLayer

### Data & Types
- [ ] Semua field readonly
- [ ] Tidak ada any — sudah di-catch Biome
- [ ] Tidak ada vendor type bocor ke interface
- [ ] DTO tidak punya data sensitif

### Test
- [ ] Program baru punya unit + integration test
- [ ] Bug fix punya regression test
- [ ] Test menggunakan Layer.succeed — bukan jest.mock
- [ ] Snapshot test di-update jika ada perubahan DTO shape
- [ ] Coverage tidak turun dari threshold
```

### 15.4 Exception Process

Jika ada alasan valid untuk melanggar rule:

1. Buat `EXCEPTIONS.md` di root project
2. Catat: rule yang dilanggar, alasan, alternative yang dipertimbangkan, tanggal, engineer
3. Approval dari tech lead
4. Comment di kode: `// EXCEPTION: {rule-id} — {alasan singkat}`

```typescript
// EXCEPTION: R-FP-01 — LuciaAuth v3 membutuhkan class untuk DrizzlePostgreSQLAdapter
// Alternative: custom adapter non-class tidak tersedia di versi ini
// Approved by: {tech-lead} on {date}
class LuciaDbAdapter extends DrizzlePostgreSQLAdapter { }
```

---

## Appendix A — Quick Reference

```
✅ GUNAKAN                               ❌ HINDARI
────────────────────────────────────    ────────────────────────────────────────
const Module = { fn } as const          class Domain { method() {} }
{ ...obj, field: newValue }             obj.field = newValue  // mutation
[...arr, newItem]                       arr.push(newItem)     // mutation
Effect.fail(new TaggedError(...))       throw new Error(...)
Effect.tryPromise({ try, catch })       try { } catch { }
Layer.succeed(IRepo, { ... })           jest.mock("./repo")
import { X } from "@/domain/auth/index" import { X } from "@/domain/auth/auth.module"
Config.string("KEY")                    process.env.KEY
readonly field: string                  field: string
pipe(x, fn1, fn2)                       x.method1().method2()
yield* IService  // inject via Layer    new ConcreteService()
TBillingWebhookEvent  // vendor-netral  Stripe.Event di interface
type TStatus = "a" | "b" as const       enum TStatus { A = "a" }
```

## Appendix B — Dependency Flow

```
shared/
  TId, TTenantId, TUserId, TUserRole, TSessionUser
  DatabaseError, CacheError, HttpError
  HTTP_STATUS, ROUTES, AppConfig
        │
        ▼ (semua domain import dari shared)
  tenant/          user/
  TTenant          TUser · UserModule · RBAC
  TenantContext
        │             │
        └──────┬───────┘
               ▼
         auth/        notification/   billing/    storage/
         session      in-app·email    subscription upload
               │
               ▼
         pages/api/ + middleware/   (boleh import semua)
               │
               ▼
         infra/runtime/             (composition root — wire semua Layer)
```

## Appendix C — class Syntax Yang Diizinkan

Hanya **dua** penggunaan `class` yang diizinkan di codebase ini:

```typescript
// 1. Data.TaggedError — ADT untuk typed errors
//    Tidak ada method, tidak ada this, tidak ada mutable state
//    Hanya: tag unik + readonly data payload
export class XxxError extends Data.TaggedError("XxxError")<{
  readonly field: string
}>() {}

// 2. Context.Tag — DI token untuk dependency injection
//    Tidak ada method, tidak ada state — hanya type-level identifier
export class IXxxService extends Context.Tag("IXxxService")<
  IXxxService,
  {
    readonly method: (input: TInput) => Effect.Effect<TOutput, TError>
  }
>() {}

// Selain dua di atas → refactor ke module pattern
```

## Appendix D — New Domain Checklist

Checklist ketika membuat domain baru:

```bash
# Bootstrap files
mkdir -p src/domain/{name}/components
touch src/domain/{name}/{name}.types.ts       # 1. Define T{Name} type — semua readonly
touch src/domain/{name}/{name}.errors.ts      # 2. Define TaggedError ADTs
touch src/domain/{name}/{name}.module.ts      # 3. Implement {Name}Module — pure functions
touch src/domain/{name}/{name}.repository.ts  # 4. Define I{Name}Repository Context.Tag
touch src/domain/{name}/{name}.repository.live.ts  # 5. Implement {Name}RepositoryLive
touch src/domain/{name}/{name}.schemas.ts     # 6. Define effect/Schema untuk input
touch src/domain/{name}/{name}.dto.ts         # 7. Define DTO + pure toDto mapper
touch src/domain/{name}/{name}.programs.ts    # 8. Implement Effect.gen programs
touch src/domain/{name}/{name}.test.ts        # 9. Write tests dengan Layer.succeed
touch src/domain/{name}/index.ts              # 10. Export public barrel

# Setelah files dibuat:
# 11. Tambah tabel di infra/db/drizzle.schema.ts
# 12. Wire *Live Layer di infra/runtime/app.runtime.ts
# 13. Run: pnpm check:deps  ← pastikan tidak ada cycle baru
# 14. Run: pnpm typecheck   ← pastikan types valid
# 15. Run: pnpm test:run    ← pastikan tests pass
```

---

## 16. FP Patterns Reference

Section ini adalah referensi cepat pola FP yang sering dipakai — lengkap dengan before/after.

### 16.1 Replacing Loops dengan Higher-Order Functions

```typescript
// ❌ Imperative loop — mutation, tidak composable
const getActiveUsers = (users: TUser[]): TUser[] => {
  const result: TUser[] = []
  for (const user of users) {
    if (user.status === "active") result.push(user)
  }
  return result
}

// ✅ Declarative — pure, composable
const getActiveUsers = (users: readonly TUser[]): readonly TUser[] =>
  users.filter((u) => u.status === "active")

// ✅ Reusable predicate — bisa di-compose
const isActive   = (u: TUser): boolean => u.status === "active"
const isAdmin    = (u: TUser): boolean => u.role === "admin"
const isActiveAdmin = (u: TUser): boolean => isActive(u) && isAdmin(u)

const activeAdmins = users.filter(isActiveAdmin)
```

### 16.2 Replacing Nested `if/else` dengan pipe + Effect

```typescript
// ❌ Nested if/else — hard to read, hidden control flow
async function processUser(id: string) {
  const user = await db.findById(id)
  if (!user) {
    throw new Error("not found")
  }
  if (user.status === "suspended") {
    throw new Error("suspended")
  }
  const updated = { ...user, role: "admin" }
  await db.update(updated)
  return updated
}

// ✅ Effect pipeline — flat, composable, all errors typed
const processUser = (id: TUserId): Effect.Effect<
  TUser,
  UserNotFoundError | UserSuspendedError | DatabaseError,
  IUserRepository
> =>
  Effect.gen(function* () {
    const repo = yield* IUserRepository
    const user = yield* repo.findById(id)

    if (!user) yield* Effect.fail(new UserNotFoundError({ id }))
    const updated = yield* UserModule.changeRole(user!, "admin")
    yield* repo.update(updated)
    return updated
  })
```

### 16.3 Replacing `class` dengan Module Pattern

```typescript
// ❌ OOP class — encapsulation via private, tapi mutation dan this
class EmailService {
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    await resend.emails.send({ from: "noreply@app.com", to, subject, html })
  }
}

const emailSvc = new EmailService(process.env.RESEND_KEY!)
emailSvc.send("user@test.com", "Welcome", "<p>Hi</p>")

// ✅ Module + Layer — no this, no new, injectable dan testable
// Interface (Context.Tag DI token)
export class IMailerService extends Context.Tag("IMailerService")<
  IMailerService,
  { readonly send: (opts: TMailOptions) => Effect.Effect<void, MailError> }
>() {}

// Implementation (Layer)
export const MailerServiceLive = Layer.effect(
  IMailerService,
  Effect.gen(function* () {
    const apiKey = yield* AppConfig.resendApiKey  // inject dari config, tidak hardcode
    const client = new Resend(Option.getOrThrow(apiKey))

    return {
      send: (opts) =>
        pipe(
          Effect.tryPromise({
            try:   () => client.emails.send({ from: opts.from ?? "noreply@app.com", ...opts }),
            catch: (err) => new MailError({ cause: err }),
          }),
          Effect.asVoid,
        ),
    }
  }),
)

// Usage — inject via Layer, tidak new
const program = Effect.gen(function* () {
  const mailer = yield* IMailerService  // ← inject, bukan new EmailService()
  yield* mailer.send({ to: "user@test.com", subject: "Welcome", html: "<p>Hi</p>" })
})
```

### 16.4 Replacing Mutable Config dengan Effect Config

```typescript
// ❌ Mutable global config object
const config = {
  db: process.env.DATABASE_URL,      // bisa undefined
  port: parseInt(process.env.PORT!), // bisa NaN
  debug: process.env.DEBUG === "true",
}
// Semua code yang import ini akan mendapat nilai yang bisa invalid

// ✅ Effect Config — validated, typed, lazy
export const AppConfig = {
  databaseUrl: Config.string("DATABASE_URL"),           // wajib ada, validated
  port:        Config.withDefault(Config.integer("PORT"), 4321),  // default value
  debug:       Config.withDefault(Config.boolean("DEBUG"), false),
  apiKey:      Config.redacted(Config.string("API_KEY")),  // sensitive, tidak di-log
} as const

// Usage — di-yield di dalam Effect, bukan di-akses global
const program = Effect.gen(function* () {
  const dbUrl = yield* AppConfig.databaseUrl  // Effect.Effect<string, ConfigError>
  const port  = yield* AppConfig.port          // Effect.Effect<number, ConfigError>
  // jika env var tidak ada → ConfigError yang typed, bukan undefined/crash
})
```

### 16.5 Replacing Switch/Case dengan Pattern Match via Object

```typescript
// ❌ Switch/case — verbose, prone to fallthrough
function getStatusLabel(status: TUserStatus): string {
  switch (status) {
    case "active":    return "Aktif"
    case "inactive":  return "Tidak aktif"
    case "suspended": return "Ditangguhkan"
    default:          return "Unknown"  // fallthrough trap
  }
}

// ✅ Record lookup — pure, exhaustive via TypeScript
const STATUS_LABEL: Record<TUserStatus, string> = {
  active:    "Aktif",
  inactive:  "Tidak aktif",
  suspended: "Ditangguhkan",
  // TypeScript error jika ada TUserStatus yang tidak ter-cover ← exhaustive
}
const getStatusLabel = (status: TUserStatus): string => STATUS_LABEL[status]

// ✅ Untuk logic lebih kompleks — record of functions
const STATUS_HANDLER: Record<TBillingEvent, (data: unknown) => Effect.Effect<void, DatabaseError, IBillingService>> = {
  [BILLING_EVENT.CHECKOUT_COMPLETED]: (data) =>
    pipe(IBillingService, Effect.flatMap((svc) => svc.syncSubscription((data as { subscriptionId: string }).subscriptionId))),
  [BILLING_EVENT.SUBSCRIPTION_UPDATED]: (data) =>
    pipe(IBillingService, Effect.flatMap((svc) => svc.syncSubscription((data as { id: string }).id))),
  [BILLING_EVENT.SUBSCRIPTION_DELETED]: (data) =>
    pipe(IBillingService, Effect.flatMap((svc) => svc.syncSubscription((data as { id: string }).id))),
}

const handleBillingEvent = (event: TBillingWebhookEvent) =>
  STATUS_HANDLER[event.type as TBillingEvent]?.(event.data) ?? Effect.void
```

### 16.6 Replacing Class-based DI dengan Layer Composition

```typescript
// ❌ Manual DI container — OOP pattern
class Container {
  private static instance: Container
  private services: Map<string, unknown> = new Map()

  register<T>(key: string, service: T) { this.services.set(key, service) }
  resolve<T>(key: string): T { return this.services.get(key) as T }

  static getInstance() {
    if (!Container.instance) Container.instance = new Container()
    return Container.instance
  }
}

Container.getInstance().register("userRepo", new UserRepository(db))
const repo = Container.getInstance().resolve<IUserRepository>("userRepo")

// ✅ Effect Layer — FP dependency injection, type-safe, composable
// Di app.runtime.ts — composition root, satu tempat, deklaratif
export const AppLayer = Layer.mergeAll(
  UserRepositoryLive.pipe(Layer.provide(DrizzleClientLive)),
  MailerServiceLive,
  CacheAdapterLive,
)

export const AppRuntime = ManagedRuntime.make(AppLayer)

// Di program — inject via yield*, bukan resolve dari container
const program = Effect.gen(function* () {
  const repo   = yield* IUserRepository  // ← type-safe, tidak perlu cast
  const mailer = yield* IMailerService
  // TypeScript error jika Layer tidak menyediakan service ini
})

// Di test — swap Layer tanpa menyentuh program
const testResult = await Effect.runPromise(
  program.pipe(Effect.provide(Layer.mergeAll(TestUserRepo, TestMailer))),
)
```

### 16.7 Replacing Promise Chaining dengan Effect Pipeline

```typescript
// ❌ Promise chain — error handling tersebar, tidak typed
function createOrder(userId: string, items: OrderItem[]) {
  return validateUser(userId)
    .then((user) => checkInventory(items))
    .then((available) => {
      if (!available) throw new Error("Out of stock")
      return saveOrder({ userId, items })
    })
    .then((order) => sendConfirmation(order.id))
    .catch((err) => {
      // semua error ditangkap di satu place, tidak tahu error apa
      logger.error(err)
      throw err
    })
}

// ✅ Effect pipeline — setiap error typed, composable, testable
const createOrderProgram = (
  userId: TUserId,
  items: readonly TOrderItem[],
): Effect.Effect<
  TOrder,
  UserNotFoundError | OutOfStockError | DatabaseError | MailError,
  IUserRepository | IInventoryService | IOrderRepository | IMailerService
> =>
  Effect.gen(function* () {
    const userRepo  = yield* IUserRepository
    const inventory = yield* IInventoryService
    const orderRepo = yield* IOrderRepository
    const mailer    = yield* IMailerService

    const user      = yield* userRepo.findById(userId)
    if (!user) yield* Effect.fail(new UserNotFoundError({ id: userId }))

    const available = yield* inventory.checkAll(items)
    if (!available) yield* Effect.fail(new OutOfStockError({ items }))

    const order = yield* orderRepo.save({ userId, items, status: "pending" })

    // Fire-and-forget — tidak block main flow
    yield* Effect.fork(
      mailer.send({ to: user!.email, subject: "Order confirmed", html: `<p>Order #${order.id}</p>` }),
    )

    return order
  })
```

---

## 17. Shared Types — Complete Template

Referensi lengkap `shared/types/common.types.ts` yang harus ada di setiap project:

```typescript
// src/shared/types/common.types.ts

// ── Branded ID types ───────────────────────────────────────────────────────────
// Mencegah ID tertukar di compile time
export type TId = string & { readonly __brand: "Id" }

// Tambah domain ID sesuai kebutuhan project
export type TUserId   = TId & { readonly _brand: "UserId" }
export type TTenantId = TId & { readonly _brand: "TenantId" }

// ── Session & Auth types ──────────────────────────────────────────────────────
// Di shared/ — bukan di domain auth/user — agar tidak ada cycle
export type TUserRole = "owner" | "admin" | "member" | "viewer"

export type TSessionUser = {
  readonly sessionId: string
  readonly userId:    string
  readonly tenantId:  string
  readonly role:      TUserRole
}

// ── Pagination ────────────────────────────────────────────────────────────────
export type TPaginationInput = {
  readonly page:  number
  readonly limit: number
}

export type TPaginated<T> = {
  readonly data:       readonly T[]
  readonly total:      number
  readonly page:       number
  readonly limit:      number
  readonly totalPages: number
}

// Pure function — helper pagination builder
export const makePaginated = <T>(
  data: readonly T[],
  total: number,
  input: TPaginationInput,
): TPaginated<T> => ({
  data,
  total,
  page:       input.page,
  limit:      input.limit,
  totalPages: Math.ceil(total / input.limit),
})

// ── API Response ─────────────────────────────────────────────────────────────
export type TApiError = {
  readonly _tag:     string
  readonly message:  string
  readonly details?: unknown
}

export type TApiMeta = {
  readonly requestId: string
  readonly timestamp: string
}

export type TApiResponse<T = unknown> =
  | { readonly success: true;  readonly data: T;              readonly meta: TApiMeta }
  | { readonly success: false; readonly error: TApiError;     readonly meta: TApiMeta }

// Pure function — build sukses response
export const makeSuccessResponse = <T>(data: T, meta: TApiMeta): TApiResponse<T> =>
  ({ success: true, data, meta })

// Pure function — build error response
export const makeErrorResponse = (error: TApiError, meta: TApiMeta): TApiResponse<never> =>
  ({ success: false, error, meta })

// Pure function — build meta
export const makeMeta = (requestId?: string): TApiMeta => ({
  requestId: requestId ?? crypto.randomUUID(),
  timestamp: new Date().toISOString(),
})
```

---

## 18. Effect Error Handling — Complete Patterns

Referensi semua cara handle error di Effect:

```typescript
import { Effect, pipe, Data, Exit, Cause } from "effect"

// ── 1. Fail dengan TaggedError ─────────────────────────────────────────────
const failExample = Effect.fail(new UserNotFoundError({ id: "123" }))

// ── 2. Catch satu error ───────────────────────────────────────────────────
const catchOne = pipe(
  repo.findById(id),
  Effect.catchTag("UserNotFoundError", (err) =>
    Effect.succeed(defaultUser),  // recover dengan default value
  ),
)

// ── 3. Catch beberapa error — exhaustive ─────────────────────────────────
const catchMany = pipe(
  createUserProgram(command),
  Effect.catchTags({
    UserAlreadyExistsError: (err) =>
      Effect.fail(new ValidationError({ issues: `Email ${err.email} sudah digunakan` })),
    InvalidEmailError: (err) =>
      Effect.fail(new ValidationError({ issues: `Email ${err.email} tidak valid` })),
    DatabaseError: (err) =>
      Effect.fail(err),  // re-throw dengan type yang sama
  }),
)

// ── 4. Map error — transform error type ──────────────────────────────────
const mapErr = pipe(
  Schema.decodeUnknown(CreateUserSchema)(body),
  Effect.mapError((parseError) => new ValidationError({ issues: parseError.message })),
)

// ── 5. Ensure — cleanup regardless of success/failure ────────────────────
const withCleanup = pipe(
  acquireResource(),
  Effect.flatMap((resource) => useResource(resource)),
  Effect.ensuring(releaseResource()),  // selalu dijalankan
)

// ── 6. Retry dengan exponential backoff ───────────────────────────────────
import { Schedule } from "effect"

const withRetry = pipe(
  sendEmailProgram(opts),
  Effect.retry(
    Schedule.exponential("100 millis").pipe(
      Schedule.compose(Schedule.recurs(3)),  // max 3x retry
    ),
  ),
)

// ── 7. Timeout ────────────────────────────────────────────────────────────
import { Duration } from "effect"

const withTimeout = pipe(
  externalApiCall(),
  Effect.timeout(Duration.seconds(5)),
  Effect.flatMap(Option.match({
    onNone: () => Effect.fail(new HttpError({ status: 408, message: "Request timeout" })),
    onSome: (result) => Effect.succeed(result),
  })),
)

// ── 8. Race — ambil yang selesai duluan ──────────────────────────────────
const raceExample = Effect.race(
  primaryDb.findById(id),
  replicaDb.findById(id),
)

// ── 9. Parallel dengan concurrency control ───────────────────────────────
const parallel = Effect.all(
  users.map((u) => repo.findById(u.id)),
  { concurrency: 5 },  // max 5 concurrent
)

// ── 10. Runnen Effect di presentation layer ───────────────────────────────
// Hanya boleh di pages/api dan app.runtime.ts
const result = await Effect.runPromise(
  program.pipe(
    Effect.catchAll((err) => Effect.succeed(defaultValue)),  // handle semua error
  ),
)

// Atau via runApp helper
const result = await runApp(program)  // lebih clean
```

---

## 19. Glossary

| Term | Definisi |
|---|---|
| **Pure Function** | Function yang output-nya hanya bergantung pada input, tanpa side effect |
| **Immutable** | Data yang tidak bisa diubah setelah dibuat — update via copy |
| **Module Pattern** | `const Xxx = { fn1, fn2 } as const` — kumpulan pure function untuk satu domain |
| **ADT** | Algebraic Data Type — type yang dibentuk dari kombinasi type lain. `TaggedError` adalah ADT |
| **Tagged Error** | Error dengan tag string unik — memungkinkan exhaustive handling dan compiler check |
| **Context.Tag** | Type-level identifier untuk dependency injection di Effect — bukan OOP class |
| **Layer** | Cara membuat implementasi dari Context.Tag — FP equivalent dari DI container entry |
| **Live Layer** | Implementasi konkret sebuah Layer yang berinteraksi dengan sistem eksternal |
| **Composition Root** | Satu tempat di mana semua Layer di-wire — `infra/runtime/app.runtime.ts` |
| **Vertical Slice** | Arsitektur di mana semua concern satu domain ada di satu folder |
| **Branded Type** | Type yang secara nominal berbeda meski secara struktural sama — `TUserId` vs `TTenantId` |
| **Barrel** | `index.ts` yang mengontrol apa yang di-export dari sebuah module/domain |
| **Pipe** | Komposisi fungsi dari kiri ke kanan — `pipe(x, f, g)` = `g(f(x))` |
| **Effect.gen** | Generator-based do-notation untuk Effect — `yield*` menggantikan `await` |
| **Vendor Leak** | Ketika tipe dari library external (Stripe, AWS) bocor ke interface domain |
| **Cycle** | Ketika domain A depend on B dan B depend on A — selalu bug arsitektur |

---

## 20. Testing Standards — Lanjutan

### 20.1 Contract Test

**Target:** Verifikasi bahwa `*Live` Layer mengimplementasikan kontrak interface dengan benar

**Kapan dipakai:** Setiap kali ada implementasi baru dari interface yang sama (misal: `CacheAdapterRedisLive` sebagai alternatif `CacheAdapterLive`)

**Prinsip:** Contract test ditulis **sekali** untuk interface — dijalankan terhadap **semua implementasi**. Ini memastikan semua Live Layer bisa saling tukar tanpa mengubah behaviour.

```typescript
// tests/contracts/cache-adapter.contract.ts
// Contract test — ditulis sekali, dijalankan ke semua implementasi

import { describe, it, expect } from "vitest"
import { Effect, Layer, Option } from "effect"
import type { ICacheAdapter } from "@/infra/cache/cache.adapter"

// Contract — set of behaviours yang HARUS dipenuhi semua implementasi
export const runCacheAdapterContract = (
  name:        string,
  makeLayer:   () => Layer.Layer<ICacheAdapter>,
) => {
  const run = <A>(effect: Effect.Effect<A, never, ICacheAdapter>) =>
    Effect.runPromise(effect.pipe(Effect.provide(makeLayer())))

  describe(`CacheAdapter contract — ${name}`, () => {
    it("set lalu get — mengembalikan value yang disimpan", async () => {
      const result = await run(
        Effect.gen(function* () {
          const cache = yield* ICacheAdapter
          yield* cache.set("key:1", { name: "test" }, 60)
          return yield* cache.get<{ name: string }>("key:1")
        }),
      )
      expect(Option.isSome(result)).toBe(true)
      expect(Option.getOrNull(result)).toEqual({ name: "test" })
    })

    it("get key yang tidak ada — mengembalikan Option.none", async () => {
      const result = await run(
        Effect.gen(function* () {
          const cache = yield* ICacheAdapter
          return yield* cache.get("nonexistent-key-xyz")
        }),
      )
      expect(Option.isNone(result)).toBe(true)
    })

    it("del — menghapus key yang ada", async () => {
      const result = await run(
        Effect.gen(function* () {
          const cache = yield* ICacheAdapter
          yield* cache.set("key:del", "value", 60)
          yield* cache.del("key:del")
          return yield* cache.get("key:del")
        }),
      )
      expect(Option.isNone(result)).toBe(true)
    })

    it("exists — return true untuk key yang ada", async () => {
      const result = await run(
        Effect.gen(function* () {
          const cache = yield* ICacheAdapter
          yield* cache.set("key:exists", true, 60)
          return yield* cache.exists("key:exists")
        }),
      )
      expect(result).toBe(true)
    })

    it("exists — return false untuk key yang tidak ada", async () => {
      const result = await run(
        Effect.gen(function* () {
          const cache = yield* ICacheAdapter
          return yield* cache.exists("key:nonexistent-xyz")
        }),
      )
      expect(result).toBe(false)
    })

    it("set dengan TTL — setelah expired key tidak ada (verifikasi TTL diterima tanpa error)", async () => {
      await expect(
        run(
          Effect.gen(function* () {
            const cache = yield* ICacheAdapter
            yield* cache.set("key:ttl", "value", 1)  // 1 detik TTL
          }),
        ),
      ).resolves.toBeUndefined()
    })
  })
}
```

```typescript
// tests/contracts/cache-adapter.contract.test.ts
// Jalankan contract ke semua implementasi

import { runCacheAdapterContract } from "./cache-adapter.contract"
import { CacheAdapterLive } from "@/infra/cache/cache.adapter.live"

// In-memory implementation untuk test — tidak perlu Redis nyata
import { Layer, Effect, Option } from "effect"
import { ICacheAdapter } from "@/infra/cache/cache.adapter"

const makeInMemoryCacheLayer = () => {
  const store = new Map<string, unknown>()

  return Layer.succeed(ICacheAdapter, {
    get:    (key) => Effect.succeed(Option.fromNullable(store.get(key))),
    set:    (key, value) => Effect.sync(() => { store.set(key, value) }),
    del:    (key) => Effect.sync(() => { store.delete(key) }),
    exists: (key) => Effect.succeed(store.has(key)),
  })
}

// Jalankan contract terhadap in-memory implementation
runCacheAdapterContract("InMemory", makeInMemoryCacheLayer)

// Jika ada implementasi lain, tambahkan di sini:
// runCacheAdapterContract("Upstash", () => CacheAdapterLive)
// runCacheAdapterContract("Redis", () => RedisAdapterLive)
```

```typescript
// Contract untuk IStorageAdapter
// tests/contracts/storage-adapter.contract.ts

import { describe, it, expect } from "vitest"
import { Effect, Layer } from "effect"
import type { IStorageAdapter } from "@/domain/storage/storage.adapter"

export const runStorageAdapterContract = (
  name:      string,
  makeLayer: () => Layer.Layer<IStorageAdapter>,
) => {
  const run = <A>(eff: Effect.Effect<A, never, IStorageAdapter>) =>
    Effect.runPromise(eff.pipe(Effect.provide(makeLayer())))

  describe(`StorageAdapter contract — ${name}`, () => {
    it("getPresignedUploadUrl — mengembalikan URL yang valid", async () => {
      const result = await run(
        Effect.gen(function* () {
          const storage = yield* IStorageAdapter
          return yield* storage.getPresignedUploadUrl({
            key:         "test/upload.jpg",
            contentType: "image/jpeg",
            maxBytes:    5 * 1024 * 1024,
          })
        }),
      )

      expect(result.uploadUrl).toBeDefined()
      expect(result.publicUrl).toBeDefined()
      expect(result.key).toBe("test/upload.jpg")
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it("getPresignedDownloadUrl — mengembalikan URL string", async () => {
      const url = await run(
        Effect.gen(function* () {
          const storage = yield* IStorageAdapter
          return yield* storage.getPresignedDownloadUrl("test/file.pdf")
        }),
      )
      expect(typeof url).toBe("string")
      expect(url.length).toBeGreaterThan(0)
    })
  })
}
```

---

### 20.2 Load Test

**Target:** API endpoints yang menjadi bottleneck — auth, CRUD utama, billing webhook

**Tool:** `autocannon` (Node.js, ringan) atau `k6` (lebih lengkap, scripting)

**Kapan dijalankan:** Tidak di CI reguler — dijalankan manual sebelum release major atau setelah perubahan arsitektur infra

```typescript
// tests/load/auth-register.load.ts — menggunakan autocannon

import autocannon from "autocannon"

const runRegisterLoadTest = () =>
  autocannon({
    url:         "http://localhost:4321/api/v1/auth/register",
    method:      "POST",
    headers:     { "Content-Type": "application/json" },
    // Body generator — setiap request pakai email unik
    setupClient: (client) => {
      client.setBody(JSON.stringify({
        email:      `loadtest-${Date.now()}-${Math.random()}@test.com`,
        password:   "LoadTest123!",
        name:       "Load Test User",
        tenantSlug: `lt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      }))
    },
    connections: 10,    // concurrent connections
    duration:    10,    // seconds
    pipelining:  1,
  }, (err, result) => {
    if (err) { console.error(err); process.exit(1) }

    console.log("\n=== Load Test Results: POST /auth/register ===")
    console.log(`Requests/sec:  ${result.requests.average}`)
    console.log(`Latency p50:   ${result.latency.p50}ms`)
    console.log(`Latency p95:   ${result.latency.p95}ms`)
    console.log(`Latency p99:   ${result.latency.p99}ms`)
    console.log(`Errors:        ${result.errors}`)
    console.log(`Timeouts:      ${result.timeouts}`)

    // Acceptance criteria
    const PASS = result.requests.average >= 50       // ≥ 50 req/s
      && result.latency.p95 <= 500                   // p95 ≤ 500ms
      && result.errors === 0                         // no errors

    console.log(`\nResult: ${PASS ? "✅ PASS" : "❌ FAIL"}`)
    process.exit(PASS ? 0 : 1)
  })

runRegisterLoadTest()
```

```javascript
// tests/load/user-crud.k6.js — menggunakan k6 (lebih ekspresif)

import http from "k6/http"
import { check, sleep } from "k6"
import { Rate } from "k6/metrics"

const errorRate = new Rate("errors")

export const options = {
  stages: [
    { duration: "30s", target: 20 },   // ramp up ke 20 VU dalam 30 detik
    { duration: "1m",  target: 20 },   // sustained 20 VU selama 1 menit
    { duration: "10s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],  // 95% request < 500ms
    errors:            ["rate<0.01"],  // error rate < 1%
  },
}

// Shared auth token — set sebelum test via environment variable
const AUTH_HEADER = { Authorization: `Bearer ${__ENV.TEST_SESSION_ID}` }
const BASE_URL    = __ENV.BASE_URL || "http://localhost:4321"

export default function () {
  // GET list users
  const listRes = http.get(`${BASE_URL}/api/v1/users?page=1&limit=20`, { headers: AUTH_HEADER })
  check(listRes, {
    "GET /users — 200":        (r) => r.status === 200,
    "GET /users — has data":   (r) => JSON.parse(r.body).success === true,
  })
  errorRate.add(listRes.status !== 200)

  sleep(0.5)

  // GET single user
  const userId  = "test-user-id"
  const getRes  = http.get(`${BASE_URL}/api/v1/users/${userId}`, { headers: AUTH_HEADER })
  check(getRes, {
    "GET /users/:id — 200 or 404": (r) => r.status === 200 || r.status === 404,
  })

  sleep(1)
}
```

**Acceptance Criteria untuk Load Test:**

| Metric | Target |
|---|---|
| Throughput | ≥ 50 req/s per endpoint |
| Latency p50 | ≤ 100ms |
| Latency p95 | ≤ 500ms |
| Latency p99 | ≤ 1000ms |
| Error rate | < 1% |
| Timeouts | 0 |

---

### 20.3 Test Doubles — Standard Implementations

**Test doubles** adalah pengganti dependency di test — bukan mock, tapi implementasi nyata yang berjalan in-memory. Dalam FP + Effect, ini diwujudkan sebagai `Layer.succeed`.

**Empat jenis test double dan kapan pakai masing-masing:**

| Jenis | Kapan | Effect Pattern |
|---|---|---|
| **Stub** | Return nilai tetap — tidak peduli input | `Layer.succeed(IRepo, { findById: () => Effect.succeed(fixedUser) })` |
| **Spy** | Capture calls untuk verifikasi side effect | `Layer.succeed(IMailer, { send: (opts) => Effect.sync(() => { calls.push(opts) }) })` |
| **Fake** | Implementasi nyata tapi in-memory | `Layer.succeed(IRepo, inMemoryRepoImpl)` |
| **Dummy** | Tidak pernah dipanggil — hanya untuk satisfi type | `Layer.succeed(IMailer, { send: () => Effect.void })` |

```typescript
// tests/helpers/test-doubles.ts
// Reusable test doubles untuk semua domain test

import { Effect, Layer, Option } from "effect"
import { IUserRepository } from "@/domain/user/index"
import { IAuthService } from "@/domain/auth/index"
import { INotificationService } from "@/domain/notification/index"
import { ICacheAdapter } from "@/infra/cache/cache.adapter"
import { IMailerService } from "@/infra/mail/mailer.service"
import type { TUser, TTenant, TSession } from "@/shared/types/common.types"

// ── Stub — return nilai tetap ─────────────────────────────────────────────
export const makeStubUserRepo = (user: TUser | null = null) =>
  Layer.succeed(IUserRepository, {
    findById:      () => Effect.succeed(user),
    findByEmail:   () => Effect.succeed(user),
    findAll:       () => Effect.succeed({ data: user ? [user] : [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    save:          () => Effect.void,
    update:        () => Effect.void,
    delete:        () => Effect.void,
    existsByEmail: () => Effect.succeed(user !== null),
  })

// ── Spy — capture calls ───────────────────────────────────────────────────
export const makeNotifSpy = () => {
  const calls: Array<{ tenantId: string; userId: string; type: string; title: string }> = []

  const layer = Layer.succeed(INotificationService, {
    create:      (params) => Effect.sync(() => { calls.push(params as typeof calls[0]) }),
    markRead:    () => Effect.void,
    markAllRead: () => Effect.void,
    findUnread:  () => Effect.succeed([]),
  })

  const getCalls = () => [...calls]           // pure — return copy
  const reset    = () => { calls.length = 0 } // reset antara test

  return { layer, getCalls, reset }
}

export const makeMailerSpy = () => {
  const sent: Array<{ to: string; subject: string }> = []

  const layer = Layer.succeed(IMailerService, {
    send: (opts) => Effect.sync(() => { sent.push({ to: opts.to, subject: opts.subject }) }),
  })

  return { layer, getSent: () => [...sent], reset: () => { sent.length = 0 } }
}

// ── Fake — in-memory implementation ──────────────────────────────────────
export const makeInMemoryCacheAdapter = () => {
  const store = new Map<string, { value: unknown; expiresAt: number }>()

  const isExpired = (key: string) => {
    const entry = store.get(key)
    return entry ? entry.expiresAt < Date.now() : true
  }

  return Layer.succeed(ICacheAdapter, {
    get: (key) => Effect.sync(() => {
      if (isExpired(key)) { store.delete(key); return Option.none() }
      const entry = store.get(key)
      return entry ? Option.some(entry.value) : Option.none()
    }),
    set: (key, value, ttlSeconds = 3600) => Effect.sync(() => {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    }),
    del:    (key) => Effect.sync(() => { store.delete(key) }),
    exists: (key) => Effect.sync(() => !isExpired(key) && store.has(key)),
  })
}

// ── Dummy — type-satisfying no-op ─────────────────────────────────────────
export const DummyNotifService = Layer.succeed(INotificationService, {
  create:      () => Effect.void,
  markRead:    () => Effect.void,
  markAllRead: () => Effect.void,
  findUnread:  () => Effect.succeed([]),
})

export const DummyMailerService = Layer.succeed(IMailerService, {
  send: () => Effect.void,
})

// ── Composite helper — compose test layer dari doubles ────────────────────
export const makeBaseTestLayer = (opts?: {
  user?:           TUser | null
  notifSpy?:       ReturnType<typeof makeNotifSpy>
  mailerSpy?:      ReturnType<typeof makeMailerSpy>
}) =>
  Layer.mergeAll(
    makeStubUserRepo(opts?.user),
    opts?.notifSpy?.layer  ?? DummyNotifService,
    opts?.mailerSpy?.layer ?? DummyMailerService,
    makeInMemoryCacheAdapter(),
  )
```

---

### 20.4 Testing Anti-Patterns

Pattern yang **dilarang** di codebase ini beserta alasannya:

```typescript
// ─────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN 1: jest.mock / vi.mock
// Alasan: runtime magic, tidak type-safe, sulit debug, tidak FP
vi.mock("@/domain/user/user.repository")
const mockRepo = vi.mocked(IUserRepository)
mockRepo.prototype.findById.mockResolvedValue(null)

// ✅ Gunakan Layer.succeed — fully typed, composable
const TestRepo = Layer.succeed(IUserRepository, { findById: () => Effect.succeed(null), ... })

// ─────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN 2: Test yang bergantung pada urutan
describe("user tests", () => {
  let createdUserId: string  // shared state antara test — BERBAHAYA

  it("create user", async () => {
    createdUserId = (await createUser(...)).id  // test 1 set state
  })

  it("get user", async () => {
    const user = await getUser(createdUserId)   // test 2 bergantung test 1
  })
})

// ✅ Setiap test punya state sendiri
describe("user tests", () => {
  it("create then get user", async () => {
    const store  = makeInMemoryStore()
    const created = await runCreateUser(store)
    const found   = await runGetUser(store, created.id)
    expect(found.id).toBe(created.id)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN 3: sleep/setTimeout di test
it("notification dikirim setelah register", async () => {
  await register(...)
  await new Promise((r) => setTimeout(r, 1000))  // arbitrary wait — flaky!
  expect(notifSpy.getCalls()).toHaveLength(1)
})

// ✅ Gunakan vi.useFakeTimers() atau verifikasi synchronously
it("notification dijadwalkan saat register", async () => {
  vi.useFakeTimers()
  const notifSpy = makeNotifSpy()
  await Effect.runPromise(
    registerProgram(command).pipe(
      Effect.provide(makeTestLayer({ notifSpy })),
    ),
  )
  vi.runAllTimers()
  // Untuk Effect.fork — verifikasi bahwa fork dipanggil, bukan hasil akhirnya
  expect(notifSpy.getCalls()).toHaveLength(0) // fork belum selesai — ini expected
  vi.useRealTimers()
})

// ─────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN 4: Snapshot test terlalu besar
it("entire page snapshot", () => {
  const { container } = render(<Dashboard user={user} tenants={tenants} notifications={notifications} />)
  expect(container).toMatchSnapshot()  // snapshot ribuan baris — noise saat review
})

// ✅ Snapshot bagian spesifik yang penting
it("user badge snapshot", () => {
  const { getByTestId } = render(<UserBadge user={user} />)
  expect(getByTestId("user-badge")).toMatchSnapshot()
})

// ─────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN 5: Test implementation detail
it("UserModule.create memanggil normalizeEmail", async () => {
  const spy = vi.spyOn(utils, "normalizeEmail")  // test internal detail!
  await Effect.runPromise(UserModule.create(props))
  expect(spy).toHaveBeenCalled()
})

// ✅ Test observable behaviour — bukan internal implementation
it("UserModule.create normalisasi email ke lowercase", async () => {
  const user = await Effect.runPromise(UserModule.create({ ...props, email: "UPPER@TEST.COM" }))
  expect(user.email).toBe("upper@test.com")  // test hasil, bukan cara mencapainya
})

// ─────────────────────────────────────────────────────────────────────────
// ❌ ANTI-PATTERN 6: Hardcoded fixture data tanpa factory
const testUser = {
  id:    "550e8400-e29b-41d4-a716-446655440000",
  email: "hardcoded@test.com",
  // ... 20 more fields
}

it("suspend user", async () => {
  const result = await Effect.runPromise(UserModule.suspend(testUser))
  // jika TUser berubah struktur — semua test yang pakai testUser ini error
})

// ✅ Factory function — resilient terhadap perubahan struct
it("suspend user", async () => {
  const user   = makeUser({ status: "active" })  // factory handles defaults
  const result = await Effect.runPromise(UserModule.suspend(user))
  expect(result.status).toBe("suspended")
})
```

---

### 20.5 Test Naming Convention

Format: `"{subject} — {scenario} — {expected outcome}"`

```typescript
// ✅ Descriptive — jelas tanpa baca body
it("UserModule.suspend — user aktif — berhasil return user dengan status suspended")
it("UserModule.suspend — user sudah suspended — gagal dengan UserSuspendedError")
it("registerProgram — email sudah terdaftar — gagal dengan EmailAlreadyRegisteredError, store tidak berubah")
it("POST /api/v1/users — body bukan JSON valid — return 400 dengan ValidationError")
it("[BUG-42] email dengan trailing whitespace — dianggap sama dengan email tanpa whitespace")

// ❌ Terlalu singkat — tidak jelas konteks dan expectation
it("suspend berhasil")
it("gagal register")
it("returns 400")

// Grouped describe — subject dan context di describe, scenario + outcome di it
describe("UserModule.suspend", () => {
  describe("user aktif", () => {
    it("berhasil return user dengan status suspended")
    it("tidak mutate user asli — immutability terjaga")
    it("updatedAt berubah ke waktu sekarang")
  })
  describe("user sudah suspended", () => {
    it("gagal dengan UserSuspendedError yang berisi id user")
  })
})
```

---

### 20.6 Testing Utilities — Shared Helpers

```typescript
// tests/helpers/effect-helpers.ts
// Pure helper functions untuk test Effect

import { Effect, Exit, Cause } from "effect"

// Run Effect dan extract success value — fail test jika Effect fail
export const runSucceed = async <A>(effect: Effect.Effect<A, never, never>): Promise<A> =>
  Effect.runPromise(effect)

// Run Effect dan extract typed error — fail test jika Effect succeed
export const runFail = async <E>(
  effect: Effect.Effect<never, E, never>,
): Promise<E> => {
  const exit = await Effect.runPromiseExit(effect)
  if (Exit.isSuccess(exit)) throw new Error("Expected Effect to fail but it succeeded")
  if (exit.cause._tag === "Fail") return exit.cause.error
  throw new Error(`Expected Fail cause but got ${exit.cause._tag}`)
}

// Assert bahwa effect fail dengan tagged error spesifik
export const expectFailTag = async <E extends { _tag: string }>(
  effect: Effect.Effect<unknown, E, never>,
  tag:    E["_tag"],
): Promise<E> => {
  const err = await runFail(effect as Effect.Effect<never, E, never>)
  if (err._tag !== tag) {
    throw new Error(`Expected error tag "${tag}" but got "${err._tag}"`)
  }
  return err
}

// Usage di test
it("gagal dengan UserNotFoundError", async () => {
  const err = await expectFailTag(
    getUserByIdProgram("nonexistent").pipe(Effect.provide(TestLayer)),
    "UserNotFoundError",
  )
  expect(err.id).toBe("nonexistent")
})
```

```typescript
// tests/helpers/make-fixture.ts
// Pure factory functions untuk test data — tidak ada hardcoded fixture file

import type { TUser, TTenant, TSessionUser } from "@/shared/types/common.types"

let counter = 0
const next  = () => (++counter).toString().padStart(4, "0")

// Pure factories — setiap call menghasilkan data unik
export const makeUser = (overrides?: Partial<TUser>): TUser => ({
  id:             `usr-${next()}` as TUserId,
  tenantId:       `tnt-${next()}` as TTenantId,
  email:          `user-${next()}@test.com`,
  hashedPassword: "hashed-password",
  name:           `Test User ${next()}`,
  role:           "member",
  status:         "active",
  avatarUrl:      null,
  createdAt:      new Date("2024-01-01T00:00:00.000Z"),
  updatedAt:      new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
})

export const makeTenant = (overrides?: Partial<TTenant>): TTenant => ({
  id:        `tnt-${next()}` as TTenantId,
  slug:      `tenant-${next()}`,
  name:      `Tenant ${next()}`,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
})

export const makeSessionUser = (overrides?: Partial<TSessionUser>): TSessionUser => ({
  sessionId: `sess-${next()}`,
  userId:    `usr-${next()}`,
  tenantId:  `tnt-${next()}`,
  role:      "member",
  ...overrides,
})

// Reset counter — panggil di beforeEach untuk deterministic ID di snapshot test
export const resetFixtureCounter = () => { counter = 0 }
```

---

### 20.7 Complete `package.json` Test Scripts

```json
{
  "scripts": {
    "test":            "vitest",
    "test:run":        "vitest run",
    "test:watch":      "vitest watch",
    "test:ui":         "vitest --ui",
    "test:coverage":   "vitest run --coverage",
    "test:api":        "vitest run --project api",
    "test:e2e":        "playwright test",
    "test:e2e:ui":     "playwright test --ui",
    "test:e2e:debug":  "playwright test --debug",
    "test:bench":      "vitest bench",
    "test:contract":   "vitest run tests/contracts/**",
    "test:load":       "node tests/load/auth-register.load.ts",
    "test:all":        "pnpm test:run && pnpm test:e2e"
  }
}
```

---

### 20.8 `vitest.config.ts` — Complete

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],

  test: {
    globals:     true,
    environment: "node",

    // Test file patterns
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/contracts/**/*.test.ts",
    ],
    exclude: [
      "src/**/*.bench.ts",
      "tests/e2e/**",
      "tests/load/**",
      "node_modules/**",
    ],

    // Isolate setiap test file — tidak ada shared global state
    isolate: true,

    // Fake timers — opt-in per test via vi.useFakeTimers()
    fakeTimers: {
      toFake: ["Date", "setTimeout", "setInterval"],
    },

    // Setup file — run sebelum semua test
    setupFiles: ["tests/setup.ts"],

    // Coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html", "json-summary"],
      include:  ["src/**/*.ts", "src/**/*.tsx"],
      exclude:  [
        "src/**/*.d.ts",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.bench.ts",
        "src/**/index.ts",     // barrel files — tidak perlu di-cover
        "src/**/*.live.ts",    // infra live — covered by integration test
      ],
      thresholds: {
        lines:      70,
        functions:  70,
        branches:   65,
        statements: 70,
        // Per-file thresholds untuk domain module
        perFile: true,
      },
      // Watermarks untuk color coding di report
      watermarks: {
        lines:      [70, 90],
        functions:  [70, 90],
        branches:   [65, 85],
        statements: [70, 90],
      },
    },

    // Reporter
    reporters: process.env.CI
      ? ["verbose", "junit"]
      : ["verbose"],
    outputFile: process.env.CI
      ? { junit: "test-results/junit.xml" }
      : undefined,

    // Projects — untuk test berbeda dengan config berbeda
    projects: [
      {
        extends: true,
        test: {
          name:        "unit",
          include:     ["src/domain/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name:        "api",
          include:     ["src/pages/**/*.test.ts"],
          environment: "node",
          // API test butuh lebih banyak memory untuk spin up server
          pool:        "forks",
        },
      },
      {
        extends: true,
        test: {
          name:    "contract",
          include: ["tests/contracts/**/*.test.ts"],
        },
      },
    ],
  },
})
```

```typescript
// tests/setup.ts — global setup sebelum semua test

import { beforeEach, afterEach } from "vitest"
import { resetFixtureCounter } from "./helpers/make-fixture"

// Reset counter setiap test untuk deterministic snapshot
beforeEach(() => {
  resetFixtureCounter()
})

// Bersihkan timer jika test lupa cleanup
afterEach(() => {
  vi.clearAllTimers()
  vi.restoreAllMocks()
})
```

---

### 20.9 CI Test Matrix — Complete Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  # ── Stage 1: Static Analysis (paralel, paling cepat) ──────────────────
  static:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile

      - name: Biome Lint + Format
        run: pnpm biome ci ./src

      - name: TypeScript Check
        run: pnpm typecheck

      - name: Dependency Graph
        run: pnpm check:deps

  # ── Stage 2: Unit + Integration Test ──────────────────────────────────
  test:
    name: Unit + Integration
    runs-on: ubuntu-latest
    needs: static
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile

      - name: Run Tests
        run: pnpm test:run

      - name: Coverage Report
        run: pnpm test:coverage
        continue-on-error: false  # fail CI jika di bawah threshold

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with: { files: coverage/lcov.info }

  # ── Stage 3: Contract Test ─────────────────────────────────────────────
  contract:
    name: Contract Test
    runs-on: ubuntu-latest
    needs: static
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:contract

  # ── Stage 4: Build ─────────────────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, contract]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Upload Build Artifact
        uses: actions/upload-artifact@v4
        with: { name: build, path: dist/ }

  # ── Stage 5: E2E Test (hanya setelah build berhasil) ──────────────────
  e2e:
    name: E2E Test
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "pnpm" }
      - run: pnpm install --frozen-lockfile

      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Download Build
        uses: actions/download-artifact@v4
        with: { name: build, path: dist/ }

      - name: Run E2E Tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          LUCIA_SECRET: test-secret-key

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

**Summary alur CI:**

```
Push/PR
  │
  ├── Static Analysis ──────────────────────────────── 30s
  │   ├── Biome lint + format
  │   ├── TypeScript check
  │   └── Dependency graph (no cycles)
  │
  ├── Unit + Integration Test ──────────────────────── 1-2min
  │   ├── All *.test.ts
  │   └── Coverage threshold check
  │
  ├── Contract Test ────────────────────────────────── 30s
  │   └── All interface contracts
  │
  ├── Build ────────────────────────────────────────── 1-2min
  │   └── Artifact upload
  │
  └── E2E Test ─────────────────────────────────────── 3-5min
      └── Critical user flows
```

---

## 21. The Twelve-Factor App

Semua aplikasi yang dibangun mengikuti metodologi [12-Factor App](https://12factor.net) — standar industri untuk membangun aplikasi modern yang scalable, maintainable, dan portable.

### 21.1 Factor I — Codebase

> Satu codebase, banyak deployment

| # | Rule |
|---|---|
| R-12F-01 | Satu repository per aplikasi — tidak ada shared codebase antar aplikasi berbeda |
| R-12F-02 | Satu codebase bisa di-deploy ke banyak environment (development, staging, production) |
| R-12F-03 | Shared library antar aplikasi di-extract ke package terpisah (npm workspace / monorepo) |

```
✅ Satu repo = satu app
   my-saas/
   ├── src/           ← satu codebase
   └── deploys to:
       ├── production.myapp.com
       ├── staging.myapp.com
       └── localhost (dev)

❌ Satu codebase untuk beberapa app berbeda
   shared-app/
   ├── app-a/   ← app berbeda, harusnya repo terpisah
   └── app-b/
```

---

### 21.2 Factor II — Dependencies

> Deklarasikan dan isolasi dependency secara eksplisit

| # | Rule |
|---|---|
| R-12F-04 | Semua dependency dideklarasikan di `package.json` — tidak ada "system dependency" implisit |
| R-12F-05 | `pnpm install --frozen-lockfile` di CI — tidak pernah `npm install` tanpa lockfile |
| R-12F-06 | Tidak ada asumsi bahwa tool tertentu sudah terinstall di server — semua lewat `devDependencies` |
| R-12F-07 | Versi dependency di-pin dengan lockfile (`pnpm-lock.yaml`) — tidak pernah `*` atau `latest` |

```json
// ✅ Semua dependency eksplisit, versi pinned
{
  "dependencies": {
    "effect":     "3.10.0",
    "drizzle-orm": "0.38.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "vitest":         "2.1.0"
  }
}

// ❌ Versi tidak pinned — bisa break kapan saja
{
  "dependencies": {
    "effect": "latest",   // ← tidak deterministik
    "drizzle-orm": "*"    // ← tidak deterministik
  }
}
```

---

### 21.3 Factor III — Config

> Simpan config di environment, bukan di kode

| # | Rule |
|---|---|
| R-12F-08 | **Tidak ada config yang berbeda antar environment di dalam kode** — semua lewat env var |
| R-12F-09 | Tidak ada hardcoded URL, credential, atau secret di source code |
| R-12F-10 | Semua env var diakses lewat `AppConfig` (Effect `Config`) — tidak pernah `process.env` langsung |
| R-12F-11 | `.env` file tidak di-commit — gunakan `.env.example` tanpa nilai nyata |
| R-12F-12 | Secret di-inject oleh platform (Vercel env, Doppler, AWS SSM) — tidak di hardcode di Docker/CI |

```typescript
// ✅ Config via Effect Config — validated, typed, tidak pernah undefined
export const AppConfig = {
  databaseUrl:  Config.string("DATABASE_URL"),
  stripeKey:    Config.redacted(Config.string("STRIPE_SECRET_KEY")),
  nodeEnv:      Config.withDefault(Config.literal("development","production","test")("NODE_ENV"), "development"),
} as const

// Di program — yield* bukan process.env
const dbUrl = yield* AppConfig.databaseUrl

// ❌ Langsung akses — tidak validated, bisa crash di production
const dbUrl = process.env.DATABASE_URL!
const isProd = process.env.NODE_ENV === "production"

// ✅ .env.example — template tanpa nilai nyata
DATABASE_URL=postgresql://user:password@host:5432/dbname
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
LUCIA_SECRET=your-secret-key-min-32-chars
```

---

### 21.4 Factor IV — Backing Services

> Perlakukan backing service sebagai attached resource

| # | Rule |
|---|---|
| R-12F-13 | Database, cache, email, storage diperlakukan sebagai resource yang bisa di-swap |
| R-12F-14 | URL koneksi service selalu dari env var — tidak pernah hardcode |
| R-12F-15 | Swap backing service (misal Neon → Supabase) cukup ganti env var — tidak ada code change |
| R-12F-16 | Semua backing service diakses lewat adapter interface (`ICacheAdapter`, `IMailerService`) |

```
✅ Backing service sebagai attached resource
   DATABASE_URL=postgresql://neon.tech/db    ← ganti ke Supabase: ubah env var saja
   REDIS_URL=redis://upstash.io/cache        ← ganti ke self-hosted: ubah env var saja
   STORAGE_ENDPOINT=r2.cloudflare.com        ← ganti ke S3: ubah env var saja

Ini bekerja karena semua service punya adapter interface:
   IStorageAdapter ← S3StorageAdapterLive atau GCSStorageAdapterLive
   ICacheAdapter   ← CacheAdapterLive (Upstash) atau CacheAdapterRedisLive
   IMailerService  ← MailerServiceLive (Resend) atau MailerServiceSendGridLive
```

---

### 21.5 Factor V — Build, Release, Run

> Pisahkan tahap build, release, dan run secara ketat

| # | Rule |
|---|---|
| R-12F-17 | **Build** — compile TypeScript, bundle asset. Tidak ada secret di tahap ini |
| R-12F-18 | **Release** — build artifact + config (env var). Setiap release punya ID unik |
| R-12F-19 | **Run** — jalankan release di execution environment. Tidak ada modifikasi kode saat runtime |
| R-12F-20 | Release tidak bisa di-mutate — untuk rollback, re-deploy release sebelumnya |

```yaml
# CI/CD pipeline yang memisahkan tiga tahap
jobs:
  build:                          # ← STAGE: BUILD
    steps:
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-artifact@v4  # artifact tidak punya secret

  release:                        # ← STAGE: RELEASE
    needs: build
    steps:
      - uses: actions/download-artifact@v4
      # Inject config (env var) dari platform secret store
      # Setiap release diberi tag: v1.2.3-sha-abc123
      - run: echo "RELEASE_ID=${{ github.sha }}" >> $GITHUB_ENV

  deploy:                         # ← STAGE: RUN
    needs: release
    steps:
      - run: deploy-to-platform   # jalankan artifact — tidak compile ulang
```

---

### 21.6 Factor VI — Processes

> Jalankan aplikasi sebagai satu atau lebih stateless process

| # | Rule |
|---|---|
| R-12F-21 | **Aplikasi harus stateless** — tidak ada session atau cache di memory process |
| R-12F-22 | State persisten selalu di backing service — database, Redis, S3 |
| R-12F-23 | Setiap request harus bisa dilayani oleh instance manapun — tidak ada sticky session |
| R-12F-24 | File upload langsung ke S3/R2 via presigned URL — tidak lewat server memory |

```typescript
// ❌ Stateful process — session di memory server
const sessions = new Map<string, TSession>()  // data hilang saat restart!
app.post("/login", (req) => {
  sessions.set(sessionId, { userId: req.body.userId })
})

// ✅ Stateless — session di Redis/DB
export const createSessionProgram = (userId: string) =>
  Effect.gen(function* () {
    const authSvc = yield* IAuthService  // session disimpan ke DB oleh Lucia
    return yield* authSvc.createSession(userId, tenantId)
  })

// ❌ File di memory/local filesystem
app.post("/upload", (req) => {
  fs.writeFileSync(`/tmp/${req.file.name}`, req.file.buffer)  // hilang saat restart!
})

// ✅ File di S3/R2 via presigned URL — server tidak menyentuh file
const presigned = yield* storage.getPresignedUploadUrl({ key, contentType, maxBytes })
// Client upload langsung ke S3 — server hanya tahu URL
```

---

### 21.7 Factor VII — Port Binding

> Export service via port binding

| # | Rule |
|---|---|
| R-12F-25 | Aplikasi self-contained — tidak bergantung pada web server eksternal (Apache, nginx) untuk run |
| R-12F-26 | Port dikonfigurasi via env var: `PORT=4321` |
| R-12F-27 | Aplikasi bisa menjadi backing service untuk aplikasi lain via HTTP |

```typescript
// ✅ Port dari env var — bukan hardcode
export const AppConfig = {
  port: Config.withDefault(Config.integer("PORT"), 4321),
}

// Astro / server framework mendengarkan di port yang dikonfigurasi
// PORT=8080 pnpm start  ← bisa diubah tanpa code change
```

---

### 21.8 Factor VIII — Concurrency

> Scale out via process model

| # | Rule |
|---|---|
| R-12F-28 | Scale horizontal — tambah instance, bukan vertical (lebih besar CPU/RAM) |
| R-12F-29 | Proses dikategorikan per tipe: web (HTTP request), worker (background job), scheduler |
| R-12F-30 | Background job dijalankan di worker process terpisah — bukan di dalam web request |

```typescript
// ✅ Fire-and-forget via Effect.fork — tidak block HTTP response
const program = Effect.gen(function* () {
  const user = yield* createUser(command)

  // Email dikirim secara background — HTTP response tidak menunggu
  yield* Effect.fork(
    mailer.send({ to: user.email, subject: "Welcome!" }),
  )

  return toUserDto(user)  // ← return segera, tanpa tunggu email
})

// Untuk job berat (report generation, bulk export):
// Gunakan worker process terpisah (BullMQ, Inngest, Trigger.dev)
// Bukan dijalankan inline di HTTP handler
```

---

### 21.9 Factor IX — Disposability

> Maksimalkan robustness dengan fast startup dan graceful shutdown

| # | Rule |
|---|---|
| R-12F-31 | Startup time harus singkat — target < 5 detik |
| R-12F-32 | Graceful shutdown: selesaikan request yang sedang berjalan sebelum mati |
| R-12F-33 | Handle `SIGTERM` signal — platform akan mengirim ini sebelum kill process |
| R-12F-34 | Tidak ada operasi yang tidak bisa di-retry jika process mati mendadak |

```typescript
// ✅ Graceful shutdown — Effect ManagedRuntime handle lifecycle
export const AppRuntime = ManagedRuntime.make(AppLayer)
// ManagedRuntime otomatis cleanup Layer saat shutdown:
// - tutup koneksi DB
// - flush pending jobs
// - release resources

// Handle SIGTERM untuk graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — graceful shutdown")
  await AppRuntime.dispose()  // cleanup semua Layer
  process.exit(0)
})
```

---

### 21.10 Factor X — Dev/Prod Parity

> Jaga development, staging, dan production semirip mungkin

| # | Rule |
|---|---|
| R-12F-35 | **Time gap**: deploy sesering mungkin — bukan bulanan |
| R-12F-36 | **Personnel gap**: developer yang nulis kode juga yang deploy — bukan ops team terpisah |
| R-12F-37 | **Tools gap**: dev menggunakan tools yang sama dengan production (Docker, Neon, Upstash) |
| R-12F-38 | Tidak ada "works on my machine" — gunakan Docker atau service yang sama |

```yaml
# docker-compose.yml — dev environment semirip mungkin dengan prod
services:
  app:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/myapp
      REDIS_URL:    redis://cache:6379
    depends_on: [db, cache]

  db:
    image: postgres:16-alpine    # versi sama dengan Neon di production
    environment:
      POSTGRES_DB:       myapp
      POSTGRES_PASSWORD: postgres

  cache:
    image: redis:7-alpine        # Upstash-compatible di dev
```

---

### 21.11 Factor XI — Logs

> Perlakukan log sebagai event stream

| # | Rule |
|---|---|
| R-12F-39 | Aplikasi tidak mengelola log file — hanya menulis ke `stdout` |
| R-12F-40 | Log aggregation dihandle platform (Vercel Logs, Datadog, Logtail) — bukan di aplikasi |
| R-12F-41 | Structured logging — setiap log entry adalah JSON, bukan plain string |
| R-12F-42 | Log level dari env var: `LOG_LEVEL=info` |
| R-12F-43 | Tidak ada `console.log` di production code — gunakan structured logger |

```typescript
// src/shared/utils/logger.ts

// Pure function — build log entry sebagai immutable object
const makeLogEntry = (
  level:   "debug" | "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>,
) => ({
  level,
  message,
  timestamp:   new Date().toISOString(),
  environment: process.env.NODE_ENV,
  ...context,
})

// Structured logger — output ke stdout sebagai JSON
export const logger = {
  info:  (msg: string, ctx?: Record<string, unknown>) =>
    console.log(JSON.stringify(makeLogEntry("info", msg, ctx))),
  warn:  (msg: string, ctx?: Record<string, unknown>) =>
    console.warn(JSON.stringify(makeLogEntry("warn", msg, ctx))),
  error: (msg: string, ctx?: Record<string, unknown>) =>
    console.error(JSON.stringify(makeLogEntry("error", msg, ctx))),
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === "debug")
      console.log(JSON.stringify(makeLogEntry("debug", msg, ctx)))
  },
} as const

// ✅ Structured log di API route
logger.error("Database connection failed", {
  requestId: meta.requestId,
  errorTag:  err._tag,
  cause:     String(err.cause),
})

// ❌ Plain string log — tidak bisa di-query, tidak ada context
console.log("Error happened somewhere")
```

---

### 21.12 Factor XII — Admin Processes

> Jalankan admin/management task sebagai one-off process

| # | Rule |
|---|---|
| R-12F-44 | Task seperti migrasi DB, seed data, cleanup — dijalankan sebagai one-off command |
| R-12F-45 | Admin script menggunakan codebase dan config yang sama dengan aplikasi |
| R-12F-46 | Script dijalankan di environment yang sama dengan production (bukan lokal developer) |
| R-12F-47 | Tidak ada admin task yang di-embed di dalam startup aplikasi |

```typescript
// scripts/migrate.ts — one-off admin process, bukan bagian dari app startup
import { Effect, Layer } from "effect"
import { DrizzleClientLive } from "@/infra/db/drizzle.client"
import { AppConfig } from "@/shared/env/app.config"

const migrateProgram = Effect.gen(function* () {
  const db = yield* DrizzleClient
  // Jalankan migrasi
  yield* Effect.tryPromise({
    try:   () => db.execute("SELECT 1"),  // verifikasi koneksi
    catch: (err) => new DatabaseError({ cause: err }),
  })
  console.log("Migration completed")
})

// Jalankan sebagai script terpisah
Effect.runPromise(migrateProgram.pipe(Effect.provide(DrizzleClientLive)))
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1) })
```

```json
// package.json — admin scripts
{
  "scripts": {
    "db:migrate":  "drizzle-kit migrate",
    "db:seed":     "tsx scripts/seed.ts",
    "db:rollback": "drizzle-kit migrate --rollback",
    "admin:cleanup-sessions": "tsx scripts/cleanup-sessions.ts"
  }
}
```

---

### 21.13 12-Factor Compliance Checklist

```
Factor I    — Codebase
  [ ] Satu repo per aplikasi
  [ ] .env tidak di-commit, .env.example ada

Factor II   — Dependencies
  [ ] Semua dependency di package.json
  [ ] pnpm-lock.yaml di-commit
  [ ] Tidak ada versi * atau latest

Factor III  — Config
  [ ] Tidak ada hardcoded config di source code
  [ ] Semua config lewat AppConfig (Effect Config)
  [ ] .env.example tersedia dengan semua key yang diperlukan

Factor IV   — Backing Services
  [ ] Database URL dari env var
  [ ] Semua service punya adapter interface
  [ ] Swap service = ubah env var, tidak ubah kode

Factor V    — Build/Release/Run
  [ ] Build artifact tidak punya secret
  [ ] Setiap release punya ID unik (git SHA)
  [ ] CI memisahkan build → release → deploy

Factor VI   — Processes
  [ ] Tidak ada state di memory server
  [ ] Session di Redis/DB, bukan Map<> in-memory
  [ ] Upload via presigned URL — tidak lewat server

Factor VII  — Port Binding
  [ ] Port dari env var PORT
  [ ] Tidak ada hardcoded port

Factor VIII — Concurrency
  [ ] Scale horizontal — bukan vertical
  [ ] Background job via Effect.fork atau worker terpisah

Factor IX   — Disposability
  [ ] Handle SIGTERM untuk graceful shutdown
  [ ] AppRuntime.dispose() dipanggil saat shutdown

Factor X    — Dev/Prod Parity
  [ ] docker-compose.yml untuk dev environment
  [ ] Versi tools sama antara dev dan production

Factor XI   — Logs
  [ ] Tidak ada console.log di production code
  [ ] Structured JSON logging ke stdout
  [ ] LOG_LEVEL dari env var

Factor XII  — Admin Processes
  [ ] Migrasi DB via drizzle-kit, bukan embed di startup
  [ ] Admin script ada di scripts/ folder
  [ ] Tidak ada admin task di application startup
```

---

## 22. Engineering Principles

Prinsip-prinsip fundamental yang mendasari semua keputusan teknis di codebase ini.

---

### 22.1 SOLID Principles — Diterapkan dalam FP

SOLID adalah prinsip OOP klasik, tapi setiap prinsipnya punya padanan langsung di FP.

#### S — Single Responsibility Principle

> Setiap unit hanya punya satu alasan untuk berubah

```typescript
// ❌ Satu function terlalu banyak tanggung jawab
const createUserAndNotify = async (command: CreateUserCommand) => {
  // 1. Validate input
  if (!EMAIL_REGEX.test(command.email)) throw new Error("invalid email")
  // 2. Hash password
  const hashed = await bcrypt.hash(command.password, 10)
  // 3. Save to DB
  await db.insert(users).values({ ...command, hashedPassword: hashed })
  // 4. Send email
  await resend.emails.send({ to: command.email, subject: "Welcome" })
  // 5. Update cache
  await redis.del(`users:${command.tenantId}`)
}
// Alasan berubah: validasi berubah, hash algorithm berubah, DB schema berubah,
// email template berubah, cache strategy berubah → terlalu banyak!

// ✅ Setiap function satu tanggung jawab
const validateEmail    = (email: string): Effect.Effect<string, InvalidEmailError> => ...
const hashPassword     = (plain: string): Effect.Effect<string, never> => ...
const persistUser      = (user: TUser): Effect.Effect<void, DatabaseError, IUserRepository> => ...
const sendWelcomeEmail = (user: TUser): Effect.Effect<void, MailError, IMailerService> => ...
const invalidateCache  = (tenantId: string): Effect.Effect<void, CacheError, ICacheAdapter> => ...

// Compose di program — setiap function berubah secara independen
const createUserProgram = (command: CreateUserCommand) =>
  Effect.gen(function* () {
    const email  = yield* validateEmail(command.email)
    const hashed = yield* hashPassword(command.password)
    const user   = yield* UserModule.create({ ...command, email, hashedPassword: hashed })
    yield* persistUser(user)
    yield* Effect.fork(sendWelcomeEmail(user))
    yield* Effect.fork(invalidateCache(user.tenantId))
    return toUserDto(user)
  })
```

#### O — Open/Closed Principle

> Terbuka untuk extension, tertutup untuk modification

```typescript
// ✅ Interface terbuka untuk extension via Layer — tidak perlu modifikasi
// IBillingService tidak berubah ketika ada provider baru

// Existing: Stripe
export const StripeBillingServiceLive = Layer.effect(IBillingService, ...)

// Extension: Paddle — tambah implementasi baru, tidak ubah interface
export const PaddleBillingServiceLive = Layer.effect(IBillingService, ...)

// Swap di AppLayer — satu baris
export const AppLayer = Layer.mergeAll(
  // StripeBillingServiceLive,  ← ganti
  PaddleBillingServiceLive,     // ← dengan ini
  ...otherLayers,
)
// IBillingService tidak berubah — programs tidak berubah
```

#### L — Liskov Substitution Principle

> Setiap implementasi harus bisa menggantikan interface tanpa mengubah correctness

```typescript
// Contract test memastikan LSP terpenuhi
// Semua implementasi IStorageAdapter HARUS pass contract yang sama
runStorageAdapterContract("S3",  () => S3StorageAdapterLive)
runStorageAdapterContract("GCS", () => GCSStorageAdapterLive)
runStorageAdapterContract("R2",  () => R2StorageAdapterLive)
// Jika ada yang fail — LSP violation, implementasi tidak valid
```

#### I — Interface Segregation Principle

> Client tidak boleh dipaksa depend pada interface yang tidak digunakan

```typescript
// ❌ Interface terlalu besar — semua method di satu Context.Tag
export class IUserService extends Context.Tag("IUserService")<
  IUserService,
  {
    findById:       (...) => ...
    findAll:        (...) => ...
    createUser:     (...) => ...
    updateUser:     (...) => ...
    deleteUser:     (...) => ...
    checkPermission:(...) => ...
    sendWelcome:    (...) => ...
    exportToCsv:    (...) => ...  // ← tidak semua caller butuh ini
  }
>() {}

// ✅ Interface kecil, focused — gunakan hanya yang dibutuhkan
export class IUserRepository  extends Context.Tag("IUserRepository")<...>() {}   // data access
export class IPermissionService extends Context.Tag("IPermissionService")<...>() {} // RBAC only
export class IMailerService   extends Context.Tag("IMailerService")<...>() {}    // email only

// Program hanya depend pada interface yang benar-benar dipakai
const getUserProgram = (...): Effect.Effect<..., ..., IUserRepository>  // hanya repo
const checkPermProgram = (...): Effect.Effect<..., ..., IPermissionService>  // hanya perm
```

#### D — Dependency Inversion Principle

> Depend pada abstraksi, bukan konkretisasi

```typescript
// ❌ Depend pada konkretisasi
import { UserRepository } from "./user.repository.live"  // konkret!
const repo = new UserRepository(db)

// ✅ Depend pada abstraksi — Context.Tag adalah abstraksi
// Program depend pada IUserRepository (abstraksi), bukan UserRepositoryLive (konkret)
const program = Effect.gen(function* () {
  const repo = yield* IUserRepository  // ← abstraksi
  // ...
})

// UserRepositoryLive di-inject di composition root — program tidak tahu ini ada
export const AppLayer = Layer.mergeAll(
  UserRepositoryLive.pipe(Layer.provide(DrizzleClientLive)),  // ← konkret di sini
)
```

---

### 22.2 DRY — Don't Repeat Yourself

> Setiap knowledge harus punya representasi tunggal dan tidak ambigu dalam sistem

```typescript
// ❌ DRY violation — duplikasi logic validasi email
// Di auth.schemas.ts:
const RegisterSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
})
// Di user.schemas.ts:
const UpdateEmailSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),  // ← duplikat!
})
// Di user.module.ts:
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/  // ← duplikat lagi!

// ✅ Single source of truth — definisi email satu tempat
// shared/schemas/email.schema.ts
export const EmailSchema = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: () => "Email tidak valid" }),
  Schema.transform(Schema.String, {
    decode: (s) => s.toLowerCase().trim(),
    encode: (s) => s,
  }),
)

// Dipakai di mana saja
const RegisterSchema = Schema.Struct({ email: EmailSchema, ... })
const UpdateEmailSchema = Schema.Struct({ email: EmailSchema })
// Logic email validation ada di satu tempat — ubah sekali, berlaku semua
```

**DRY bukan berarti tidak boleh ada kode yang mirip.** DRY berarti tidak ada **knowledge** yang duplikat. Dua fungsi yang kebetulan kodenya mirip tapi merepresentasikan konsep berbeda — itu bukan DRY violation.

---

### 22.3 KISS — Keep It Simple, Stupid

> Solusi paling sederhana yang benar adalah solusi terbaik

| Prinsip | Penerapan |
|---|---|
| Hindari over-engineering | Jangan buat abstraksi sebelum ada duplikasi (Rule of Three) |
| Pilih yang mudah dibaca | Kode dibaca 10x lebih sering dari ditulis |
| Flat over nested | Maksimal 3 level nesting |
| Linear over clever | `pipe` yang linear lebih baik dari `compose` yang "pintar" |

```typescript
// ❌ Over-engineered untuk problem sederhana
const createUserFactory =
  (repoFactory: (config: DbConfig) => IUserRepository) =>
  (validatorFactory: (rules: ValidationRules) => Validator) =>
  (notifierFactory: () => Notifier) =>
  (command: CreateUserCommand) =>
    // ... 50 baris factory composition untuk sesuatu yang bisa 5 baris

// ✅ KISS — Effect + Layer sudah handle complexity ini
const createUserProgram = (command: CreateUserCommand) =>
  Effect.gen(function* () {
    const repo   = yield* IUserRepository
    const user   = yield* UserModule.create(command)
    yield* repo.save(user)
    return toUserDto(user)
  })
// Dependency injection, error handling, typed — semua sudah handled Effect
```

---

### 22.4 YAGNI — You Aren't Gonna Need It

> Jangan implementasi sesuatu sampai benar-benar dibutuhkan

```typescript
// ❌ YAGNI violation — implementasi feature yang belum dibutuhkan
export class IUserRepository extends Context.Tag("IUserRepository")<
  IUserRepository,
  {
    findById:        (...) => ...
    findAll:         (...) => ...
    save:            (...) => ...
    // Yang berikut belum ada use case-nya:
    findByRole:      (...) => ...   // "mungkin suatu saat dibutuhkan"
    bulkImport:      (...) => ...   // "nanti kalau ada feature import"
    exportToExcel:   (...) => ...   // "pasti akan diminta client"
    softDelete:      (...) => ...   // "best practice katanya"
  }
>() {}

// ✅ YAGNI — hanya implement yang ada use case-nya sekarang
export class IUserRepository extends Context.Tag("IUserRepository")<
  IUserRepository,
  {
    findById:      (...) => ...
    findByEmail:   (...) => ...
    findAll:       (...) => ...
    save:          (...) => ...
    update:        (...) => ...
    delete:        (...) => ...
    existsByEmail: (...) => ...
    // Tambahkan method baru KETIKA ada program yang butuh — bukan sebelumnya
  }
>() {}
```

---

### 22.5 Separation of Concerns (SoC)

> Pisahkan kode berdasarkan jenis concern yang ditangani

```
Concern               Layer                  File Pattern
─────────────────     ──────────────────     ────────────────────
Business Rules    →   domain/*.module.ts     UserModule, BillingModule
Data Shape        →   domain/*.types.ts      TUser, TSubscription
Error Types       →   domain/*.errors.ts     UserNotFoundError
Use Cases         →   domain/*.programs.ts   registerProgram
Input Validation  →   domain/*.schemas.ts    RegisterSchema
Output Format     →   domain/*.dto.ts        TUserDto, toUserDto
Data Access       →   domain/*.repository.ts IUserRepository
External Service  →   domain/*.service.ts    IBillingService
Implementation    →   domain/*.live.ts       UserRepositoryLive
Composition       →   infra/runtime/         AppLayer
HTTP Handling     →   pages/api/             Route handlers
UI               →   domain/*/components/   React components
Styling          →   *.module.css           CSS Modules
Constants        →   */constants/           API_BASE, HTTP_STATUS
Config           →   shared/env/            AppConfig
```

---

### 22.6 Law of Demeter (Principle of Least Knowledge)

> Object/function hanya boleh bicara dengan "teman dekat"-nya

```typescript
// ❌ Law of Demeter violation — chaining terlalu dalam
const city = user.getAddress().getCity().getName()
//                 ↑ tahu Address  ↑ tahu City  ↑ tahu name field

// ❌ Dalam FP context — domain yang tahu terlalu banyak tentang domain lain
// domain/billing/billing.programs.ts
const createInvoice = (tenantId: string) =>
  Effect.gen(function* () {
    const tenantRepo = yield* ITenantRepository
    const tenant     = yield* tenantRepo.findById(tenantId)
    // billing tahu terlalu banyak tentang internal tenant
    const plan = tenant?.subscription?.currentPlan?.tier?.name  // ← terlalu dalam!
  })

// ✅ Domain expose hanya yang perlu diketahui via barrel
// domain/tenant/index.ts hanya export apa yang billing boleh tahu
export type { TTenant } from "./tenant.types"
// TTenant.plan sudah cukup — billing tidak perlu tahu internal subscription detail

// domain/billing/billing.programs.ts
const createInvoice = (tenant: TTenant) =>
  Effect.gen(function* () {
    const plan = tenant.plan  // ← satu level, cukup
  })
```

---

### 22.7 Composition over Inheritance

> Bangun behaviour dari kombinasi fungsi kecil, bukan hierarki class

```typescript
// ❌ Inheritance hierarchy — fragile, tightly coupled
class BaseRepository {
  protected db: Database
  findById(id: string) { ... }
}
class UserRepository extends BaseRepository {
  findByEmail(email: string) { ... }
}
class TenantUserRepository extends UserRepository {
  findByTenant(tenantId: string) { ... }
}
// Setiap perubahan di BaseRepository bisa break semua turunannya

// ✅ Composition — Layer + function composition
// Setiap piece berdiri sendiri, di-compose di AppLayer
const UserRepositoryLive  = Layer.effect(IUserRepository, ...)
const withTenantFilter    = (tenantId: TTenantId) => (query: Query) => query.where(...)
const withPagination      = (input: TPaginationInput) => (query: Query) => query.limit(...)

// Compose behaviour via function — bukan class hierarki
const findUsers = (tenantId: TTenantId, pagination: TPaginationInput) =>
  pipe(
    baseQuery,
    withTenantFilter(tenantId),
    withPagination(pagination),
    executeQuery,
  )
```

---

### 22.8 Fail Fast

> Deteksi dan report error sesegera mungkin

```typescript
// ✅ Fail fast di setiap layer

// Layer 1: Config validation saat startup — bukan saat request masuk
export const AppConfig = {
  databaseUrl: Config.string("DATABASE_URL"),  // fail saat startup jika tidak ada
}
// Jika DATABASE_URL tidak ada → aplikasi tidak start → alert langsung

// Layer 2: Input validation di presentation layer — sebelum masuk domain
const program = pipe(
  Schema.decodeUnknown(CreateUserSchema)(body),
  // ← fail di sini jika input tidak valid — tidak sampai ke domain
  Effect.flatMap(createUserProgram),
)

// Layer 3: Domain validation — sebelum persist
const user = yield* UserModule.create(command)
// ← fail di sini jika email format tidak valid — tidak sampai ke DB

// Layer 4: DB constraint — last resort
// Unique constraint di DB sebagai final guard — bukan satu-satunya guard
```

---

### 22.9 Explicit over Implicit

> Buat intent dan dependency terlihat jelas di kode

```typescript
// ❌ Implicit — tidak jelas apa yang terjadi
const getUser = (id: string) => findById(id)
// Siapa findById? Dari mana? Side effect apa? Error apa yang mungkin?

// ✅ Explicit — semua dependency, error, dan requirement terlihat
const getUserProgram = (
  id: string,
): Effect.Effect<
  TUserDto,                              // ← jelas apa yang di-return
  UserNotFoundError | DatabaseError,     // ← jelas error apa yang mungkin
  IUserRepository                        // ← jelas dependency apa yang dibutuhkan
> =>
  pipe(
    IUserRepository,
    Effect.flatMap((repo) => repo.findById(id as TUserId)),
    Effect.flatMap((user) =>
      user ? Effect.succeed(toUserDto(user)) : Effect.fail(new UserNotFoundError({ id })),
    ),
  )
```

---

### 22.10 Principle of Least Astonishment (POLA)

> Kode harus berperilaku sesuai dengan yang diharapkan — tidak ada surprise

```typescript
// ❌ Surprising — nama tidak mencerminkan behaviour
const getUser = (id: string) => {
  sendAnalyticsEvent("user_fetched")  // ← side effect tidak terduga!
  return repo.findById(id)
}

// ❌ Surprising — mutation tidak terlihat dari signature
const prepareUser = (user: TUser) => {
  user.name = user.name.trim()  // ← mutasi argument tidak terduga!
  return user
}

// ✅ No surprise — nama = behaviour, tidak ada hidden side effect
const fetchUser    = (id: string): Effect.Effect<TUser | null, DatabaseError, IUserRepository> =>
  pipe(IUserRepository, Effect.flatMap((r) => r.findById(id as TUserId)))

const withTrimmedName = (user: TUser): TUser =>   // pure, tidak mutate argument
  ({ ...user, name: user.name.trim() })
```

---

### 22.11 Boy Scout Rule

> Selalu tinggalkan kode lebih bersih dari yang kamu temukan

| Kapan | Apa yang dilakukan |
|---|---|
| Saat fix bug | Tambahkan test untuk bug tersebut |
| Saat baca fungsi | Jika ada naming yang membingungkan, rename |
| Saat touch file | Jika ada `any` yang mudah diperbaiki, perbaiki |
| Saat review PR | Flag technical debt kecil sebagai inline comment |
| Saat sprint end | Alokasikan 10-20% waktu untuk cleanup |

**Batasnya:** Boy Scout Rule bukan "refactor seluruh file jika menyentuh satu fungsi". Scope-nya: **hal kecil yang bisa diperbaiki tanpa risk regression**, dalam waktu < 30 menit.

---

### 22.12 Robustness Principle (Postel's Law)

> Be conservative in what you send, be liberal in what you accept

```typescript
// ✅ Liberal dalam menerima input — Schema yang toleran
const CreateUserSchema = Schema.Struct({
  email: Schema.String.pipe(
    // Terima email dengan atau tanpa trailing space — normalisasi di sini
    Schema.transform(Schema.String, {
      decode: (s) => s.trim().toLowerCase(),
      encode: (s) => s,
    }),
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  ),
  name: Schema.String.pipe(
    Schema.transform(Schema.String, {
      decode: (s) => s.trim(),  // trim whitespace
      encode: (s) => s,
    }),
    Schema.minLength(2),
  ),
  // role optional — default ke "member"
  role: Schema.optional(
    Schema.Union(Schema.Literal("admin"), Schema.Literal("member"), Schema.Literal("viewer")),
    { default: () => "member" as const },
  ),
})

// ✅ Conservative dalam response — hanya kirim yang diperlukan
const toUserDto = (user: TUser): TUserDto => ({
  id:        user.id,
  email:     user.email,
  name:      user.name,
  role:      user.role,
  status:    user.status,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
  // hashedPassword TIDAK ikut — conservative!
  // tenantId tidak di-expose ke client secara default
})
```

---

### 22.13 Principle of Reversibility

> Jaga keputusan arsitektur tetap reversible selama mungkin

```typescript
// ✅ Reversible — adapter pattern memungkinkan swap tanpa cascade change
// Keputusan: pakai Stripe untuk billing
export const AppLayer = Layer.mergeAll(
  StripeBillingServiceLive,  // ← satu baris ini yang di-swap
  // ... semua layer lain tidak berubah
)
// Jika berubah pikiran → Paddle: ganti satu baris, semua program tetap sama

// ✅ Reversible — database schema dengan migration
// Jangan hapus kolom langsung — deprecated dulu
export const users = pgTable("users", {
  // ...
  legacyField: text("legacy_field"),  // ← deprecated, akan dihapus sprint berikut
  // Jika butuh rollback — kolom masih ada, data tidak hilang
})

// ❌ Tidak reversible — coupling ke implementasi konkret
import { stripe } from "@/lib/stripe"  // langsung pakai Stripe tanpa adapter
await stripe.subscriptions.create(...)  // tersebar di 20 file
// Untuk ganti provider — harus ubah 20 file
```

---

### 22.14 Engineering Principles Summary

```
Principle              FP/Effect Manifestation
─────────────────────  ──────────────────────────────────────────────
SRP                    Satu function, satu tanggung jawab
OCP                    Interface terbuka via Layer — tidak ubah code
LSP                    Contract test untuk semua implementasi
ISP                    Context.Tag kecil dan focused
DIP                    yield* IService, bukan new ConcreteService()
DRY                    Single source of truth di shared/
KISS                   Effect + Layer — tidak perlu DI framework manual
YAGNI                  Implement method di interface hanya jika ada program yang butuh
SoC                    Vertical slice — setiap file punya satu concern
Law of Demeter         Domain hanya import dari barrel index.ts domain lain
Composition > Inherit  Module pattern + Layer composition
Fail Fast              Config validation di startup, input validation di boundary
Explicit > Implicit    Return type Effect<A, E, R> — semua dependency visible
POLA                   Pure function — output deterministik dari input
Boy Scout              Setiap PR sedikit lebih bersih
Postel's Law           Liberal terima input (Schema normalize), conservative kirim output (DTO)
Reversibility          Adapter pattern — semua keputusan vendor bisa di-swap
12-Factor              Stateless, config from env, backing service interchangeable
```

---

## 23. Security Standards

Keamanan bukan afterthought — setiap layer punya tanggung jawab security yang spesifik.

### 23.1 Authentication & Session

| # | Rule |
|---|---|
| R-SEC-01 | Session ID dibuat dengan `crypto.randomUUID()` — tidak pernah sequential atau predictable |
| R-SEC-02 | Session cookie wajib: `httpOnly: true`, `secure: true`, `sameSite: "lax"` |
| R-SEC-03 | Session disimpan di DB + Redis — tidak di memory server |
| R-SEC-04 | Session expired otomatis — default 30 hari, configurable via env |
| R-SEC-05 | Invalidate semua session saat password diubah |
| R-SEC-06 | Rate limit endpoint auth: max 5 attempt per IP per menit |

```typescript
// ✅ Secure cookie setup
cookies.set("session_id", session.id, {
  httpOnly: true,   // tidak bisa diakses JavaScript
  secure:   true,   // hanya HTTPS
  sameSite: "lax",  // CSRF protection
  path:     "/",
  maxAge:   60 * 60 * 24 * 30,  // 30 hari
})

// ✅ Rate limit di auth endpoint
const program = pipe(
  rateLimit({ key: `login:${ip}`, limit: 5, windowSeconds: 60 }),
  Effect.flatMap(() => loginProgram(command)),
)
```

### 23.2 Authorization & RBAC

| # | Rule |
|---|---|
| R-SEC-07 | Setiap program yang mengubah data wajib cek permission via `IPermissionService` |
| R-SEC-08 | Tenant isolation enforced di repository — setiap query filter by `tenant_id` |
| R-SEC-09 | User tidak bisa akses resource tenant lain — verifikasi `tenantId` match |
| R-SEC-10 | Admin endpoint dilindungi role check, bukan hanya auth check |

```typescript
// ✅ Permission check — wajib sebelum operasi sensitif
const suspendUserProgram = (targetId: string, requesterId: string) =>
  Effect.gen(function* () {
    const perm   = yield* IPermissionService
    const tenant = yield* TenantContext

    // Cek permission DULU — sebelum load data
    yield* perm.check(requesterId as TUserId, tenant.id, "users:write")

    const repo = yield* IUserRepository
    const user = yield* repo.findById(targetId as TUserId)
    // ... rest of logic
  })

// ✅ Tenant isolation di repository
findAll: (tenantId, pagination) =>
  Effect.tryPromise({
    try: () => db.select().from(users)
      .where(eq(users.tenantId, tenantId))  // ← WAJIB, tidak boleh dihilangkan
      .limit(limit).offset(offset),
    catch: (err) => new DatabaseError({ cause: err }),
  }),
```

### 23.3 Input Validation & Sanitization

| # | Rule |
|---|---|
| R-SEC-11 | Semua input dari client divalidasi dengan `effect/Schema` sebelum masuk domain |
| R-SEC-12 | Tidak ada string interpolation di SQL — selalu gunakan parameterized query (Drizzle handle ini) |
| R-SEC-13 | File upload: validasi content-type, ukuran, dan scan via presigned URL policy |
| R-SEC-14 | HTML user input di-escape sebelum di-render — gunakan React's default escaping |
| R-SEC-15 | Tidak ada `eval()`, `Function()`, atau dynamic code execution |

```typescript
// ✅ Validasi ketat di presentation layer
const program = pipe(
  Schema.decodeUnknown(CreateUserSchema)(body),
  // Schema sudah include: pattern check, length limit, type coercion
  Effect.mapError((e) => new ValidationError({ issues: e.message })),
  Effect.flatMap(createUserProgram),
)

// ✅ File upload policy di S3/R2 — bukan hanya cek di server
const uploadPolicy = {
  conditions: [
    ["content-length-range", 0, UPLOAD_MAX_SIZE_BYTES],
    ["eq", "$Content-Type", contentType],
  ],
}
```

### 23.4 Secrets Management

| # | Rule |
|---|---|
| R-SEC-16 | Tidak ada secret di source code, git history, atau log |
| R-SEC-17 | Secret disimpan di platform secret store (Vercel env, Doppler, AWS Secrets Manager) |
| R-SEC-18 | Gunakan `Config.redacted()` untuk secret — mencegah logging |
| R-SEC-19 | Rotate secret secara berkala — minimal 90 hari untuk credential prod |
| R-SEC-20 | Webhook secret divalidasi via HMAC signature — tidak percaya payload tanpa verifikasi |

```typescript
// ✅ Config.redacted — secret tidak bisa di-log secara tidak sengaja
export const AppConfig = {
  stripeKey:    Config.redacted(Config.string("STRIPE_SECRET_KEY")),
  luciaSecret:  Config.redacted(Config.string("LUCIA_SECRET")),
  storageSecret:Config.redacted(Config.string("STORAGE_SECRET_KEY")),
} as const

// Ketika di-log, Redacted akan tampil sebagai "<redacted>"
// bukan nilai aslinya

// ✅ Webhook HMAC verification
constructWebhookEvent: (payload, signature) =>
  Effect.try({
    try:   () => stripe.webhooks.constructEvent(payload, signature, webhookSecret),
    catch: (err) => new BillingWebhookInvalidError({ reason: String(err) }),
  }),
```

### 23.5 Security Checklist per PR

```
[ ] Tidak ada secret, credential, atau API key di diff
[ ] Input baru divalidasi dengan Schema sebelum dipakai
[ ] Endpoint baru memiliki auth middleware
[ ] Operasi sensitif memiliki permission check
[ ] Query baru filter by tenant_id
[ ] Upload endpoint validasi file type dan size
[ ] Rate limiting ada di endpoint auth dan public-facing
[ ] Response tidak mengekspos data sensitif (hashedPassword, dll)
```

---

## 24. Performance Standards

### 24.1 Response Time Targets

| Endpoint Type | P50 | P95 | P99 |
|---|---|---|---|
| Static page (SSG) | < 50ms | < 100ms | < 200ms |
| API read (single resource) | < 50ms | < 200ms | < 500ms |
| API read (list + pagination) | < 100ms | < 300ms | < 700ms |
| API write (create/update) | < 100ms | < 400ms | < 1000ms |
| Auth (login/register) | < 200ms | < 500ms | < 1000ms |
| File presign | < 50ms | < 200ms | < 500ms |
| Webhook dispatch | < 500ms | < 2000ms | < 5000ms |

### 24.2 Database Performance Rules

| # | Rule |
|---|---|
| R-PERF-01 | Setiap query yang sering dijalankan wajib punya index yang relevan |
| R-PERF-02 | Tidak ada N+1 query — gunakan `Effect.all([...], { concurrency: N })` untuk parallel fetch |
| R-PERF-03 | Pagination wajib di semua endpoint yang return list — tidak ada `SELECT *` tanpa limit |
| R-PERF-04 | Query yang paling sering dijalankan di-cache di Redis dengan TTL yang sesuai |
| R-PERF-05 | Gunakan `db.select({ id: users.id })` bukan `db.select()` jika hanya butuh subset kolom |

```typescript
// ❌ N+1 query — satu query per user
const usersWithTenants = yield* Effect.all(
  users.map((u) => tenantRepo.findById(u.tenantId)),  // N queries!
)

// ✅ Parallel fetch dengan concurrency control
const [users, countResult] = yield* Effect.all(
  [
    Effect.tryPromise({ try: () => db.select().from(users).limit(limit).offset(offset), catch: ... }),
    Effect.tryPromise({ try: () => db.select({ total: count() }).from(users), catch: ... }),
  ],
  { concurrency: 2 },  // dua query jalan paralel
)

// ✅ Select hanya kolom yang dibutuhkan
const ids = yield* Effect.tryPromise({
  try: () => db.select({ id: users.id, email: users.email })  // bukan SELECT *
    .from(users)
    .where(eq(users.tenantId, tenantId)),
  catch: (err) => new DatabaseError({ cause: err }),
})
```

### 24.3 Caching Strategy

| Data | Cache TTL | Invalidation |
|---|---|---|
| User session | 30 hari | Logout, password change |
| Tenant config | 5 menit | Saat config di-update |
| Permission matrix | 1 menit | Saat role di-update |
| Rate limit counter | Window duration | Otomatis |
| Query result (read-heavy) | 30 detik | Write-through |

```typescript
// ✅ Cache-aside pattern dengan Effect
const getTenantCached = (tenantId: TTenantId) =>
  Effect.gen(function* () {
    const cache = yield* ICacheAdapter
    const repo  = yield* ITenantRepository
    const key   = `tenant:${tenantId}`

    const cached = yield* cache.get<TTenant>(key)
    if (Option.isSome(cached)) return Option.getOrThrow(cached)

    const tenant = yield* repo.findById(tenantId)
    if (tenant) yield* cache.set(key, tenant, 300)  // 5 menit TTL
    return tenant
  })
```

### 24.4 Bundle Size Rules

| # | Rule |
|---|---|
| R-PERF-06 | Tidak ada library besar di-import di client-side tanpa code splitting |
| R-PERF-07 | Gunakan Astro island — React hanya di-hydrate untuk komponen interaktif |
| R-PERF-08 | Image selalu pakai Astro `<Image>` — otomatis optimize dan lazy load |
| R-PERF-09 | Font di-preload dengan `<link rel="preload">` — tidak ada layout shift |

---

## 25. API Design Standards

### 25.1 URL Conventions

| Pattern | Contoh | Keterangan |
|---|---|---|
| Resource collection | `GET /api/v1/users` | Plural noun |
| Single resource | `GET /api/v1/users/:id` | Dengan ID |
| Nested resource | `GET /api/v1/tenants/:id/users` | Parent-child |
| Action pada resource | `POST /api/v1/users/:id/suspend` | Verb sebagai sub-resource |
| Versioning | `/api/v1/`, `/api/v2/` | Di URL path, bukan header |

```typescript
// ✅ Consistent URL pattern di constants
export const ROUTES = {
  USERS:         `${API_BASE}/users`,
  USER:          (id: string) => `${API_BASE}/users/${id}`,
  USER_SUSPEND:  (id: string) => `${API_BASE}/users/${id}/suspend`,
  USER_ACTIVATE: (id: string) => `${API_BASE}/users/${id}/activate`,
  BILLING: {
    CHECKOUT: `${API_BASE}/billing/checkout`,
    PORTAL:   `${API_BASE}/billing/portal`,
    WEBHOOK:  `${API_BASE}/billing/webhook`,
  },
} as const
```

### 25.2 HTTP Method Semantics

| Method | Semantik | Idempotent | Body |
|---|---|---|---|
| `GET` | Baca resource | ✅ Ya | Tidak |
| `POST` | Buat resource baru | ❌ Tidak | Ya |
| `PUT` | Replace seluruh resource | ✅ Ya | Ya |
| `PATCH` | Update sebagian resource | ❌ Tidak | Ya |
| `DELETE` | Hapus resource | ✅ Ya | Tidak |

### 25.3 Response Format

Semua response menggunakan `TApiResponse<T>` — konsisten di semua endpoint:

```typescript
// ✅ Success response
{
  "success": true,
  "data": {
    "id": "usr-123",
    "email": "user@example.com",
    "name": "Test User",
    "role": "member",
    "status": "active",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "meta": {
    "requestId": "req-abc-123",
    "timestamp": "2024-01-15T10:00:00.000Z"
  }
}

// ✅ Error response
{
  "success": false,
  "error": {
    "_tag": "UserNotFoundError",
    "message": "User tidak ditemukan",
    "details": { "id": "usr-999" }   // optional — hanya jika berguna untuk client
  },
  "meta": {
    "requestId": "req-abc-124",
    "timestamp": "2024-01-15T10:00:01.000Z"
  }
}

// ✅ Paginated list response
{
  "success": true,
  "data": {
    "data": [...],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

### 25.4 HTTP Status Code Standards

```typescript
export const HTTP_STATUS = {
  OK:                200,  // GET berhasil, PATCH berhasil
  CREATED:           201,  // POST berhasil — resource dibuat
  NO_CONTENT:        204,  // DELETE berhasil — tidak ada body
  BAD_REQUEST:       400,  // Input tidak valid (ValidationError)
  UNAUTHORIZED:      401,  // Tidak ada session / session expired
  FORBIDDEN:         403,  // Ada session tapi tidak punya permission
  NOT_FOUND:         404,  // Resource tidak ditemukan
  CONFLICT:          409,  // Duplicate — email sudah dipakai
  TOO_MANY_REQUESTS: 429,  // Rate limit exceeded
  INTERNAL_ERROR:    500,  // Database error, unexpected error
} as const

// Mapping error tag ke HTTP status — konsisten di semua route
const ERROR_TO_STATUS: Record<string, number> = {
  ValidationError:           HTTP_STATUS.BAD_REQUEST,
  InvalidEmailError:         HTTP_STATUS.BAD_REQUEST,
  UnauthorizedError:         HTTP_STATUS.UNAUTHORIZED,
  SessionExpiredError:       HTTP_STATUS.UNAUTHORIZED,
  ForbiddenError:            HTTP_STATUS.FORBIDDEN,
  InsufficientPermissionError: HTTP_STATUS.FORBIDDEN,
  UserNotFoundError:         HTTP_STATUS.NOT_FOUND,
  TenantNotFoundError:       HTTP_STATUS.NOT_FOUND,
  UserAlreadyExistsError:    HTTP_STATUS.CONFLICT,
  EmailAlreadyRegisteredError: HTTP_STATUS.CONFLICT,
  RateLimitExceededError:    HTTP_STATUS.TOO_MANY_REQUESTS,
  DatabaseError:             HTTP_STATUS.INTERNAL_ERROR,
  StorageError:              HTTP_STATUS.INTERNAL_ERROR,
  MailError:                 HTTP_STATUS.INTERNAL_ERROR,
} as const
```

### 25.5 Pagination Query Parameters

```
GET /api/v1/users?page=1&limit=20&sort=createdAt&order=desc&search=john

page    — halaman (default: 1, min: 1)
limit   — item per halaman (default: 20, max: 100)
sort    — kolom untuk sort (default: createdAt)
order   — asc | desc (default: desc)
search  — full-text search (optional)
```

```typescript
// ✅ Parse query params dengan validation
const parsePaginationQuery = (url: URL): Effect.Effect<TPaginationInput, ValidationError> =>
  Effect.try({
    try: () => {
      const page  = Math.max(1, Number(url.searchParams.get("page")  ?? 1))
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)))
      if (isNaN(page) || isNaN(limit)) throw new Error("Invalid pagination params")
      return { page, limit }
    },
    catch: () => new ValidationError({ issues: "page dan limit harus angka positif" }),
  })
```

### 25.6 Idempotency untuk Write Operations

```typescript
// ✅ Idempotency key untuk operasi yang tidak boleh dijalankan dua kali
// (misal: billing checkout)
export const POST: APIRoute = async ({ request }) => {
  const idempotencyKey = request.headers.get("Idempotency-Key")

  if (idempotencyKey) {
    // Cek apakah sudah pernah dijalankan
    const program = Effect.gen(function* () {
      const cache = yield* ICacheAdapter
      const existing = yield* cache.get<TApiResponse>(`idem:${idempotencyKey}`)

      if (Option.isSome(existing)) {
        return Option.getOrThrow(existing)  // return cached response
      }

      const result = yield* createCheckoutProgram(params)

      // Simpan response untuk idempotency check
      yield* cache.set(`idem:${idempotencyKey}`, result, 86400)  // 24 jam
      return result
    })
    // ...
  }
}
```

---

## 26. Database Standards

### 26.1 Schema Design Rules

| # | Rule |
|---|---|
| R-DB-01 | Semua tabel punya `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| R-DB-02 | Semua tabel punya `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| R-DB-03 | Tabel yang di-update punya `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |
| R-DB-04 | Semua tabel tenant-scoped punya `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE` |
| R-DB-05 | Tidak ada `VARCHAR` tanpa length — selalu spesifikkan: `VARCHAR(255)` |
| R-DB-06 | Boolean selalu `NOT NULL DEFAULT false` — tidak pernah nullable |
| R-DB-07 | Soft delete menggunakan `deleted_at TIMESTAMPTZ NULL` — bukan flag boolean |

```typescript
// ✅ Standard table definition
export const users = pgTable("users", {
  // Required fields untuk semua tabel
  id:        uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

  // Tenant isolation — wajib untuk semua data domain
  tenantId:  uuid("tenant_id").notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  // Domain fields
  email:     varchar("email", { length: 255 }).notNull(),
  name:      varchar("name",  { length: 100 }).notNull(),
  role:      varchar("role",  { length: 20  }).notNull().default("member"),
  status:    varchar("status",{ length: 20  }).notNull().default("active"),

  // Nullable dengan tipe eksplisit
  avatarUrl: text("avatar_url"),  // nullable — boleh null

  // Boolean dengan default
  isVerified: boolean("is_verified").notNull().default(false),

  // Soft delete
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({
  // Index conventions
  tenantEmailIdx: uniqueIndex("users_tenant_email_idx").on(t.tenantId, t.email),
  tenantIdx:      index("users_tenant_idx").on(t.tenantId),
  statusIdx:      index("users_status_idx").on(t.status),
  deletedAtIdx:   index("users_deleted_at_idx").on(t.deletedAt),
}))
```

### 26.2 Migration Rules

| # | Rule |
|---|---|
| R-DB-08 | Tidak pernah ubah migration yang sudah di-apply ke production |
| R-DB-09 | Migration bersifat additive — tidak hapus kolom atau rename secara langsung |
| R-DB-10 | Untuk rename kolom: add kolom baru → copy data → drop kolom lama (3 migration) |
| R-DB-11 | Migration harus idempotent jika memungkinkan (`IF NOT EXISTS`, `IF EXISTS`) |
| R-DB-12 | Setiap PR yang ubah schema wajib include migration file |

```typescript
// ✅ Safe rename — 3 langkah
// Migration 001: tambah kolom baru
ALTER TABLE users ADD COLUMN full_name VARCHAR(200);

// Migration 002: copy data + update application code
UPDATE users SET full_name = name;
-- Deploy code yang baca full_name (bukan name)

// Migration 003: drop kolom lama
ALTER TABLE users DROP COLUMN name;
// Hanya setelah memastikan tidak ada code yang masih pakai name

// ❌ Dangerous — langsung rename di satu migration
ALTER TABLE users RENAME COLUMN name TO full_name;
// → crash semua code yang masih pakai `name`
```

### 26.3 Index Standards

```typescript
// Index naming convention: {table}_{columns}_{type}_idx
// Type: idx (regular), uidx (unique), pidx (partial)

export const posts = pgTable("posts", {
  // ...
}, (t) => ({
  // Unique index
  slugIdx:         uniqueIndex("posts_slug_uidx").on(t.slug),

  // Composite index untuk query yang sering: WHERE tenant_id = ? AND status = ?
  tenantStatusIdx: index("posts_tenant_status_idx").on(t.tenantId, t.status),

  // Partial index — hanya index data yang aktif (lebih efisien)
  activePostsIdx:  index("posts_active_pidx")
    .on(t.createdAt)
    .where(sql`${t.status} = 'published'`),

  // Index untuk sort yang sering
  tenantCreatedIdx: index("posts_tenant_created_idx")
    .on(t.tenantId, t.createdAt),
}))
```

---

## 27. Observability Standards

### 27.1 Logging Standards

Setiap log entry harus punya field berikut:

```typescript
// Minimal log structure
type TLogEntry = {
  readonly level:       "debug" | "info" | "warn" | "error"
  readonly message:     string
  readonly timestamp:   string                     // ISO 8601
  readonly environment: string                     // development | staging | production
  readonly service:     string                     // nama aplikasi
  readonly version:     string                     // git SHA atau semver
  readonly requestId?:  string                     // untuk request-scoped log
  readonly userId?:     string                     // jika ada session
  readonly tenantId?:   string                     // jika multi-tenant
  readonly duration?:   number                     // ms — untuk performance log
  readonly error?:      {
    readonly tag:     string
    readonly message: string
    readonly stack?:  string
  }
}
```

```typescript
// src/shared/utils/logger.ts — structured logger

const SERVICE_NAME    = process.env.SERVICE_NAME    ?? "app"
const SERVICE_VERSION = process.env.SERVICE_VERSION ?? "unknown"
const NODE_ENV        = process.env.NODE_ENV        ?? "development"

const makeLogEntry = (
  level:   TLogEntry["level"],
  message: string,
  context: Partial<TLogEntry> = {},
): TLogEntry => ({
  level,
  message,
  timestamp:   new Date().toISOString(),
  environment: NODE_ENV,
  service:     SERVICE_NAME,
  version:     SERVICE_VERSION,
  ...context,
})

export const logger = {
  debug: (msg: string, ctx?: Partial<TLogEntry>) => {
    if (NODE_ENV !== "production")
      console.log(JSON.stringify(makeLogEntry("debug", msg, ctx)))
  },
  info: (msg: string, ctx?: Partial<TLogEntry>) =>
    console.log(JSON.stringify(makeLogEntry("info", msg, ctx))),

  warn: (msg: string, ctx?: Partial<TLogEntry>) =>
    console.warn(JSON.stringify(makeLogEntry("warn", msg, ctx))),

  error: (msg: string, ctx?: Partial<TLogEntry>) =>
    console.error(JSON.stringify(makeLogEntry("error", msg, ctx))),

  // Request-scoped logger — semua log punya requestId
  withRequest: (requestId: string) => ({
    info:  (msg: string, ctx?: Partial<TLogEntry>) =>
      logger.info(msg, { ...ctx, requestId }),
    warn:  (msg: string, ctx?: Partial<TLogEntry>) =>
      logger.warn(msg, { ...ctx, requestId }),
    error: (msg: string, ctx?: Partial<TLogEntry>) =>
      logger.error(msg, { ...ctx, requestId }),
  }),
} as const
```

### 27.2 What to Log

| Event | Level | Fields wajib |
|---|---|---|
| Request masuk | `info` | `requestId`, `method`, `path`, `userAgent` |
| Request selesai | `info` | `requestId`, `status`, `duration` |
| Business error (4xx) | `warn` | `requestId`, `errorTag`, `message` |
| System error (5xx) | `error` | `requestId`, `errorTag`, `cause`, `stack` |
| Auth success | `info` | `requestId`, `userId`, `tenantId` |
| Auth failure | `warn` | `requestId`, `email`, `reason` |
| DB slow query (> 1s) | `warn` | `duration`, `query` |
| External API call | `info` | `service`, `duration`, `status` |

### 27.3 What NOT to Log

```typescript
// ❌ JANGAN LOG — data sensitif
logger.info("User login", {
  email:    user.email,
  password: command.password,    // ← JANGAN!
  token:    session.id,          // ← JANGAN!
  stripeKey: config.stripeKey,   // ← JANGAN!
})

// ✅ Log hanya identifier, bukan data
logger.info("User login successful", {
  requestId,
  userId:   user.id,
  tenantId: user.tenantId,
  // email tidak perlu — userId sudah cukup untuk trace
})
```

### 27.4 Health Check Endpoint

```typescript
// src/pages/api/health.ts
import type { APIRoute } from "astro"
import { Effect, pipe } from "effect"
import { DrizzleClient } from "@/infra/db/drizzle.client"
import { ICacheAdapter } from "@/infra/cache/cache.adapter"
import { runApp } from "@/infra/runtime/app.runtime"

export const GET: APIRoute = async () => {
  const startTime = Date.now()

  const checks = await runApp(
    Effect.gen(function* () {
      const db    = yield* DrizzleClient
      const cache = yield* ICacheAdapter

      // DB check
      const dbOk = yield* Effect.tryPromise({
        try:   () => db.execute(sql`SELECT 1`).then(() => true),
        catch: () => Effect.succeed(false),
      }).pipe(Effect.orElseSucceed(() => false))

      // Cache check
      const cacheKey = `health:${Date.now()}`
      const cacheOk  = yield* pipe(
        cache.set(cacheKey, "ok", 10),
        Effect.flatMap(() => cache.get(cacheKey)),
        Effect.map(Option.isSome),
        Effect.orElseSucceed(() => false),
      )

      return { db: dbOk, cache: cacheOk }
    }),
  )

  const allOk  = Object.values(checks).every(Boolean)
  const status = allOk ? 200 : 503

  return Response.json({
    status:   allOk ? "healthy" : "degraded",
    checks,
    uptime:   process.uptime(),
    duration: Date.now() - startTime,
    version:  process.env.SERVICE_VERSION ?? "unknown",
    timestamp: new Date().toISOString(),
  }, { status })
}
```

---

## 28. Onboarding Guide — New Engineer

### 28.1 Day 1 — Setup

```bash
# 1. Clone repo
git clone git@github.com:org/project.git
cd project

# 2. Install dependencies
pnpm install

# 3. Copy env template
cp .env.example .env.local
# Minta nilai dari tech lead atau secret manager

# 4. Setup DB lokal
pnpm db:push        # push schema ke DB lokal

# 5. Verifikasi setup
pnpm typecheck      # tidak ada error TypeScript
pnpm check          # Biome lint clean
pnpm check:deps     # tidak ada cycle
pnpm test:run       # semua test pass

# 6. Jalankan dev server
pnpm dev
```

### 28.2 Day 1 — Reading Order

Baca dokumen dan kode dalam urutan ini:

```
1. Baca ENGINEERING_STANDARDS.md section 1-4 dulu
   → Pahami paradigma FP, vertical slice, dan dependency rules

2. Baca src/shared/ — foundation semua domain
   → common.types.ts, infrastructure.errors.ts, api.constants.ts

3. Baca satu domain lengkap — mulai dari user/
   → user.types.ts → user.errors.ts → user.module.ts
   → user.repository.ts → user.programs.ts → user.dto.ts → index.ts

4. Baca infra/runtime/app.runtime.ts
   → Pahami bagaimana semua Layer di-wire

5. Baca satu API route lengkap
   → pages/api/v1/users/index.ts

6. Jalankan test — baca user.test.ts
   → Pahami pola in-memory Layer di test
```

### 28.3 Week 1 — First Task

Task pertama selalu: **tambahkan field baru ke domain yang sudah ada**.

Contoh: tambahkan field `phoneNumber` ke domain `user`:

```bash
# Checklist task pertama:
[ ] Tambahkan field ke user.types.ts (readonly)
[ ] Update Drizzle schema di infra/db/drizzle.schema.ts
[ ] Generate migration: pnpm db:generate
[ ] Update user.repository.live.ts (dbRowToUser helper)
[ ] Update user.dto.ts jika perlu di-expose ke client
[ ] Update user.schemas.ts jika ada di input
[ ] Tambahkan test di user.test.ts
[ ] Run: pnpm typecheck && pnpm test:run && pnpm check:deps
[ ] Buat PR dengan checklist PR reviewer
```

### 28.4 Mental Model Check — FP

Sebelum menulis kode, tanya diri sendiri:

```
1. "Apakah function ini pure?"
   → Output bergantung hanya pada input?
   → Tidak ada side effect tersembunyi?

2. "Apakah ada data yang di-mutate?"
   → Gunakan spread: { ...obj, field: newValue }
   → Gunakan map/filter/reduce, bukan push/splice

3. "Apakah ada throw atau try/catch?"
   → Ganti dengan Effect.fail(new TaggedError(...))
   → Ganti dengan Effect.tryPromise({ try, catch })

4. "Apakah ada class yang baru?"
   → Apakah itu TaggedError atau Context.Tag?
   → Kalau bukan → refactor ke module pattern

5. "Apakah import dari domain lain lewat index.ts?"
   → Tidak ada deep import dari file internal domain

6. "Apakah return type Effect sudah menyebut semua error?"
   → Effect<A, E, R> — E harus lengkap
```

### 28.5 Common Mistakes & Fixes

```typescript
// ─────────────────────────────────────────────────────────────────────────
// MISTAKE 1: Forget to add to AppLayer
// Symptom: "Service not found" runtime error

// Fix: cek app.runtime.ts
export const AppLayer = Layer.mergeAll(
  UserRepositoryLive,
  NewDomainRepositoryLive,  // ← tambahkan di sini
  ...otherLayers,
)

// ─────────────────────────────────────────────────────────────────────────
// MISTAKE 2: Import domain type langsung tanpa barrel
// Symptom: Biome/dependency-cruiser error

// ❌ Wrong
import { TUser } from "@/domain/user/user.types"

// ✅ Fix
import type { TUser } from "@/domain/user/index"

// ─────────────────────────────────────────────────────────────────────────
// MISTAKE 3: Pakai async/await di program
// Symptom: TypeScript error — Effect tidak compatible dengan Promise

// ❌ Wrong
const program = async () => {
  const user = await repo.findById(id)  // repo.findById return Effect, bukan Promise
}

// ✅ Fix — gunakan Effect.gen
const program = Effect.gen(function* () {
  const repo = yield* IUserRepository
  const user = yield* repo.findById(id)  // yield* untuk unwrap Effect
})

// ─────────────────────────────────────────────────────────────────────────
// MISTAKE 4: Lupa provide TenantContext di test
// Symptom: "TenantContext not found" di test

// ✅ Fix — provide TenantContext
const result = await Effect.runPromise(
  program.pipe(
    Effect.provide(TestLayer),
    Effect.provideService(TenantContext, mockTenant),  // ← tambahkan ini
  ),
)

// ─────────────────────────────────────────────────────────────────────────
// MISTAKE 5: Return domain type dari program, bukan DTO
// Symptom: hashedPassword atau internal field bocor ke response

// ❌ Wrong
const getUser = (id: string) =>
  Effect.gen(function* () {
    const repo = yield* IUserRepository
    return yield* repo.findById(id as TUserId)  // return TUser langsung!
  })

// ✅ Fix — always map ke DTO
const getUser = (id: string) =>
  Effect.gen(function* () {
    const repo = yield* IUserRepository
    const user = yield* repo.findById(id as TUserId)
    if (!user) yield* Effect.fail(new UserNotFoundError({ id }))
    return toUserDto(user!)  // ← map ke DTO sebelum return
  })
```

---

## 29. Daftar Isi — Complete

Dokumen ini mencakup **29 section** dan dapat digunakan sebagai referensi untuk project TypeScript FP apapun.

| Section | Judul | Scope |
|---|---|---|
| 1 | Paradigma & Prinsip Dasar | FP + Vertical Slice, class exception |
| 2 | Struktur Folder | Template universal |
| 3 | Naming Conventions | Type prefix, suffix, function naming |
| 4 | Dependency Rules | No cycles, import matrix, enforcement |
| 5 | FP Rules | Data, function, composition, module |
| 6 | Effect-TS Rules | Pipeline, pipe vs gen, error, Layer, Schema |
| 7 | TypeScript Rules | Strict mode, type rules, import rules |
| 8 | Domain Layer Rules | Types, errors, module, repo, programs, DTO, barrel |
| 9 | Infrastructure & Adapter Rules | Adapter pattern, DB, env, runtime |
| 10 | Presentation Layer Rules | API route pattern, middleware |
| 11 | Component Rules | Function component, hooks, CSS module |
| 12 | Testing Standards | Unit, integration, snapshot, API, regression, E2E, perf |
| 13 | Tooling Rules | Biome, lefthook, scripts |
| 14 | Git & CI Rules | Commit, branch, pipeline |
| 15 | Violation Severity | Severity levels, auto-enforce, PR checklist |
| 16 | FP Patterns Reference | 7 before/after patterns |
| 17 | Shared Types Template | complete common.types.ts |
| 18 | Effect Error Handling | 10 patterns lengkap |
| 19 | Glossary | 16 term FP/Effect |
| 20 | Testing Lanjutan | Contract, load, doubles, anti-patterns, naming |
| 21 | The Twelve-Factor App | 12 factor + compliance checklist |
| 22 | Engineering Principles | SOLID, DRY, KISS, YAGNI, SoC, POLA, dll |
| 23 | Security Standards | Auth, RBAC, input validation, secrets |
| 24 | Performance Standards | Response time targets, DB, caching, bundle |
| 25 | API Design Standards | URL convention, HTTP semantics, response format |
| 26 | Database Standards | Schema design, migration, index naming |
| 27 | Observability Standards | Logging structure, what to log, health check |
| 28 | Onboarding Guide | Setup, reading order, first task, common mistakes |
| 29 | Daftar Isi Complete | Index dokumen ini |
