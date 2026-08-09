/**
 * Standard response envelope.
 *
 * Shape matches the frontend API contract (`{ isSuccess, isError, errors,
 * topError, value }`) defined in each role app's
 * `docs/needed-endpoints-from-backend/_shared.md` — the backend must speak
 * the frontend's language, so this takes precedence over a generic
 * `{ success, message, data }` shape.
 */
export interface ApiErrorInfo {
  code: string;
  httpStatus: number;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  isError: boolean;
  errors: string[];
  topError: ApiErrorInfo | null;
  value: T;
}

/** Convenience helpers for building responses in controllers/services. */
export const ok = <T>(value: T): ApiResponse<T> => ({
  isSuccess: true,
  isError: false,
  errors: [],
  topError: null,
  value,
});
