import type { AxiosError } from "axios";

export interface ApiErrorShape {
  message?: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

export class APIError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(message: string, statusCode = 500, shape: ApiErrorShape = {}) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.code = shape.code;
    this.details = shape.details;
    this.requestId = shape.requestId;
  }

  static fromAxiosError(error: AxiosError): APIError {
    const statusCode = error.response?.status ?? 500;
    const data = (error.response?.data ?? {}) as ApiErrorShape;

    const message =
      data.message ??
      error.message ??
      "The API request failed due to an unknown error.";

    return new APIError(message, statusCode, {
      code: data.code,
      details: data.details ?? error.toJSON?.(),
      requestId:
        data.requestId ??
        (error.response?.headers?.["x-request-id"] as string | undefined),
    });
  }
}
