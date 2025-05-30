import axios, { AxiosInstance } from 'axios';
import { HttpClient } from '../../client/http-client';
import { IconectConfig } from '../../types';
import { IconectError } from '../../utils/errors';

jest.mock('axios');

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let config: IconectConfig;
  let axiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    config = {
      baseUrl: 'https://api.test.com',
      clientId: 'test-client-id',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };

    axiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn(),
          eject: jest.fn(),
        },
      },
      defaults: {
        headers: {
          common: {},
        },
      },
    } as any;

    (axios.create as jest.Mock).mockReturnValue(axiosInstance);
    httpClient = new HttpClient(config);
  });

  describe('initialization', () => {
    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: config.baseUrl,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'iconect-mcp-server/1.0.0',
        },
      });
    });

    it('should setup interceptors', () => {
      expect(axiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(axiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      axiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await httpClient.get('/test');

      expect(axiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockData);
    });

    it('should make POST request', async () => {
      const mockData = { id: 1, name: 'Test' };
      const postData = { name: 'Test' };
      axiosInstance.post.mockResolvedValue({ data: mockData });

      const result = await httpClient.post('/test', postData);

      expect(axiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated' };
      axiosInstance.put.mockResolvedValue({ data: mockData });

      const result = await httpClient.put('/test/1', putData);

      expect(axiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
      expect(result).toEqual(mockData);
    });

    it('should make DELETE request', async () => {
      axiosInstance.delete.mockResolvedValue({ data: { success: true } });

      const result = await httpClient.delete('/test/1');

      expect(axiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual({ success: true });
    });
  });

  describe('setAuthToken', () => {
    it('should set authorization header', () => {
      httpClient.setAuthToken('test-token');

      expect(axiosInstance.defaults.headers.common['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('clearAuthToken', () => {
    it('should remove authorization header', () => {
      httpClient.setAuthToken('test-token');
      httpClient.clearAuthToken();

      expect(axiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid request parameters',
            },
          },
        },
      };

      axiosInstance.get.mockRejectedValue(apiError);

      await expect(httpClient.get('/test')).rejects.toThrow(IconectError);

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(IconectError);
        expect((error as IconectError).message).toBe('Invalid request parameters');
        expect((error as IconectError).code).toBe('INVALID_REQUEST');
        expect((error as IconectError).statusCode).toBe(400);
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      axiosInstance.get.mockRejectedValue(networkError);

      await expect(httpClient.get('/test')).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'Request timeout',
      };

      axiosInstance.get.mockRejectedValue(timeoutError);

      await expect(httpClient.get('/test')).rejects.toThrow(IconectError);

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(IconectError);
        expect((error as IconectError).code).toBe('REQUEST_TIMEOUT');
      }
    });
  });

  describe('retry logic', () => {
    it('should retry on 5xx errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: { message: 'Server Error' } },
        },
      };

      axiosInstance.get
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await httpClient.get('/test');

      expect(axiosInstance.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it('should not retry on 4xx errors', async () => {
      const clientError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'BAD_REQUEST',
              message: 'Bad Request',
            },
          },
        },
      };

      axiosInstance.get.mockRejectedValue(clientError);

      await expect(httpClient.get('/test')).rejects.toThrow(IconectError);
      expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: { message: 'Server Error' } },
        },
      };

      axiosInstance.get.mockRejectedValue(serverError);

      await expect(httpClient.get('/test')).rejects.toThrow(IconectError);
      expect(axiosInstance.get).toHaveBeenCalledTimes(config.maxRetries + 1);
    });
  });
});