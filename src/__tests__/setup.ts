// Jest setup file
import { jest } from '@jest/globals';

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'ERROR';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
export const mockResponse = <T>(data: T, status = 200) => {
  return Promise.resolve({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  });
};

export const mockError = (message: string, code: string, status = 400) => {
  const error = new Error(message) as any;
  error.response = {
    status,
    data: {
      error: {
        code,
        message,
      },
    },
  };
  return Promise.reject(error);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});