import { IconectError } from '../../utils/errors';

describe('IconectError', () => {
  it('should create error with message and code', () => {
    const error = new IconectError('Test error message', 'TEST_ERROR');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(IconectError);
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.statusCode).toBeUndefined();
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('IconectError');
  });

  it('should create error with status code', () => {
    const error = new IconectError('Not found', 'NOT_FOUND', 404);

    expect(error.message).toBe('Not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('should create error with details', () => {
    const details = { field: 'email', reason: 'invalid format' };
    const error = new IconectError('Validation error', 'VALIDATION_ERROR', 400, details);

    expect(error.message).toBe('Validation error');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
  });

  it('should have proper stack trace', () => {
    const error = new IconectError('Stack trace test', 'STACK_TEST');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('IconectError');
    expect(error.stack).toContain('Stack trace test');
  });

  it('should serialize to JSON properly', () => {
    const error = new IconectError('JSON test', 'JSON_ERROR', 500, { extra: 'data' });
    const json = JSON.parse(JSON.stringify(error));

    expect(json.name).toBe('IconectError');
    expect(json.message).toBe('JSON test');
    expect(json.code).toBe('JSON_ERROR');
    expect(json.statusCode).toBe(500);
    expect(json.details).toEqual({ extra: 'data' });
  });

  describe('static helper methods', () => {
    it('should create authentication error', () => {
      const error = IconectError.authenticationError('Invalid credentials');

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should create authorization error', () => {
      const error = IconectError.authorizationError('Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
    });

    it('should create validation error', () => {
      const error = IconectError.validationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create not found error', () => {
      const error = IconectError.notFoundError('Resource not found');

      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });

    it('should create internal error', () => {
      const error = IconectError.internalError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should create timeout error', () => {
      const error = IconectError.timeoutError('Request timed out');

      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe('REQUEST_TIMEOUT');
      expect(error.statusCode).toBe(408);
    });
  });

  describe('error comparison', () => {
    it('should be equal when code matches', () => {
      const error1 = new IconectError('Error 1', 'SAME_CODE');
      const error2 = new IconectError('Error 2', 'SAME_CODE');

      expect(error1.code).toBe(error2.code);
    });

    it('should be different when code differs', () => {
      const error1 = new IconectError('Error', 'CODE_1');
      const error2 = new IconectError('Error', 'CODE_2');

      expect(error1.code).not.toBe(error2.code);
    });
  });
});