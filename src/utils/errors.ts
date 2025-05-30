import { ApiError } from '../types/index.js';

export class IconectError extends Error {
  constructor(
    message: string,
    public code: string = 'ICONECT_ERROR',
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'IconectError';
  }

  static fromApiError(apiError: ApiError): IconectError {
    return new IconectError(
      apiError.message,
      apiError.code,
      apiError.statusCode,
      apiError.details
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }

  static authenticationError(message: string): IconectError {
    return new IconectError(message, 'AUTHENTICATION_ERROR', 401);
  }

  static authorizationError(message: string): IconectError {
    return new IconectError(message, 'AUTHORIZATION_ERROR', 403);
  }

  static validationError(message: string, details?: unknown): IconectError {
    return new IconectError(message, 'VALIDATION_ERROR', 400, details);
  }

  static notFoundError(message: string): IconectError {
    return new IconectError(message, 'NOT_FOUND', 404);
  }

  static internalError(message: string): IconectError {
    return new IconectError(message, 'INTERNAL_ERROR', 500);
  }

  static timeoutError(message: string): IconectError {
    return new IconectError(message, 'REQUEST_TIMEOUT', 408);
  }
}

export class AuthenticationError extends IconectError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends IconectError {
  constructor(message: string = 'Authorization failed', details?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends IconectError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends IconectError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends IconectError {
  constructor(message: string = 'Rate limit exceeded', details?: unknown) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends IconectError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 'SERVER_ERROR', 500, details);
    this.name = 'ServerError';
  }
}

export function createErrorFromStatus(statusCode: number, message: string, details?: unknown): IconectError {
  switch (statusCode) {
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 400:
      return new ValidationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 429:
      return new RateLimitError(message, details);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, details);
    default:
      return new IconectError(message, 'HTTP_ERROR', statusCode, details);
  }
}