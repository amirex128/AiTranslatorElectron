/**
 * Standard error response format for IPC handlers
 */
export interface ErrorResponse {
  success: false;
  error: string;
}

/**
 * Standard success response format for IPC handlers
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Union type for IPC handler responses
 */
export type IPCResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Creates a success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

/**
 * Creates an error response
 */
export function createErrorResponse(error: string | Error): ErrorResponse {
  const errorMessage = error instanceof Error ? error.message : error;
  return { success: false, error: errorMessage };
}

