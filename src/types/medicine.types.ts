export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  requestId?: string;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FilterParams {
  [key: string]: string | number | boolean | Array<string | number | boolean> | undefined;
}

export interface SearchParams extends ListParams {
  query: string;
  filters?: FilterParams;
}

export interface Medicine {
  id: string;
  name: string;
  genericId: string;
  brandId: string;
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Generic {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  manufacturer?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListMedicinesParams extends ListParams {
  filters?: FilterParams;
}

export interface ListGenericsParams extends ListParams {
  filters?: FilterParams;
}

export interface ListBrandsParams extends ListParams {
  filters?: FilterParams;
}
