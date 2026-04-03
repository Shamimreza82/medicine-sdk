import type { RequestOptions } from "../config";
import type {
  ApiResponse,
  Brand,
  ListBrandsParams,
  PaginatedResponse,
} from "../types/medicine.types";
import { QueryBuilder } from "../utils/query-builder";
import type { HttpClient } from "../utils/request";

export class BrandsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Fetch a paginated list of brands.
   */
  async getAll(
    params: ListBrandsParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Brand>> {
    const query = new QueryBuilder()
      .listParams(params)
      .filters(params.filters)
      .build();

    return this.client.request<PaginatedResponse<Brand>>({
      method: "GET",
      path: "/v1/brands",
      params: query,
      ...options,
    });
  }

  /**
   * Fetch one brand by id.
   */
  async getById(id: string, options?: RequestOptions): Promise<ApiResponse<Brand>> {
    return this.client.request<ApiResponse<Brand>>({
      method: "GET",
      path: `/v1/brands/${encodeURIComponent(id)}`,
      ...options,
    });
  }

  /**
   * Search brands by name or keyword.
   */
  async search(
    query: string,
    params: Omit<ListBrandsParams, "filters"> & { filters?: ListBrandsParams["filters"] } = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Brand>> {
    const built = new QueryBuilder()
      .listParams(params)
      .filters(params.filters)
      .build({ query });

    return this.client.request<PaginatedResponse<Brand>>({
      method: "GET",
      path: "/v1/brands/search",
      params: built,
      ...options,
    });
  }
}
