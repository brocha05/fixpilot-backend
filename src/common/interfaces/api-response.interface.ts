export interface ResponseMeta {
  requestId: string;
}

export interface SuccessApiResponse<T = unknown> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorApiResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  meta: Pick<ResponseMeta, 'requestId'>;
}

export type ApiResponse<T = unknown> = SuccessApiResponse<T> | ErrorApiResponse;

// Duck-type contract matching UsersService.findAll shape
export interface PaginatedServiceResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number; // UsersService uses "pages" — normalized to "totalPages" in meta
}
