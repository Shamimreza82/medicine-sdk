import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type {
  ErrorMiddleware,
  RequestConfig,
  RequestMiddleware,
  ResponseMiddleware,
  SDKConfig,
} from "../config";
import { APIError } from "../errors/api-error";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}


const DEFAULT_BASE_URL = "https://api.reza.com";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 400;
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (retryAfter?: string): number | null => {
  if (!retryAfter) {
    return null;
  }

  const asSeconds = Number(retryAfter);
  if (!Number.isNaN(asSeconds)) {
    return asSeconds * 1000;
  }

  const targetDate = Date.parse(retryAfter);
  if (!Number.isNaN(targetDate)) {
    return Math.max(0, targetDate - Date.now());
  }

  return null;
};

export class HttpClient {
  private readonly axios: AxiosInstance;
  private readonly config: Required<
    Pick<SDKConfig, "baseURL" | "timeoutMs" | "maxRetries" | "retryDelayMs" | "debug" | "cacheEnabled" | "cacheTtlMs">
  > &
    Omit<SDKConfig, "baseURL" | "timeoutMs" | "maxRetries" | "retryDelayMs" | "debug" | "cacheEnabled" | "cacheTtlMs">;
  private readonly requestMiddlewares: RequestMiddleware[] = [];
  private readonly responseMiddlewares: Array<ResponseMiddleware<unknown>> = [];
  private readonly errorMiddlewares: ErrorMiddleware[] = [];
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(config: SDKConfig) {
    this.config = {
      baseURL: config.baseURL ?? DEFAULT_BASE_URL,
      timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelayMs: config.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
      debug: config.debug ?? false,
      cacheEnabled: config.cacheEnabled ?? false,
      cacheTtlMs: config.cacheTtlMs ?? 30_000,
      ...config,
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(this.config.userAgent ? { "User-Agent": this.config.userAgent } : {}),
      },
    });
  }

  useRequestMiddleware(middleware: RequestMiddleware): void {
    this.requestMiddlewares.push(middleware);
  }

  useResponseMiddleware<T>(middleware: ResponseMiddleware<T>): void {
    this.responseMiddlewares.push(middleware as ResponseMiddleware<unknown>);
  }

  useErrorMiddleware(middleware: ErrorMiddleware): void {
    this.errorMiddlewares.push(middleware);
  }

  private getAuthHeader(): string | null {
    if (this.config.apiKey) {
      return `ApiKey ${this.config.apiKey}`;
    }

    if (this.config.bearerToken) {
      return `Bearer ${this.config.bearerToken}`;
    }

    return null;
  }

  private cacheKey(request: RequestConfig): string {
    return JSON.stringify({
      method: request.method,
      path: request.path,
      params: request.params ?? {},
      data: request.data ?? {},
    });
  }

  private isCacheable(method: string): boolean {
    return method.toUpperCase() === "GET" && this.config.cacheEnabled;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  private setCache<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.config.cacheTtlMs,
    });
  }

  private shouldRetry(error: AxiosError, attempt: number, method: string): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    const normalizedMethod = method.toUpperCase();
    const idempotent = IDEMPOTENT_METHODS.has(normalizedMethod);
    const status = error.response?.status;

    if (status === 429) {
      return true;
    }

    if (typeof status === "number" && status >= 500 && idempotent) {
      return true;
    }

    if (!status && idempotent) {
      return true;
    }

    return false;
  }

  private async runRequestMiddlewares(
    config: AxiosRequestConfig,
  ): Promise<AxiosRequestConfig> {
    let current = config;
    for (const middleware of this.requestMiddlewares) {
      current = await middleware(current);
    }
    return current;
  }

  private async runResponseMiddlewares<T>(response: T): Promise<T> {
    let current = response as unknown;
    for (const middleware of this.responseMiddlewares) {
      current = await middleware(current);
    }
    return current as T;
  }

  private async runErrorMiddlewares(error: unknown): Promise<unknown> {
    let current = error;
    for (const middleware of this.errorMiddlewares) {
      current = await middleware(current);
    }
    return current;
  }

  async request<TResponse = unknown, TData = unknown>(
    request: RequestConfig<TData>,
  ): Promise<TResponse> {
    const method = request.method.toUpperCase();
    const key = this.cacheKey(request);

    if (this.isCacheable(method)) {
      const cached = this.getFromCache<TResponse>(key);
      if (cached !== null) {
        return cached;
      }
    }

    const authHeader = request.skipAuth ? null : this.getAuthHeader();
    let attempt = 0;

    while (true) {
      try {
        let config: AxiosRequestConfig<TData> = {
          url: request.path,
          method,
          params: request.params,
          data: request.data,
          timeout: request.timeoutMs ?? this.config.timeoutMs,
          signal: request.signal,
          headers: {
            ...(authHeader ? { Authorization: authHeader } : {}),
            ...request.headers,
          },
        };

        config = await this.runRequestMiddlewares(config);
        const response = await this.axios.request<
          TResponse,
          AxiosResponse<TResponse>,
          TData
        >(config);

        if (this.config.debug) {
          // eslint-disable-next-line no-console
          console.debug(`[MedicineSDK] ${method} ${request.path} -> ${response.status}`);
        }

        const transformed = await this.runResponseMiddlewares(response.data);
        if (this.isCacheable(method)) {
          this.setCache(key, transformed);
        }

        return transformed;
      } catch (error) {
        const processed = await this.runErrorMiddlewares(error);
        const axiosError = processed as AxiosError;

        if (axios.isAxiosError(axiosError) && this.shouldRetry(axiosError, attempt, method)) {
          attempt += 1;
          const retryAfter = parseRetryAfterMs(
            axiosError.response?.headers?.["retry-after"] as string | undefined,
          );
          const backoff = retryAfter ?? this.config.retryDelayMs * Math.pow(2, attempt - 1);
          await sleep(backoff);
          continue;
        }

        if (axios.isAxiosError(axiosError)) {
          throw APIError.fromAxiosError(axiosError);
        }

        if (processed instanceof Error) {
          throw processed;
        }

        throw new APIError("The API request failed due to an unknown error.");
      }
    }
  }
}
