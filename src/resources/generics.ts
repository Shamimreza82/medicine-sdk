import type { RequestOptions } from "../config";
import type {
  ApiResponse,
  Generic,
  ListGenericsParams,
  PaginatedResponse,
} from "../types/medicine.types";
import { QueryBuilder } from "../utils/query-builder";
import type { HttpClient } from "../utils/request";

export class GenericsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Fetch a paginated list of generics.
   */
  async getAll(
    params: ListGenericsParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Generic>> {
    const query = new QueryBuilder()
      .listParams(params)
      .filters(params.filters)
      .build();

    return this.client.request<PaginatedResponse<Generic>>({
      method: "GET",
      path: "/v1/generics",
      params: query,
      ...options,
    });
  }

  /**
   * Fetch one generic by id.
   */
  async getById(id: string, options?: RequestOptions): Promise<ApiResponse<Generic>> {
    return this.client.request<ApiResponse<Generic>>({
      method: "GET",
      path: `/v1/generics/${encodeURIComponent(id)}`,
      ...options,
    });
  }

  /**
   * Search generics by query.
   */
  async search(
    query: string,
    params: Omit<ListGenericsParams, "filters"> & { filters?: ListGenericsParams["filters"] } = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Generic>> {
    const built = new QueryBuilder()
      .listParams(params)
      .filters(params.filters)
      .build({ query });

    return this.client.request<PaginatedResponse<Generic>>({
      method: "GET",
      path: "/v1/generics/search",
      params: built,
      ...options,
    });
  }
}
