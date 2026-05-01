/**
 * Centralized API error handler
 * Returns user-friendly messages and categorises errors.
 */

import { AxiosError } from 'axios';

export type AppErrorCode =
  | 'NETWORK_ERROR'
  | 'AUTH_EXPIRED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
  statusCode?: number;
  raw?: unknown;
}

export function parseApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMsg = error.response?.data?.error || error.response?.data?.message;

    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'No internet connection. Please check your network.',
        raw: error,
      };
    }

    if (status === 401) {
      return {
        code: 'AUTH_EXPIRED',
        message: 'Your session has expired. Please log in again.',
        statusCode: 401,
        raw: error,
      };
    }

    if (status === 404) {
      return {
        code: 'NOT_FOUND',
        message: serverMsg || 'The requested resource was not found.',
        statusCode: 404,
        raw: error,
      };
    }

    if (status === 422 || status === 400) {
      return {
        code: 'VALIDATION_ERROR',
        message: serverMsg || 'Invalid input. Please check your details.',
        statusCode: status,
        raw: error,
      };
    }

    if (status && status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Something went wrong on our end. Please try again.',
        statusCode: status,
        raw: error,
      };
    }

    return {
      code: 'UNKNOWN',
      message: serverMsg || error.message || 'An unexpected error occurred.',
      statusCode: status,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      message: error.message,
      raw: error,
    };
  }

  return {
    code: 'UNKNOWN',
    message: 'An unexpected error occurred.',
    raw: error,
  };
}

/**
 * Extract just the friendly message string from any error.
 */
export function getErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}
