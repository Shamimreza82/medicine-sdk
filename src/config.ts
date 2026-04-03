import type { AxiosRequestConfig, Method } from "axios";

export interface SDKConfig {
  apiKey?: string;
  bearerToken?: string;
  baseURL?: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  debug?: boolean;
  userAgent?: string;
  cacheEnabled?: boolean;
  cacheTtlMs?: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

export interface RequestConfig<TData = unknown> extends RequestOptions {
  method: Method;
  path: string;
  params?: Record<string, unknown>;
  data?: TData;
}

export type MiddlewareStage = "request" | "response" | "error";

export type RequestMiddleware = (
  config: AxiosRequestConfig,
) => AxiosRequestConfig | Promise<AxiosRequestConfig>;

export type ResponseMiddleware<T = unknown> = (response: T) => T | Promise<T>;

export type ErrorMiddleware = (error: unknown) => unknown | Promise<unknown>;

export interface SDKPlugin {
  name: string;
  setup(client: {
    useRequestMiddleware: (middleware: RequestMiddleware) => void;
    useResponseMiddleware: <T>(middleware: ResponseMiddleware<T>) => void;
    useErrorMiddleware: (middleware: ErrorMiddleware) => void;
  }): void;
}
