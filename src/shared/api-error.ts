/**
 * Standard API error response helper.
 * All API endpoints should use this for consistent error format:
 *
 *   const err = apiError(400, 'validation_error', 'Invalid input');
 *   return new Response(JSON.stringify(err), { status: 400, headers: JSON_HEADERS });
 *
 * For field-level errors pass details[].
 */
export const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

export interface ApiFieldError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiFieldError[];
  };
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: ApiFieldError[],
): ApiErrorResponse {
  const body: ApiErrorResponse = { error: { code, message } };
  if (details?.length) body.error.details = details;
  return body;
}

export function apiSuccess<T>(data: T): { data: T } {
  return { data };
}
