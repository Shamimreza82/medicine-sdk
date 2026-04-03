# Medicine SDK: Build and Working Details

## Overview
This project is a TypeScript SDK (`@reza/medicine-sdk`) that provides a typed client for a Medicine API.  
It wraps HTTP calls, authentication, retries, middleware, optional caching, and resource-specific methods.

## Tech Stack
- Language: TypeScript
- Runtime target: Node.js `>=18`
- HTTP client: `axios`
- Build tool: `tsup`
- Type declarations: generated in `dist` during build
- Module outputs: ESM + CommonJS

## Project Structure
- `src/index.ts`: package public exports
- `src/client.ts`: `MedicineSDK` class and plugin/middleware registration
- `src/config.ts`: config and middleware/plugin type definitions
- `src/utils/request.ts`: core `HttpClient` implementation
- `src/utils/query-builder.ts`: query parameter builder
- `src/resources/medicines.ts`: medicines endpoints
- `src/resources/generics.ts`: generics endpoints
- `src/resources/brands.ts`: brands endpoints
- `src/errors/api-error.ts`: unified API error model
- `src/types/medicine.types.ts`: response/request domain types
- `tsup.config.ts`: bundling config
- `package.json`: scripts, exports, dependencies

## How It Is Built
1. Source code is written in `src/` as TypeScript.
2. Build command runs:
   - `npm run clean` -> removes `dist/`
   - `tsup` -> bundles SDK to ESM/CJS and generates type declarations
3. Build artifacts are emitted in `dist/`:
   - `index.js` (ESM)
   - `index.cjs` (CommonJS)
   - `index.d.ts` (types)
4. `package.json` exports map points consumers to the right file based on import style.
5. `prepublishOnly` ensures build runs before publish.

## Build and Publish Commands
- `npm run dev`: watch mode build
- `npm run build`: production build
- `npm run publish:npm`: publish package (public)

## Core Runtime Design
### 1) Entry API
`MedicineSDK` creates a single shared `HttpClient` and exposes:
- `sdk.medicines`
- `sdk.generics`
- `sdk.brands`

Each resource receives the same client, so auth, retry, middleware, timeout, and cache behavior are consistent.

### 2) Config and Defaults
`SDKConfig` supports:
- `apiKey` or `bearerToken`
- `baseURL`
- `timeoutMs`
- `maxRetries`, `retryDelayMs`
- `debug`
- `userAgent`
- `cacheEnabled`, `cacheTtlMs`

Default runtime values (inside `HttpClient`):
- `baseURL`: `https://api.reza.com`
- `timeoutMs`: `10000`
- `maxRetries`: `2`
- `retryDelayMs`: `400`
- `cacheEnabled`: `false`
- `cacheTtlMs`: `30000`

### 3) Authentication
For each request (unless `skipAuth` is true):
- Uses `ApiKey <apiKey>` if `apiKey` is provided
- Else uses `Bearer <bearerToken>` if provided
- Else no `Authorization` header

### 4) Request Lifecycle
Each resource method eventually calls:
`HttpClient.request<TResponse, TData>(requestConfig)`

Flow:
1. Build cache key from method/path/params/data.
2. If GET + cache enabled, return cached value when valid.
3. Compose Axios request config (URL, method, params, body, timeout, signal, headers).
4. Run request middlewares in registration order.
5. Execute Axios request.
6. Optionally log debug line: `[MedicineSDK] METHOD /path -> status`.
7. Run response middlewares in registration order.
8. Cache transformed response if GET + cache enabled.
9. Return transformed response data.

### 5) Retry Strategy
Retries are handled in a loop with backoff.

Retry conditions:
- HTTP `429` always retry (until max retries reached)
- HTTP `5xx` retry only for idempotent methods (`GET`, `HEAD`, `OPTIONS`)
- network/no-status errors retry only for idempotent methods

Backoff:
- If response has `Retry-After`, SDK parses and uses it
- Otherwise exponential delay:
  - `retryDelayMs * 2^(attempt-1)`

### 6) Error Handling
If retries are exhausted:
- Axios errors are converted to `APIError` via `APIError.fromAxiosError`
- `APIError` includes:
  - `message`
  - `statusCode`
  - `code` (if provided by API)
  - `details`
  - `requestId` (from payload or `x-request-id` header)

If processed error is non-Axios and non-Error, SDK throws a fallback `APIError`.

### 7) Middleware and Plugins
Supported middleware types:
- Request middleware: modify outgoing Axios config
- Response middleware: transform response data
- Error middleware: normalize/transform thrown errors

Plugins can install these hooks through:
- `sdk.usePlugin(plugin)`

`plugin.setup()` receives hook registration functions bound to the internal client.

## Resource Layer Behavior
All resources use `QueryBuilder` for consistent query params.

### Medicines Resource
- `getAll(params, options)` -> `GET /v1/medicines`
- `getAllMedicines(...)` -> alias of `getAll`
- `getById(id, options)` -> `GET /v1/medicines/{id}`
- `getMedicineById(...)` -> alias of `getById`
- `search(params, options)` -> `GET /v1/medicines/search`
- `searchMedicines(query, params, options)` -> alias wrapper for `search`

### Generics Resource
- `getAll(params, options)` -> `GET /v1/generics`
- `getById(id, options)` -> `GET /v1/generics/{id}`
- `search(query, params, options)` -> `GET /v1/generics/search`

### Brands Resource
- `getAll(params, options)` -> `GET /v1/brands`
- `getById(id, options)` -> `GET /v1/brands/{id}`
- `search(query, params, options)` -> `GET /v1/brands/search`

## Query Builder Logic
`QueryBuilder` supports:
- pagination: `page`, `limit`
- sorting: `sortBy`, `sortOrder`
- filters object flattening

Filter arrays are serialized as comma-separated values.
Undefined filter values are skipped.

## Type System
Core types define:
- Entity models: `Medicine`, `Generic`, `Brand`
- Response wrappers: `ApiResponse<T>`, `PaginatedResponse<T>`
- Pagination metadata: `PaginationMeta`
- Request params: list/search/filter interfaces

This gives strong compile-time safety for consumer apps.

## Package Export Behavior
From `package.json`:
- `main`: `./dist/index.cjs`
- `module`: `./dist/index.js`
- `types`: `./dist/index.d.ts`
- `exports` map supports both import and require
- `sideEffects: false` helps tree-shaking

## Typical Runtime Example
1. App creates SDK instance with config.
2. App calls resource method like `sdk.medicines.getAll({ page: 1 })`.
3. Resource builds query object and delegates to `HttpClient`.
4. `HttpClient` applies auth + middleware + retry/caching logic.
5. API response data is returned as typed object.
6. App handles data or catches `APIError`.

## Notes for Maintenance
- To change endpoints, edit `src/resources/*.ts`.
- To change retry/caching/global request behavior, edit `src/utils/request.ts`.
- To add new API areas, create a new resource class and expose it in `MedicineSDK`.
- Keep `README.md` and this doc synced when behaviors change.
