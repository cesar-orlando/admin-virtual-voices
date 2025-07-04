import type { ApiError } from '../types/common';

export const handleError = (error: ApiError): string => {
  const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
  return errorMessage;
};

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
