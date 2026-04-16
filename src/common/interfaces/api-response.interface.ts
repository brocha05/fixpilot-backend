export interface ResponseMeta {
  requestId: string;
}

export interface PaginatedMeta extends ResponseMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuccessApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta: ResponseMeta;
}

export interface PaginatedApiResponse<T = unknown> {
  success: true;
  data: T[];
  message?: string;
  meta: PaginatedMeta;
}

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ErrorApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
  meta: ResponseMeta;
}

export type ApiResponse<T = unknown> = SuccessApiResponse<T> | ErrorApiResponse;

// Internal contract returned by service list methods
export interface PaginatedServiceResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
