import type { RequestOptions } from "../config";
import type { HttpClient } from "../utils/request";
import { QueryBuilder } from "../utils/query-builder";
import type {
  ApiResponse,
  ListMedicinesParams,
  Medicine,
  PaginatedResponse,
  SearchParams,
} from "../types/medicine.types";

export class MedicinesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Fetch a paginated list of medicines.
   */
  async getAll(
    params: ListMedicinesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Medicine>> {
    const query = new QueryBuilder()
      .listParams(params)
      .filters(params.filters)
      .build();

    return this.client.request<PaginatedResponse<Medicine>>({
      method: "GET",
      path: "/v1/medicines",
      params: query,
      ...options,
    });
  }

  /**
   * Alias for getAll to support explicit method naming.
   */
  async getAllMedicines(
    params: ListMedicinesParams = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Medicine>> {
    return this.getAll(params, options);
  }

  /**
   * Fetch one medicine by its unique ID.
   */
  async getById(id: string, options?: RequestOptions): Promise<ApiResponse<Medicine>> {
    return this.client.request<ApiResponse<Medicine>>({
      method: "GET",
      path: `/v1/medicines/${encodeURIComponent(id)}`,
      ...options,
    });
  }

  /**
   * Alias for getById to match explicit resource naming.
   */
  async getMedicineById(id: string, options?: RequestOptions): Promise<ApiResponse<Medicine>> {
    return this.getById(id, options);
  }

  /**
   * Search medicines using free-text query with optional pagination and filters.
   */
  async search(
    params: SearchParams,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Medicine>> {
    const query = new QueryBuilder()
      .listParams(params)
      .filters(params.filters)
      .build({ query: params.query });

    return this.client.request<PaginatedResponse<Medicine>>({
      method: "GET",
      path: "/v1/medicines/search",
      params: query,
      ...options,
    });
  }

  /**
   * Alias for search to match required naming.
   */
  async searchMedicines(
    query: string,
    params: Omit<SearchParams, "query"> = {},
    options?: RequestOptions,
  ): Promise<PaginatedResponse<Medicine>> {
    return this.search({ query, ...params }, options);
  }
}
