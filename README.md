# @reza9167/medicine-sdk

Production-ready TypeScript SDK for the Medicine API.

## Installation

```bash
npm install @reza9167/medicine-sdk
```

## Quick Start

```ts
import { MedicineSDK } from "@reza9167/medicine-sdk";

const sdk = new MedicineSDK({
  apiKey: "test_key",
  baseURL: "https://api.reza9167.com",
  timeoutMs: 10000,
  maxRetries: 2,
  debug: true,
});

const medicines = await sdk.medicines.getAll();
console.log(medicines.data);
```

## Authentication

You can authenticate with either API Key or Bearer token:

```ts
const sdkByApiKey = new MedicineSDK({
  apiKey: "your-api-key",
});

const sdkByBearer = new MedicineSDK({
  bearerToken: "your-jwt-token",
});
```

## Resource APIs

### Medicines

```ts
// Paginated list
await sdk.medicines.getAll({
  page: 1,
  limit: 20,
  sortBy: "name",
  sortOrder: "asc",
  filters: {
    genericId: "gen_123",
    manufacturer: "ACME Pharma",
  },
});

// Alias methods required by explicit naming
await sdk.medicines.getAllMedicines();
await sdk.medicines.getMedicineById("med_123");
await sdk.medicines.searchMedicines("napa", {
  page: 1,
  limit: 10,
});
```

### Generics

```ts
await sdk.generics.getAll({ page: 1, limit: 20 });
await sdk.generics.getById("gen_123");
await sdk.generics.search("paracetamol");
```

### Brands

```ts
await sdk.brands.getAll({ page: 1, limit: 20 });
await sdk.brands.getById("br_123");
await sdk.brands.search("beximco");
```

## Error Handling

```ts
import { APIError } from "@reza9167/medicine-sdk";

try {
  await sdk.medicines.getById("unknown");
} catch (error) {
  if (error instanceof APIError) {
    console.error(error.statusCode, error.code, error.message);
  }
}
```

## Advanced Features

- Retry logic with exponential backoff for idempotent requests
- Automatic handling for HTTP 429 using `Retry-After`
- Timeout control per-client and per-request
- Pagination and filtering helper through typed params
- Optional in-memory cache for GET requests
- Middleware hooks for request, response, and error processing
- Plugin support for extension without changing core SDK code
- Tree-shakable exports (`sideEffects: false`)

## Middleware

```ts
sdk
  .useRequestMiddleware((config) => {
    config.headers = {
      ...config.headers,
      "X-Correlation-Id": "req-123",
    };
    return config;
  })
  .useResponseMiddleware((data) => data)
  .useErrorMiddleware((error) => error);
```

## Plugin Example

```ts
import type { SDKPlugin } from "@reza9167/medicine-sdk";

const tracingPlugin: SDKPlugin = {
  name: "tracing",
  setup(client) {
    client.useRequestMiddleware((config) => {
      config.headers = {
        ...config.headers,
        "X-Trace-Id": "trace-abc",
      };
      return config;
    });
  },
};

sdk.usePlugin(tracingPlugin);
```

## Build & Publish

```bash
npm run build
npm run publish:npm
```

## API Notes

This SDK assumes the following base endpoints:

- `/v1/medicines`
- `/v1/generics`
- `/v1/brands`

If your API contract differs, update resource paths in `src/resources/*`.
