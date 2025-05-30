import axios, { AxiosInstance } from 'axios';
import { HttpClient } from '../../client/http-client.js';
import { IconectConfig } from '../../types/index.js';
import { IconectError } from '../../utils/errors.js';

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
        baseURL: `${config.baseUrl}/v1`,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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

  describe('setTokens', () => {
    it('should set tokens', () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
        scope: 'read write',
      };

      httpClient.setTokens(tokens);
      
      expect(httpClient.getTokens()).toEqual(tokens);
    });
  });

  describe('clearTokens', () => {
    it('should clear tokens', () => {
      const tokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        tokenType: 'Bearer',
        scope: 'read write',
      };

      httpClient.setTokens(tokens);
      httpClient.clearTokens();

      expect(httpClient.getTokens()).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const apiError = {
        response: {
          status: 400,
          data: {
            message: 'Invalid request parameters',
          },
        },
        config: {},
        isAxiosError: true,
      };

      axiosInstance.get.mockRejectedValue(apiError);

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      axiosInstance.get.mockRejectedValue(networkError);

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

});