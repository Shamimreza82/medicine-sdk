import type {
  ErrorMiddleware,
  RequestMiddleware,
  ResponseMiddleware,
  SDKConfig,
  SDKPlugin,
} from "./config";
import { BrandsResource } from "./resources/brands";
import { GenericsResource } from "./resources/generics";
import { MedicinesResource } from "./resources/medicines";
import { HttpClient } from "./utils/request";

export class MedicineSDK {
  public readonly medicines: MedicinesResource;
  public readonly generics: GenericsResource;
  public readonly brands: BrandsResource;
  private readonly http: HttpClient;

  constructor(config: SDKConfig = {}) {
    this.http = new HttpClient(config);

    this.medicines = new MedicinesResource(this.http);
    this.generics = new GenericsResource(this.http);
    this.brands = new BrandsResource(this.http);
  }

  /**
   * Register request middleware for cross-cutting concerns like tracing.
   */
  useRequestMiddleware(middleware: RequestMiddleware): this {
    this.http.useRequestMiddleware(middleware);
    return this;
  }

  /**
   * Register response middleware for response transformations.
   */
  useResponseMiddleware<T>(middleware: ResponseMiddleware<T>): this {
    this.http.useResponseMiddleware<T>(middleware);
    return this;
  }

  /**
   * Register error middleware to normalize or enrich errors.
   */
  useErrorMiddleware(middleware: ErrorMiddleware): this {
    this.http.useErrorMiddleware(middleware);
    return this;
  }

  /**
   * Install an SDK plugin.
   */
  usePlugin(plugin: SDKPlugin): this {
    plugin.setup({
      useRequestMiddleware: this.http.useRequestMiddleware.bind(this.http),
      useResponseMiddleware: this.http.useResponseMiddleware.bind(this.http),
      useErrorMiddleware: this.http.useErrorMiddleware.bind(this.http),
    });
    return this;
  }
}
