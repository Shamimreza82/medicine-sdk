import type { FilterParams, ListParams } from "../types/medicine.types";

export class QueryBuilder {
  private readonly query: Record<string, unknown> = {};

  page(value?: number): this {
    if (typeof value === "number") {
      this.query.page = value;
    }
    return this;
  }

  limit(value?: number): this {
    if (typeof value === "number") {
      this.query.limit = value;
    }
    return this;
  }

  sortBy(value?: string): this {
    if (value) {
      this.query.sortBy = value;
    }
    return this;
  }

  sortOrder(value?: "asc" | "desc"): this {
    if (value) {
      this.query.sortOrder = value;
    }
    return this;
  }

  filters(filters?: FilterParams): this {
    if (!filters) {
      return this;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "undefined") {
        return;
      }
      this.query[key] = Array.isArray(value) ? value.join(",") : value;
    });

    return this;
  }

  listParams(params?: ListParams): this {
    return this
      .page(params?.page)
      .limit(params?.limit)
      .sortBy(params?.sortBy)
      .sortOrder(params?.sortOrder);
  }

  build(extra?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.query,
      ...(extra ?? {}),
    };
  }
}
